'use client';

import Link from 'next/link';
import styles from './TopBar.module.css';
import { Blend } from 'lucide-react';

interface TopBarProps {
  indexingCount?: number;
}

export default function TopBar({ indexingCount = 1 }: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <Link href="/" className={styles.brand}>
      <Blend style={{rotate: "135deg", height: "max-content"}} />
        LENS
      </Link>
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => alert('Upload clicked')}>
          Upload
        </button>
        <button className={styles.actionBtn} onClick={() => alert('New course clicked')}>
          New course
        </button>
        <span className={styles.statusPill}>
          Indexing: {indexingCount}
        </span>
      </div>
    </header>
  );
}
