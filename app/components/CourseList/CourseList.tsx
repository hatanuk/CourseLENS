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
}

export default function CourseList({ courses, selectedId, onSelect, courseDocs }: CourseListProps) {

  const [cardsOpened, setCardsOpened] = useState<string[]>([])

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
      {courses.map(course => (
        <div
          key={course.id}
          className={`${styles.card} ${selectedId === course.id ? styles.selected : ''}`}
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
