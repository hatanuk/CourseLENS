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
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    indexed: '#16a34a',
    pending: '#9ca3af',
    indexing: '#f59e0b',
    error: '#dc2626',
  };

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
              <span className={styles.docTitle}>{d.id}</span>
              <span
                className={styles.statusBadge}
                style={{ background: statusColors[d.status] }}
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
          <h1 className={styles.docTitle}>{doc.id}</h1>
          <div className={styles.docActions}>
            <button className={styles.actionBtn} onClick={handleReindex}>
              Re-index
            </button>
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
            <ContentTabs />
          </div>
        </div>
      </main>

      {/* Right Panel - Tools */}
      <aside className={styles.rightPanel}>
        <div className={styles.toolTabs}>
          <button
            className={`${styles.toolTab} ${toolTab === 'quiz' ? styles.toolTabActive : ''}`}
            onClick={() => setToolTab('quiz')}
          >
            Quiz Builder
          </button>
          <button
            className={`${styles.toolTab} ${toolTab === 'chat' ? styles.toolTabActive : ''}`}
            onClick={() => setToolTab('chat')}
          >
            Chat
          </button>
          <button
            className={`${styles.toolTab} ${toolTab === 'history' ? styles.toolTabActive : ''}`}
            onClick={() => setToolTab('history')}
          >
            History
          </button>
        </div>

        <div className={styles.toolContent}>
          {toolTab === 'quiz' && <QuizPanel selectedSections={selectedSections} indexNodes={indexNodes} />}
          {toolTab === 'chat' && <ChatPanel selectedSections={selectedSections} indexNodes={indexNodes} />}
          {toolTab === 'history' && <HistoryPanel />}
        </div>
      </aside>
    </div>
  );
}
