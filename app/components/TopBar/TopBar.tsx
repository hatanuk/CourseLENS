'use client';

import Link from 'next/link';
import { Blend } from 'lucide-react';
import styles from './TopBar.module.css';

export default function TopBar() {
  return (
    <header className={styles.topBar}>
      <Link href="/" className={styles.brand}>
        <Blend style={{ rotate: "135deg", height: "max-content" }} />
        courseLENS
      </Link>
      <div className={styles.actions}>
        <Link href="/" className={styles.actionBtn}>Upload</Link>
        <Link href="/courses" className={styles.actionBtn}>My Courses</Link>
      </div>
    </header>
  );
}
