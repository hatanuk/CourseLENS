'use client';

import { useEffect, useState, useRef } from 'react';
import type { FileMetadata } from '@/app/data/structures';
import styles from './UploadPage.module.css';

type ProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

interface FileWithProgress extends FileMetadata {
  status: ProcessingStatus;
  progress: number;
}

interface FileUploadContentProps {
  files: FileMetadata[];
  uploadId: string;
  allProcessed: boolean;
  setAllProcessed: (value: boolean) => void;
}

export default function FileUploadContent({ files: initialFiles, uploadId, setAllProcessed }: FileUploadContentProps) {
  const [filesWithProgress, setFilesWithProgress] = useState<FileWithProgress[]>(() =>
    initialFiles.map((f) => ({ ...f, status: 'pending' as ProcessingStatus, progress: 0 }))
  );
  const startedRef = useRef(false);

  useEffect(() => {
    const allDone =
      filesWithProgress.length > 0 &&
      filesWithProgress.every((f) => f.status === "done");
    setAllProcessed(allDone);
  }, [filesWithProgress, setAllProcessed]);

  useEffect(() => {
    if (startedRef.current || initialFiles.length === 0) return;
    startedRef.current = true;

    async function processAll() {
      for (let i = 0; i < initialFiles.length; i++) {
        const file = initialFiles[i];
        setFilesWithProgress((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: 'processing' as ProcessingStatus, progress: 0 } : f
          )
        );

        try {
          const res = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId, fileId: file.id }),
          });
          const data = await res.json();

          setFilesWithProgress((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: data.ok ? 'done' : 'error', progress: data.ok ? 100 : 0 }
                : f
            )
          );
        } catch {
          setFilesWithProgress((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: 'error' as ProcessingStatus, progress: 0 } : f
            )
          );
        }
      }
    }

    processAll();
  }, [uploadId, initialFiles]);

  if (filesWithProgress.length === 0) {
    return (
      <div className={styles.container}>
        <section className={styles.section}>
          <p className={styles.emptyState}>No files in this upload.</p>
        </section>
      </div>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Files</h2>
      <div className={styles.fileList}>
        {filesWithProgress.map((file) => (
          <div key={file.id} className={styles.fileRow}>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{file.originalName}</span>
              <span className={styles.fileStatus} data-status={file.status}>
                {file.status === 'done' && 'Done'}
                {file.status === 'processing' && `Processing... ${file.progress}%`}
                {file.status === 'pending' && 'Pending'}
                {file.status === 'error' && 'Error'}
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
