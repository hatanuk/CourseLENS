'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Cluster, GeneratedQuestionSet } from '@/app/data/structures';
import SelectDropdown from '@/app/components/SelectDropdown/SelectDropdown';
import styles from './GenerateQuestionClient.module.css';

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Multiple choice' },
  { id: 'true_false', label: 'True/False' },
] as const;

const MAX_TOTAL_QUESTIONS = 15;

function QuestionSetDisplay({ data }: { data: GeneratedQuestionSet }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setRevealed((s) => new Set(s).add(i));

  return (
    <div className={styles.questionSet}>
      {data.topic && <div className={styles.questionSetTopic}>{data.topic}</div>}
      {data.questions.map((q, i) => (
        <div key={i} className={styles.questionItem}>
          <div className={styles.questionText}>
            <span className={styles.questionNum}>{i + 1}.</span> {q.text}
          </div>
          {q.options && (
            <ul className={styles.questionOptions}>
              {q.options.map((opt, j) => (
                <li key={j} className={revealed.has(i) && q.correct === j ? styles.correct : ''}>
                  {String.fromCharCode(65 + j)}. {opt}
                </li>
              ))}
            </ul>
          )}
          {typeof q.correct === 'boolean' && revealed.has(i) && (
            <div className={styles.tfAnswer}>Answer: {q.correct ? 'True' : 'False'}</div>
          )}
          {(q.options || typeof q.correct === 'boolean') && (
            <button type="button" className={styles.revealBtn} onClick={() => toggle(i)}>
              {revealed.has(i) ? '✓ Revealed' : 'Reveal answer'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface Props {
  courseId: string;
  courseName: string;
  clusters: Cluster[];
}

export default function GenerateQuestionClient({ courseId, courseName, clusters }: Props) {
  const [selectedClusterIds, setSelectedClusterIds] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['multiple_choice']));
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionSets, setQuestionSets] = useState<GeneratedQuestionSet[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);

  const toggleCluster = (id: string) => {
    setSelectedClusterIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleType = (id: string) => {
    setSelectedTypes((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllClusters = () => setSelectedClusterIds(new Set(clusters.map((c) => c.id)));
  const clearClusters = () => setSelectedClusterIds(new Set());

  const effectiveCount = selectedTypes.size > 0
    ? Math.min(count, Math.floor(MAX_TOTAL_QUESTIONS / selectedTypes.size))
    : 1;

  const handleGenerate = async () => {
    if (selectedTypes.size === 0) {
      setError('Select at least one question type');
      return;
    }
    setLoading(true);
    setError(null);
    setQuestionSets([]);
    setQuizId(null);
    try {
      const res = await fetch('/api/generate-question-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          clusterIds: selectedClusterIds.size > 0 ? [...selectedClusterIds] : undefined,
          questionTypes: [...selectedTypes],
          count: effectiveCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate');
      setQuestionSets(data.questionSets ?? []);
      setQuizId(data.quizId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href={`/courses`} className={styles.backLink}>
          ← Courses
        </Link>
        <h1 className={styles.title}>Generate question set</h1>
        <p className={styles.subtitle}>{courseName}</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Topics</h2>
          <p className={styles.hint}>
            {clusters.length === 0
              ? 'No topics yet.'
              : 'Select topics to limit context. Leave empty to use all.'}
          </p>
          {clusters.length > 0 && (
            <SelectDropdown
              items={clusters.map((c) => ({ id: c.id, label: c.topic }))}
              selectedIds={selectedClusterIds}
              onSelect={(id) => toggleCluster(id)}
              onSelectAll={selectAllClusters}
              onClear={clearClusters}
              placeholder="All topics (click to filter)"
              multiSelect
              selectedLabel={(n) => `${n} topic${n === 1 ? '' : 's'} selected`}
            />
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Question types</h2>
          <div className={styles.typeList}>
            {QUESTION_TYPES.map((t) => (
              <label key={t.id} className={styles.typeChip}>
                <input
                  type="checkbox"
                  checked={selectedTypes.has(t.id)}
                  onChange={() => toggleType(t.id)}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <label className={styles.label}>Number of questions (per type)</label>
          <input
            type="number"
            className={styles.input}
            min={1}
            max={Math.max(1, Math.floor(MAX_TOTAL_QUESTIONS / Math.max(1, selectedTypes.size)))}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <p className={styles.hint}>
            Max {MAX_TOTAL_QUESTIONS} total ({selectedTypes.size} type{selectedTypes.size === 1 ? '' : 's'} × up to {Math.floor(MAX_TOTAL_QUESTIONS / selectedTypes.size)} each)
          </p>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={loading || clusters.length === 0}
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>

        {questionSets.length > 0 && (
          <section className={styles.results}>
            <h2 className={styles.sectionHeading}>Generated questions</h2>
            {quizId && (
              <Link href={`/course/${courseId}/quiz/${quizId}`} className={styles.replayLink}>
                Open in quiz view →
              </Link>
            )}
            {questionSets.map((set, i) => (
              <QuestionSetDisplay key={i} data={set} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
