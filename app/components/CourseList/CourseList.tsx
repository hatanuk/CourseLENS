'use client';

import { Course } from '@/app/data/structures';
import styles from './CourseList.module.css';

interface CourseListProps {
  courses: Course[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CourseList({ courses, selectedId, onSelect }: CourseListProps) {
  return (
    <div className={styles.courseList}>
      <h2 className={styles.heading}>Courses</h2>
      {courses.map(course => (
        <div
          key={course.id}
          className={`${styles.card} ${selectedId === course.id ? styles.selected : ''}`}
          onClick={() => onSelect(course.id)}
        >
          <div className={styles.name}>{course.name}</div>
          <div className={styles.meta}>
            <span>{course.documentCount} docs</span>
            <span className={styles.progress}>
              {Math.round((course.indexedCount / course.documentCount) * 100)}% indexed
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(course.indexedCount / course.documentCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
