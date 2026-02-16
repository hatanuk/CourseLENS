'use client';

import Link from 'next/link';
import styles from './DocumentGrid.module.css';
import type { Document } from '@/app/data/structures';


interface DocumentGridProps {
  documents: Document[];
  courseId: string;
  onReindex: (docId: string) => void;
}

const typeColors: Record<string, string> = {
  pdf: '#ef4444',
  video: '#8b5cf6',
  slides: '#3b82f6',
  notes: '#22c55e',
};

const statusColors: Record<string, string> = {
  indexed: '#16a34a',
  pending: '#9ca3af',
  indexing: '#f59e0b',
  error: '#dc2626',
};

export default function DocumentGrid({ documents, courseId, onReindex }: DocumentGridProps) {
  return (
    <div className={styles.grid}>
      {documents.map(doc => (
        <div key={doc.id} className={styles.card}>
          <div className={styles.header}>
            <span className={styles.title}>{doc.name ?? doc.id}</span>
          </div>
          <div className={styles.badges}>
            <span className={styles.badge} style={{ background: typeColors[doc.type] }}>
              {doc.type}
            </span>
            <span className={styles.badge} style={{ background: statusColors[doc.status] }}>
              {doc.status}
            </span>
          </div>
          {doc.dateAdded && (
            <div className={styles.lastIndexed}>Added: {doc.dateAdded}</div>
          )}
          <div className={styles.actions}>
            <Link href={`/course/${courseId}/doc/${doc.id}`} className={styles.btn}>
              Open
            </Link>
            <button className={styles.btnSecondary} onClick={() => onReindex(doc.id)}>
              Re-index
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
