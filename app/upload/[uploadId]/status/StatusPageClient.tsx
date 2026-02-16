'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FileMetadata } from '@/app/data/structures';
import Loading from '@/app/components/Loading';
import styles from '../UploadPage.module.css';

const STAGE_LABELS: Record<string, string> = {
  parsing: 'Parsing...',
  embedding: 'Embedding & clustering...',
  labeling: 'Labeling...',
  saving: 'Saving...',
};

interface StatusPageClientProps {
  uploadId: string;
  courseId: string | null;
  files: FileMetadata[];
}

export default function StatusPageClient({ uploadId, courseId, files }: StatusPageClientProps) {
  const router = useRouter();
  const [stage, setStage] = useState('parsing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setError('No course selected. Go back and select a course.');
      return;
    }
    let aborted = false;
    const controller = new AbortController();
    const run = async () => {
      let res: Response;
      try {
        res = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId, courseId }),
          signal: controller.signal,
        });
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!aborted) setError(e instanceof Error ? e.message : 'Failed to start processing');
        return;
      }
      if (!res.ok || !res.body) {
        if (!aborted) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? `Failed to start processing (${res.status})`);
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (aborted) return;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const block of lines) {
          if (aborted) return;
          const match = block.match(/^event: (\w+)\ndata: (.+)$/m);
          if (!match) continue;
          const [, event, data] = match;
          try {
            const payload = JSON.parse(data);
            if (event === 'status') {
              if (!aborted) {
                setStage(payload.stage ?? 'parsing');
                setProgress(payload.progress ?? 0);
              }
            } else if (event === 'complete') {
              if (!aborted) router.push(`/upload/${uploadId}/options?courseId=${courseId}`);
              return;
            } else if (event === 'error') {
              if (!aborted) setError(payload.message ?? 'Processing failed');
            }
          } catch { }
        }
      }
    };
    run();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [uploadId, courseId, router]);

  const displayLabel = STAGE_LABELS[stage] ?? stage;

  if (error) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Processing</h2>
        <p className={styles.fileStatus} data-status="error">{error}</p>
      </section>
    );
  }

  if (files.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Processing</h2>
        <p className={styles.emptyState}>No files in this upload.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Processing</h2>
      <p className={styles.fileStatus}>
        {displayLabel} {Math.round(progress)}%
      </p>
      <div className={styles.progressBar} style={{ marginTop: '0.5rem' }}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <Loading compact showLabel={false} />
    </section>
  );
}
