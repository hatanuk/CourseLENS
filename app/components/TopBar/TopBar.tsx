'use client';

import Link from 'next/link';
import styles from './TopBar.module.css';
import { Blend } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TopBar() {
  const router = useRouter()
  return (
    <header className={styles.topBar}>
      <Link href="/" className={styles.brand}>
      <Blend style={{rotate: "135deg", height: "max-content"}} />
        LENS
      </Link>
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => router.push("/")}>
          Upload
        </button>
        <button className={styles.actionBtn} onClick={() => alert('New course clicked')}>
          New course
        </button>
      </div>
    </header>
  );
}
