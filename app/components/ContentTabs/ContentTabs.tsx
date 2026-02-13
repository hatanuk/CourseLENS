'use client';

import { useState } from 'react';
import styles from './ContentTabs.module.css';

export default function ContentTabs() {
  const [activeTab, setActiveTab] = useState<'preview' | 'keypoints' | 'figures'>('preview');

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
          <div className={styles.placeholder}>
            <p>Figures and diagrams placeholder</p>
            <div className={styles.figureGrid}>
              <div className={styles.figurePlaceholder}>Fig 1.1</div>
              <div className={styles.figurePlaceholder}>Fig 1.2</div>
              <div className={styles.figurePlaceholder}>Fig 2.1</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
