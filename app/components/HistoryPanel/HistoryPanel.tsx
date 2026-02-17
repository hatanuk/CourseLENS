'use client';

import type { Interaction } from '@/app/data/structures';
import styles from './HistoryPanel.module.css';

interface HistoryPanelProps {
  sessions?: Interaction[];
}

const defaultSessions: Interaction[] = [
  { id: 's1', title: 'Quiz: Chapter 1 Review', date: '2024-01-15', type: 'quiz' },
  { id: 's2', title: 'Chat: Recursion concepts', date: '2024-01-14', type: 'chat' },
  { id: 's3', title: 'Quiz: Data Structures', date: '2024-01-12', type: 'quiz' },
];

export default function HistoryPanel({ sessions = defaultSessions }: HistoryPanelProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>History</h3>
      <div className={styles.sessions}>
        {sessions.length > 0 ? (
          sessions.map(session => (
            <div key={session.id} className={styles.session}>
              <div className={styles.sessionIcon}>
                {session.type === 'quiz' ? '📝' : '💬'}
              </div>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionTitle}>{session.title}</div>
                <div className={styles.sessionDate}>{session.date}</div>
              </div>
              <button className={styles.openBtn}>Open</button>
            </div>
          ))
        ) : (
          <p style={{ color: '#999', fontSize: '0.85rem' }}>No history yet</p>
        )}
      </div>
    </div>
  );
}
