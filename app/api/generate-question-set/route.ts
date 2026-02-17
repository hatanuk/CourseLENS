import { NextResponse } from 'next/server';
import {
  insertInteraction,
  insertQuizQuestion,
  getCourse,
  getClustersByCourseId,
} from '@/app/db/queries';
import type { GeneratedQuestionSet } from '@/app/data/structures';
import { ensureCollection } from '@/app/lib/qdrant';

const PYTHON_URL = process.env.PYTHON_API_URL ?? 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      courseId,
      clusterIds,
      questionTypes,
      count = 5,
    } = body as {
      courseId?: string;
      clusterIds?: string[];
      questionTypes?: string[];
      count?: number;
    };

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    const course = getCourse(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const clusters = getClustersByCourseId(courseId);
    const effectiveClusterIds =
      clusterIds?.length && clusterIds.length > 0
        ? clusterIds.filter((id) => clusters.some((c) => c.id === id))
        : clusters.map((c) => c.id);

    await ensureCollection();

    const res = await fetch(`${PYTHON_URL}/generate-question-set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        cluster_ids: effectiveClusterIds.length > 0 ? effectiveClusterIds : undefined,
        question_types: questionTypes ?? ['multiple_choice'],
        count: Math.max(1, Math.min(10, count)),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: err || 'Generation failed' },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { question_sets?: GeneratedQuestionSet[] };
    const questionSets = data.question_sets ?? [];

    const quizId = crypto.randomUUID();
    insertInteraction({
      id: quizId,
      title: `Question set ${new Date().toLocaleDateString()}`,
      type: 'quiz',
      courseId,
      date: new Date().toISOString(),
    });

    const typeMap = {
      multiple_choice: 'mcq' as const,
      true_false: 'tf' as const,
    };

    for (const set of questionSets) {
      const dbType = typeMap[set.question_type as keyof typeof typeMap] ?? 'mcq';
      for (const q of set.questions ?? []) {
        insertQuizQuestion({
          id: crypto.randomUUID(),
          interactionId: quizId,
          question: q.text,
          type: dbType,
          source: set.topic ?? undefined,
          extra: JSON.stringify({ options: q.options, correct: q.correct }),
        });
      }
    }

    return NextResponse.json({ questionSets, quizId });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
