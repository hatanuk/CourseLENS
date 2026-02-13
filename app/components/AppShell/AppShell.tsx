'use client';

import { useState } from 'react';
import IconNav from '../IconNav';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className={styles.appLayout}>
      <aside className={`${styles.iconSidebar} ${!navOpen ? styles.iconSidebarCollapsed : ''}`}>
        <IconNav isOpen={navOpen} onToggle={() => setNavOpen(!navOpen)} />
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
