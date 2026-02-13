'use client';

import { useState } from 'react';
import type { Course, Document } from '../data/structures';
import CourseList from '../components/CourseList';
import DocumentGrid from '../components/DocumentGrid';
import styles from './courses.module.css';

interface Props {
  courses: Course[];
  allDocs: Record<string, Document[]>;
}

export default function CoursesClient({ courses, allDocs }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id ?? null);

  const selectedDocs = selectedCourseId ? (allDocs[selectedCourseId] ?? []) : [];

  const handleReindex = (docId: string) => {
    alert(`Re-indexing document: ${docId}`);
  };

  return (
    <div className={styles.coursesLayout}>
      <aside className={styles.coursesSidebar}>
        <CourseList
          courses={courses}
          selectedId={selectedCourseId}
          onSelect={setSelectedCourseId}
        />
      </aside>
      
      <section className={styles.documentsArea}>
        <h2 className={styles.heading}>
          Documents {selectedCourseId && `(${selectedDocs.length})`}
        </h2>
        {selectedDocs.length > 0 ? (
          <DocumentGrid
            documents={selectedDocs}
            courseId={selectedCourseId!}
            onReindex={handleReindex}
          />
        ) : (
          <p className={styles.empty}>Select a course to view documents</p>
        )}
      </section>
    </div>
  );
}
