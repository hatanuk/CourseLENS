'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FileMetadata } from '@/app/data/structures';
import QuizPanel from '@/app/components/QuizPanel';
import styles from '../UploadPage.module.css';

interface OptionsPageClientProps {
  courseName: string | null;
  files: FileMetadata[];
}

export default function OptionsPageClient({ courseName, files }: OptionsPageClientProps) {
  const router = useRouter();
  const [wantsQuiz, setWantsQuiz] = useState(false);

  if (!wantsQuiz) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>All done!</h2>
        <p className={styles.emptyState} style={{ padding: '0 0 1rem' }}>
          {courseName && `Documents saved to ${courseName}.`}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className={styles.generateBtn} onClick={() => setWantsQuiz(true)}>
            Generate quiz questions
          </button>
          <button
            className={styles.segmentedBtn}
            style={{ padding: '0.75rem 1.5rem', border: '1px solid #e0e0e0' }}
            onClick={() => router.replace('/courses')}
          >
            Go to My Courses
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Generate questions</h2>
      <QuizPanel
        selectedSections={new Set(files.map((f) => f.id))}
        indexNodes={files.map((f) => ({ id: f.id, title: f.originalName, level: 0 }))}
      />
    </section>
  );
}
