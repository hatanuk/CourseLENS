'use client';

import { useState } from 'react';
import type { Course } from '../data/structures';
import type { TopicWithChunks } from './page';
import CourseList from '../components/CourseList';
import styles from './courses.module.css';
import type { Document } from '../data/structures';

interface Props {
  courses: Course[];
  allTopics: Record<string, TopicWithChunks[]>;
  courseDocs: Record<string, Document[]>;
}

export default function CoursesClient({ courses, allTopics, courseDocs }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id ?? null);

  const selectedTopics = selectedCourseId ? (allTopics[selectedCourseId] ?? []) : [];

  return (
    <div className={styles.coursesLayout}>
      <aside className={styles.coursesSidebar}>
        <CourseList
          courses={courses}
          courseDocs={courseDocs}
          selectedId={selectedCourseId}
          onSelect={setSelectedCourseId}
        />
      </aside>

      <section className={styles.labelsArea}>
        <h2 className={styles.heading}>
          Topics {selectedCourseId && `(${selectedTopics.length})`}
        </h2>
        {selectedTopics.length > 0 ? (
          <div className={styles.labelList}>
            {selectedTopics.map((topic) => (
              <div key={topic.id} className={styles.labelCard}>
                <h3 className={styles.labelTopic}>{topic.topic}</h3>
                <div className={styles.chunksByBook}>
                  {Object.keys(topic.chunksByBook).length > 0 ? (
                    Object.entries(topic.chunksByBook).map(([bookName, chunks]) => (
                      <div key={bookName} className={styles.bookSection}>
                        <h4 className={styles.bookName}>{bookName}</h4>
                        <ul className={styles.chunkList}>
                          {chunks.map((text, i) => (
                            <li key={i} className={styles.chunkItem}>{text}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyChunks}>
                      No context yet. Set QDRANT_URL and QDRANT_API_KEY in .env, then reprocess documents.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            No topics extracted for this course yet.
          </p>
        )}
      </section>
    </div>
  );
}
