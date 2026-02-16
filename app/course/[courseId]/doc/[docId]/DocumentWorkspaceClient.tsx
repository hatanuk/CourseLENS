'use client';

import { useState } from 'react';
import type { Course, Document, IndexNode } from '@/app/data/structures';
import IndexTree from '@/app/components/IndexTree';
import ContentTabs from '@/app/components/ContentTabs';
import QuizPanel from '@/app/components/QuizPanel';
import ChatPanel from '@/app/components/ChatPanel';
import HistoryPanel from '@/app/components/HistoryPanel';
import styles from './page.module.css';

interface Props {
  courses: Course[];
  course: Course;
  doc: Document;
  allDocs: Record<string, Document[]>;
  indexNodes: IndexNode[];
  courseId: string;
  docId: string;
}

type NavMode = 'outline' | 'map' | 'search';
type ToolTab = 'quiz' | 'chat' | 'history';

export default function DocumentWorkspaceClient({
  courses,
  course,
  doc,
  allDocs,
  indexNodes,
  courseId,
  docId,
}: Props) {
  const [navMode, setNavMode] = useState<NavMode>('outline');
  const [toolTab, setToolTab] = useState<ToolTab>('quiz');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [isIndexing, setIsIndexing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(courseId);

  const courseDocs = allDocs[selectedCourse] ?? [];

  const filteredDocs = courseDocs.filter(d =>
    (d.name ?? d.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  function statusColors(status: string): string {
    switch (status) {
      default:
        return "#16a34a"
    }

  }

  const handleToggleSection = (id: string) => {
    const newSet = new Set(selectedSections);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSections(newSet);
  };

  const handleReindex = () => {
    setIsIndexing(true);
    setTimeout(() => setIsIndexing(false), 3000);
  };

  return (
    <div className={styles.workspace}>
      {/* Left Panel - Document Navigator */}
      <aside className={styles.leftPanel}>
        <div className={styles.navHeader}>
          <select
            className={styles.courseSelect}
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search documents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.docList}>
          {filteredDocs.map(d => (
            <a
              key={d.id}
              href={`/course/${selectedCourse}/doc/${d.id}`}
              className={`${styles.docItem} ${d.id === docId ? styles.active : ''}`}
            >
              <span className={styles.docTitle}>{d.name}</span>
              <span
                className={styles.statusBadge}
                style={{ background: statusColors(d.status) }}
              >
                {d.status}
              </span>
            </a>
          ))}
        </div>

        <div className={styles.navModeSwitch}>
          <button
            className={`${styles.navModeBtn} ${navMode === 'outline' ? styles.navModeActive : ''}`}
            onClick={() => setNavMode('outline')}
          >
            Outline
          </button>
          <button
            className={`${styles.navModeBtn} ${navMode === 'map' ? styles.navModeActive : ''}`}
            onClick={() => setNavMode('map')}
          >
            Map
          </button>
          <button
            className={`${styles.navModeBtn} ${navMode === 'search' ? styles.navModeActive : ''}`}
            onClick={() => setNavMode('search')}
          >
            Search
          </button>
        </div>
      </aside>

      {/* Center Panel - Index + Preview */}
      <main className={styles.centerPanel}>
        <div className={styles.docHeader}>
          <h1 className={styles.docTitle}>{doc.name ?? doc.id}</h1>
          <div className={styles.docActions}>
            <button className={styles.actionBtn}>Generate quiz from selection</button>
          </div>
        </div>

        {isIndexing && (
          <div className={styles.indexingBanner}>
            <div className={styles.indexingText}>Indexing in progress...</div>
            <div className={styles.indexingBar}>
              <div className={styles.indexingProgress} />
            </div>
          </div>
        )}

        <div className={styles.contentArea}>
          <div className={styles.indexSection}>
            <h3 className={styles.sectionTitle}>Document Index</h3>
            {navMode === 'outline' && (
              <IndexTree
                nodes={indexNodes}
                selectedIds={selectedSections}
                onToggle={handleToggleSection}
              />
            )}
            {navMode === 'map' && (
              <div className={styles.placeholder}>
                Concept map visualization placeholder
              </div>
            )}
            {navMode === 'search' && (
              <div className={styles.placeholder}>
                Full-text search within document placeholder
              </div>
            )}
          </div>

          <div className={styles.previewSection}>
            <ContentTabs docId={docId} />
          </div>
        </div>
      </main>


    </div>
  );
}
