'use client';

import { Course } from '@/app/data/structures';
import styles from './CourseList.module.css';
import { useState } from 'react';
import type { Document } from '@/app/data/structures';
import { Plus, Minus } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  courseDocs: Record<string, Document[]>;
  onCourseCreated?: () => void;
}

export default function CourseList({ courses, selectedId, onSelect, courseDocs, onCourseCreated }: CourseListProps) {

  const [cardsOpened, setCardsOpened] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreateError(null);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (data.ok && data.course) {
      setNewName('');
      setIsCreating(false);
      onCourseCreated?.();
    } else {
      setCreateError(data.error ?? 'Failed to create course');
    }
  }

  function handleSelect(courseId: string) {
    onSelect(courseId)
  }
  function handleToggle(e: React.MouseEvent, courseId: string) {
    e.stopPropagation()
    setCardsOpened((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    )
  }

  return (
    <div className={styles.courseList}>
      <h2 className={styles.heading}>Courses</h2>
      {isCreating ? (
        <div className={styles.createForm}>
          <input
            type="text"
            className={styles.createInput}
            placeholder="Course name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          {createError && <p className={styles.createError}>{createError}</p>}
          <div className={styles.createActions}>
            <button type="button" className={styles.createBtn} onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => { setIsCreating(false); setNewName(''); setCreateError(null); }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.newCourseBtn} onClick={() => setIsCreating(true)}>
          <Plus size={18} />
          Create new course
        </button>
      )}
      {courses.map(course => (
        <div
          key={course.id}
          className={`${styles.card} ${selectedId === course.id ? styles.selected : ''} ${cardsOpened.includes(course.id) && (courseDocs[course.id]?.length ?? 0) > 0 ? styles.expanded : ''}`}
          onClick={() => handleSelect(course.id)}
        >

          <div className={styles.name}>
            {course.name}
            {(courseDocs[course.id]?.length ?? 0) > 0 && (
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={(e) => handleToggle(e, course.id)}
                aria-label={cardsOpened.includes(course.id) ? 'Collapse' : 'Expand'}
              >
                {cardsOpened.includes(course.id) ? <Minus size={20} /> : <Plus size={20} />}
              </button>
            )}
          </div>
          <ul
            className={`${styles.courseFiles} ${cardsOpened.includes(course.id) && (courseDocs[course.id]?.length ?? 0) > 0 ? styles.open : ""}`}>
            {(courseDocs[course.id] ?? []).map((doc) => (
              <li key={doc.id} className={styles.fileItem}>{doc.name}</li>
            ))}
          </ul>
        </div>
      ))
      }
    </div >
  );
}
