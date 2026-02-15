'use client';

import type { FileMetadata } from '@/app/data/structures';
import styles from './UploadPage.module.css';

const STAGE_LABELS: Record<string, string> = {
  parsing: 'Parsing...',
  embedding: 'Embedding & clustering...',
  labeling: 'Labeling...',
  saving: 'Saving...',
};

interface FileUploadContentProps {
  files: FileMetadata[];
  uploadId: string;
  isProcessing: boolean;
  progress: number;
  statusLabel: string;
  processError: string | null;
  processComplete: boolean;
}

export default function FileUploadContent({
  files,
  isProcessing,
  progress,
  statusLabel,
  processError,
  processComplete,
}: FileUploadContentProps) {
  const status = processError ? 'error' : isProcessing ? 'processing' : processComplete ? 'done' : 'pending';
  const displayLabel = STAGE_LABELS[statusLabel] ?? statusLabel;

  if (files.length === 0) {
    return (
      <section className={styles.section}>
        <p className={styles.emptyState}>No files in this upload.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Files</h2>
      {processError && (
        <p className={styles.fileStatus} data-status="error" style={{ marginBottom: '0.5rem' }}>
          {processError}
        </p>
      )}
      <div className={styles.fileList}>
        {files.map((file) => (
          <div key={file.id} className={styles.fileRow}>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{file.originalName}</span>
              <span className={styles.fileStatus} data-status={status}>
                {status === 'processing' && (displayLabel ? `${displayLabel} ${Math.round(progress)}%` : 'Processing...')}
                {status === 'pending' && 'Ready'}
                {status === 'done' && 'Done'}
                {status === 'error' && 'Error'}
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
