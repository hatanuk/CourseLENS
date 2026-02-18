'use client';

import { useRouter } from 'next/navigation';
import styles from '../UploadPage.module.css';

interface OptionsPageClientProps {
  courseName: string | null;
  courseId: string | null;
}

export default function OptionsPageClient({ courseName, courseId }: OptionsPageClientProps) {
  const router = useRouter();

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>All done!</h2>
      <p className={styles.emptyState} style={{ padding: '0 0 1rem' }}>
        {courseName && `Documents saved to ${courseName}.`}
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {courseId && (
          <button
            className={styles.generateBtn}
            onClick={() => router.push(`/course/${courseId}/generate-question`)}
          >
            Generate quiz questions
          </button>
        )}
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
