'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GeneratedQuestionSet } from '@/app/data/structures';
import styles from './QuizReplayClient.module.css';

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
            <div className={q.correct ? styles.tfAnswerTrue : styles.tfAnswerFalse}>
              Answer: {q.correct ? 'True' : 'False'}
            </div>
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
  quizTitle: string;
  questionSets: GeneratedQuestionSet[];
}

export default function QuizReplayClient({
  courseId,
  courseName,
  quizTitle,
  questionSets,
}: Props) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href={`/courses`} className={styles.backLink}>
          ← Courses
        </Link>
        <h1 className={styles.title}>{quizTitle}</h1>
        <p className={styles.subtitle}>{courseName}</p>
      </header>

      <div className={styles.content}>
        {questionSets.length > 0 ? (
          questionSets.map((set, i) => <QuestionSetDisplay key={i} data={set} />)
        ) : (
          <p className={styles.empty}>No questions in this set.</p>
        )}
      </div>
    </div>
  );
}
