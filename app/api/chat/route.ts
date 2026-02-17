import { insertChatMessage, getInteractionById, getChatMessages, insertQuizQuestion, getClustersByCourseId } from '@/app/db/queries';
import { NextResponse } from 'next/server';
import type { ChatMessage, GeneratedQuestionSet } from '@/app/data/structures';
import { ensureCollection } from '@/app/lib/qdrant';

function parseQuestionSet(result: string): GeneratedQuestionSet | null {
  try {
    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as GeneratedQuestionSet;
    if (parsed?.questions && Array.isArray(parsed.questions)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

const PYTHON_URL = process.env.PYTHON_API_URL ?? 'http://localhost:8000';
const MAX_CONTEXT_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 50_000;

export async function POST(request: Request) {

  try {
    const body = await request.json();
    const { chatId, courseId, content } = body as { chatId?: string; courseId?: string; content?: string };

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: `message exceeds ${MAX_MESSAGE_CHARS} character limit` }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'interaction id required' }, { status: 400 });
    }

    const interaction = getInteractionById(chatId)

    if (!interaction) {
      return NextResponse.json({ error: 'interaction does not exist' }, { status: 400 });
    }

    await ensureCollection()

    const priorMessages = getChatMessages(chatId);
    const contextMessages = priorMessages.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const topics = courseId ? getClustersByCourseId(courseId).map((c) => ({ topic: c.topic, summary: c.summary })) : undefined;

    const chatRes = await fetch(`${PYTHON_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, messages: contextMessages, course_id: courseId, topics }),
    });
    if (!chatRes.ok) throw new Error(`Chat API error ${chatRes.status}`);
    const data = (await chatRes.json()) as { response: string | null; tool_log?: { tool_name: string; args: Record<string, unknown>; result?: string; artifact?: GeneratedQuestionSet }[] };
    let assistantContent = data.response ?? '';
    if (assistantContent.length > MAX_MESSAGE_CHARS) {
      assistantContent = assistantContent.slice(0, MAX_MESSAGE_CHARS);
    }

    const toolUsage = (data.tool_log ?? []).map(({ tool_name, args, result, artifact }) => {
      const out: { tool_name: string; args: Record<string, unknown>; result?: string; artifact?: GeneratedQuestionSet } = { tool_name, args };
      if (result != null) out.result = result;
      if (artifact != null) out.artifact = artifact;
      if (tool_name === 'generate_question') {
        const parsed = artifact ?? (result ? parseQuestionSet(result) : null);
        if (parsed?.questions?.length) {
          const typeMap = { multiple_choice: 'mcq' as const, true_false: 'tf' as const };
          for (const q of parsed.questions) {
            insertQuizQuestion({
              id: crypto.randomUUID(),
              interactionId: chatId,
              question: q.text,
              type: typeMap[parsed.question_type as keyof typeof typeMap] ?? 'mcq',
              source: parsed.topic ?? undefined,
              extra: JSON.stringify({ options: q.options, correct: q.correct }),
            });
          }
        }
      }
      return out;
    });

    let userMessage: ChatMessage
    let assistantMessage: ChatMessage

    userMessage = {
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      interactionId: chatId,
      role: 'user',
      content
    }


    assistantMessage = {
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      interactionId: chatId,
      role: 'assistant',
      content: assistantContent,
      ...(toolUsage.length > 0 && { toolUsage }),
    }


    insertChatMessage(userMessage);
    insertChatMessage(assistantMessage);
    //if (title) updateInteractionTitle(interaction.id, title);

    return NextResponse.json({
      content: assistantContent,
      toolUsage: toolUsage.length > 0 ? toolUsage : undefined,
    });
  } catch (error) {
    throw error
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}
