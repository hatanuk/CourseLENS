'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FileMetadata } from '@/app/data/structures';
import QuizPanel from '@/app/components/QuizPanel';
import styles from '../UploadPage.module.css';

interface OptionsPageClientProps {
  uploadId: string;
  courseId: string | null;
  courseName: string | null;
  files: FileMetadata[];
}

export default function OptionsPageClient({ uploadId, courseId, courseName, files }: OptionsPageClientProps) {
  const router = useRouter();
  const [wantsGenerate, setWantsGenerate] = useState<boolean | null>(null);

  function handleNo() {
    router.replace('/courses');
  }

  if (wantsGenerate === null) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Generate questions?</h2>
        <p className={styles.emptyState} style={{ padding: '0 0 1rem' }}>
          Would you like to generate quiz questions from the uploaded documents?
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={styles.generateBtn} onClick={() => setWantsGenerate(true)}>
            Yes
          </button>
          <button
            className={styles.segmentedBtn}
            style={{ flex: 1, padding: '0.75rem 1.5rem', border: '1px solid #e0e0e0' }}
            onClick={handleNo}
          >
            No, go to My Courses
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Generate questions</h2>
        <p className={styles.emptyState} style={{ padding: '0 0 1rem' }}>
          {courseName && `Generating from ${courseName}`}
        </p>
      </section>
      <QuizPanel
        selectedSections={new Set(files.map((f) => f.id))}
        indexNodes={files.map((f) => ({ id: f.id, title: f.originalName, level: 0 }))}
      />
    </>
  );
}
