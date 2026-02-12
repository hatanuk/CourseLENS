'use client';

import Link from 'next/link';
import { Document } from '@/app/data/structures';
import styles from './DocumentGrid.module.css';

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
            <span className={styles.title}>{doc.id}</span>
          </div>
          <div className={styles.badges}>
            <span className={styles.badge} style={{ background: typeColors[doc.type] }}>
              {doc.type}
            </span>
            <span className={styles.badge} style={{ background: statusColors[doc.status] }}>
              {doc.status}
            </span>
          </div>
          {doc.lastIndexed && (
            <div className={styles.lastIndexed}>Last indexed: {doc.lastIndexed}</div>
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
