'use client';

import { useState } from 'react';
import type { QuizQuestion, IndexNode } from '@/app/data/structures';
import styles from './QuizPanel.module.css';

interface QuizPanelProps {
  selectedSections: Set<string>;
  indexNodes?: IndexNode[];
}

function getSectionTitle(id: string, nodes: IndexNode[]): string {
  const findTitle = (searchNodes: IndexNode[]): string | null => {
    for (const node of searchNodes) {
      if (node.id === id) return node.title;
      if (node.children) {
        const found = findTitle(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return findTitle(nodes) || id;
}

const mockQuestions: QuizQuestion[] = [
  { id: 'q1', question: 'A variable can change its type during runtime in Python.', type: 'tf' },
  { id: 'q2', question: 'Which data structure uses LIFO ordering?', type: 'mcq' },
];

export default function QuizPanel({ selectedSections, indexNodes = [] }: QuizPanelProps) {
  const [quizType, setQuizType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const handleGenerate = () => {
    setQuestions([...mockQuestions]);
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Quiz Builder</h3>

      <div className={styles.section}>
        <label className={styles.label}>Selected sections</label>
        <div className={styles.chips}>
          {selectedSections.size === 0 ? (
            <span className={styles.hint}>Select sections from index</span>
          ) : (
            Array.from(selectedSections).map(id => (
              <span key={id} className={styles.chip}>
                {getSectionTitle(id, indexNodes).substring(0, 25)}...
              </span>
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Question type</label>
        <select className={styles.select} value={quizType} onChange={e => setQuizType(e.target.value)}>
          <option value="mixed">Mixed</option>
          <option value="mcq">Multiple choice</option>
          <option value="tf">True/False</option>
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Difficulty</label>
        <select className={styles.select} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Number of questions</label>
        <input
          type="number"
          className={styles.input}
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          min={1}
          max={20}
        />
      </div>

      <button className={styles.generateBtn} onClick={handleGenerate}>
        Generate Quiz
      </button>

      {questions.length > 0 && (
        <div className={styles.questions}>
          <h4 className={styles.subheading}>Generated Questions</h4>
          {questions.map((q, i) => (
            <div key={q.id} className={styles.question}>
              <span className={styles.qNumber}>{i + 1}.</span>
              <span className={styles.qText}>{q.question}</span>
              <span className={styles.qType}>{q.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
