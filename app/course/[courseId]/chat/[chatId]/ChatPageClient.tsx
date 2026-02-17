'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ChatMessage } from '@/app/data/structures';
import styles from './ChatPageClient.module.css';
const MAX_MESSAGE_CHARS = 50_000;

interface Props {
  courseId: string;
  courseName: string;
  chatId: string;
  initialMessages: ChatMessage[];
}

function CollapsibleContext({ content, courseId }: { content: string; courseId: string }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className={styles.toolResult}>
      <button
        type="button"
        className={styles.toolResultLabel}
        onClick={() => setExpanded((e) => !e)}
      >
        Context: {expanded ? '▼' : '▶'}
      </button>
      <div className={`${styles.contextCollapse} ${expanded ? styles.contextExpanded : ''}`}>
        <ContextSections content={content} courseId={courseId} />
      </div>
    </div>
  );
}

function ContextSections({ content, courseId }: { content: string; courseId: string }) {
  const sections = content.split(/(?=--- )/).filter((s) => s.trim().startsWith("---"));
  const docIds = [...new Set(sections.map((s) => {
    const raw = s.trim().split('\n')[0]?.replace(/^---\s*|\s*---$/g, '').trim() ?? '';
    const docId = raw.includes('|') ? raw.split('|', 2)[0].trim() : raw;
    return docId && docId !== 'Unknown' ? docId : null;
  }).filter(Boolean) as string[])];
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (docIds.length === 0) return;
    fetch(`/api/file-metadata?ids=${encodeURIComponent(docIds.join(','))}`)
      .then((r) => r.ok ? r.json() : {})
      .then(setNames)
      .catch(() => {});
  }, [content]);

  return (
    <div className={styles.contextSections}>
      {sections.map((section, i) => {
        const lines = section.trim().split('\n').filter(Boolean);
        const rawHeader = lines[0]?.replace(/^---\s*|\s*---$/g, '').trim() ?? '';
        const [docIdPart, exactChunk] = rawHeader.includes('|') ? rawHeader.split('|', 2) : [rawHeader, null];
        const docId = docIdPart.trim();
        const header = names[docId] ?? (docId || 'Unknown');
        const chunkLines = lines.slice(1);
        const toShow = exactChunk != null
          ? chunkLines.filter((l) => l.startsWith(`[Chunk ${exactChunk.trim()}]`))
          : chunkLines;
        return (
          <div key={i} className={styles.contextDocument}>
            <div className={styles.contextDocumentHeader}>
              {docId && docId !== 'Unknown' ? (
                <Link href={`/course/${courseId}/doc/${docId}`} className={styles.contextDocLink}>
                  {header}
                </Link>
              ) : (
                header
              )}
            </div>
            <div className={styles.contextChunks}>
              {toShow.map((line, j) => {
                const chunkMatch = line.match(/^\[Chunk (\d+)\]\s*(.*)/);
                return (
                  <div key={j} className={styles.contextChunk}>
                    {chunkMatch ? (
                      <>
                        <span className={styles.contextChunkNum}>#{chunkMatch[1]}</span>
                        <span>{chunkMatch[2]}</span>
                      </>
                    ) : (
                      line
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}



export default function ChatPageClient({
  courseId,
  courseName,
  chatId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [canSend, setCanSend] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!canSend) return;
    if (!input.trim()) return;

    const trimmed = input.trim();
    if (trimmed.length > MAX_MESSAGE_CHARS) {
      setSendError(`Message too long. Please enter a shorter message (max ${MAX_MESSAGE_CHARS} characters).`);
      return;
    }
    setSendError(null);
    setCanSend(false);
    try {
      const userMsg: ChatMessage = {
        id: `m${crypto.randomUUID()}`,
        interactionId: chatId,
        role: 'user',
        content: trimmed,
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, courseId, content: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSendError((data as { error?: string }).error ?? 'Failed to send. Please try again.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `m${crypto.randomUUID()}`,
        interactionId: chatId,
        role: 'assistant',
        content: data.content ?? 'Something went wrong.',
        sentAt: new Date().toISOString(),
        ...(data.toolUsage?.length && { toolUsage: data.toolUsage }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setSendError('Failed to send. Please try again.');
    } finally {
      setCanSend(true);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href={`/courses`} className={styles.backLink}>
          ← Courses
        </Link>
        <h1 className={styles.title}>{courseName}</h1>
      </header>

      <div className={styles.chatPanel}>
        <div className={styles.messages}>
          {messages.length === 0 && !sendError ? (
            <p className={styles.empty}>Start a conversation about your course.</p>
          ) : (
            <>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                <div className={styles.messageRole}>{msg.role === 'user' ? 'You' : 'Assistant'}</div>
                {msg.role === 'assistant' && msg.toolUsage?.length ? (
                  <div className={styles.toolUsage}>
                    {msg.toolUsage.map((t, i) => (
                      <div key={i} className={styles.toolItem}>
                        <span className={styles.toolName}>{t.tool_name}</span>
                        <span className={styles.toolArgs}>{JSON.stringify(t.args)}</span>
                        {t.result ? (
                          <CollapsibleContext content={t.result} courseId={courseId} />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className={styles.messageContent}>{msg.content}</div>
              </div>
            ))}
            {!canSend && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageRole}>Assistant</div>
                <div className={styles.loadingIndicator} />
              </div>
            )}
            </>
          )}
        </div>

        {sendError ? (
          <div className={styles.errorBubble}>
            <div className={styles.errorContent}>{sendError}</div>
          </div>
        ) : null}

        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.input}
            placeholder="Ask a question about the material..."
            value={input}
            onChange={(e) => { setInput(e.target.value); setSendError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className={styles.sendBtn} onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
