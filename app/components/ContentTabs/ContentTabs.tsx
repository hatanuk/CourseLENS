'use client';

import { useState, useEffect } from 'react';
import styles from './ContentTabs.module.css';

interface ContentTabsProps {
  docId: string;
}

export default function ContentTabs({ docId }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'keypoints' | 'figures'>('preview');
  const [figures, setFigures] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/documents/${docId}/figures`)
      .then((r) => r.json())
      .then((d) => setFigures(d.figures ?? []))
      .catch(() => setFigures([]));
  }, [docId]);

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'keypoints' ? styles.active : ''}`}
          onClick={() => setActiveTab('keypoints')}
        >
          Key points
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'figures' ? styles.active : ''}`}
          onClick={() => setActiveTab('figures')}
        >
          Figures
        </button>
      </div>
      <div className={styles.content}>
        {activeTab === 'preview' && (
          <div className={styles.placeholder}>
            <p>Document preview will appear here.</p>
            <p className={styles.hint}>Select sections from the index to view content.</p>
          </div>
        )}
        {activeTab === 'keypoints' && (
          <div className={styles.placeholder}>
            <p>Key points extracted from selected sections.</p>
            <ul className={styles.list}>
              <li>Computers process data using CPU, memory, and I/O</li>
              <li>Programming involves variables, control flow, and functions</li>
              <li>Data structures organize information efficiently</li>
            </ul>
          </div>
        )}
        {activeTab === 'figures' && (
          <div className={styles.figuresContent}>
            {figures.length === 0 ? (
              <p className={styles.placeholder}>No figures extracted from this document.</p>
            ) : (
              <div className={styles.figureGrid}>
                {figures.map((src, i) => (
                  <div key={src} className={styles.figureWrap}>
                    <img src={src} alt={`Figure ${i + 1}`} className={styles.figureImg} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
