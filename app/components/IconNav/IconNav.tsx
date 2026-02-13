'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BookOpen, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './IconNav.module.css';

interface IconNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function IconNav({ isOpen, onToggle }: IconNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className={styles.nav}>
      <button
        type="button"
        className={styles.toggleBtn}
        onClick={onToggle}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <div className={styles.navItems}>
        <Link
          href="/"
          className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
          title="Homepage - Upload Study Material"
        >
          <Home size={20} className={styles.icon} />
          {isOpen && <span className={styles.label}>Homepage</span>}
        </Link>

        <Link
          href="/courses"
          className={`${styles.navItem} ${isActive('/courses') ? styles.active : ''}`}
          title="My Courses"
        >
          <BookOpen size={20} className={styles.icon} />
          {isOpen && <span className={styles.label}>My Courses</span>}
        </Link>
      </div>

      <div className={styles.bottomSection}>
        <button
          type="button"
          className={styles.settingsBtn}
          title="Settings"
        >
          <Settings size={20} className={styles.icon} />
          {isOpen && <span className={styles.label}>Settings</span>}
        </button>
      </div>
    </nav>
  );
}
