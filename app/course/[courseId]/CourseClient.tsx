'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Course, Document, Session } from '@/app/data/structures';
import styles from './page.module.css';

interface Props {
  course: Course;
  docs: Document[];
  sessions: Session[];
  courseId: string;
}

export default function CourseClient({ course, docs, sessions, courseId }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = docs.filter(d =>
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    indexed: '#16a34a',
    pending: '#9ca3af',
    indexing: '#f59e0b',
    error: '#dc2626',
  };

  return (
    <div className={styles.coursePage}>
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Documents</h2>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search documents..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className={styles.docList}>
          {filteredDocs.map(doc => (
            <Link
              key={doc.id}
              href={`/course/${courseId}/doc/${doc.id}`}
              className={styles.docItem}
            >
              <span className={styles.docTitle}>{doc.id}</span>
              <span
                className={styles.statusBadge}
                style={{ background: statusColors[doc.status] }}
              >
                {doc.status}
              </span>
            </Link>
          ))}
        </div>
      </aside>

      <main className={styles.main}>
        <h1 className={styles.courseTitle}>{course.name}</h1>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Documents</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Indexed</span>
          </div>
          <div className={styles.stat}>
           
            <span className={styles.statLabel}>Complete</span>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Sessions</h2>
          <div className={styles.sessions}>
            {sessions.length > 0 ? (
              sessions.map(session => (
                <div key={session.id} className={styles.sessionCard}>
                  <span className={styles.sessionIcon}>
                    {session.type === 'quiz' ? '📝' : '💬'}
                  </span>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionTitle}>{session.title}</div>
                    <div className={styles.sessionDate}>{session.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#999', fontSize: '0.9rem' }}>No sessions yet</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
