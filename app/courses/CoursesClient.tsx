'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Course, Interaction } from '../data/structures';
import type { TopicWithChunks } from './page';
import CourseList from '../components/CourseList';
import styles from './courses.module.css';
import type { Document } from '../data/structures';
import { FileQuestion, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  courses: Course[];
  allTopics: Record<string, TopicWithChunks[]>;
  courseDocs: Record<string, Document[]>;
  interactionsByCourse: Record<string, Interaction[]>;
  totalQuestionsByCourse: Record<string, number>;
}

export default function CoursesClient({
  courses,
  allTopics,
  courseDocs,
  interactionsByCourse,
  totalQuestionsByCourse,
}: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id ?? null);

  const selectedCourse = selectedCourseId ? courses.find((c) => c.id === selectedCourseId) : null;
  const selectedInteractions = selectedCourseId ? (interactionsByCourse[selectedCourseId].sort((a, b) => (a.date > b.date ? -1 : 1))  ?? []) : [];
  const totalQuestions = selectedCourseId ? (totalQuestionsByCourse[selectedCourseId] ?? 0) : 0;
  const docCount = selectedCourseId ? (courseDocs[selectedCourseId]?.length ?? 0) : 0;
  const topicCount = selectedCourseId ? (allTopics[selectedCourseId]?.length ?? 0) : 0;

  const router = useRouter();

  const MAX_RECENT = 5

  function startChat(courseId: string) {
    if (courseId) {
      const chatId = crypto.randomUUID();
      router.push(`/course/${courseId}/chat/${chatId}`);
    }
  }

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

      <section className={styles.mainPanel}>
        {selectedCourse ? (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{totalQuestions}</span>
                <span className={styles.statLabel}>Questions</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{docCount}</span>
                <span className={styles.statLabel}>Documents</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{topicCount}</span>
                <span className={styles.statLabel}>Topics</span>
              </div>
            </div>

            <div className={styles.pastSection}>
              <h2 className={styles.sectionHeading}>Recent</h2>
              {selectedInteractions.length > 0 ? (
                <div className={styles.sessionList}>
                  {selectedInteractions.slice(0, MAX_RECENT).map((session) => (
                    <Link
                      key={session.id}
                      href={
                        session.type === 'chat'
                          ? `/course/${selectedCourseId}/chat/${session.id}`
                          : `/course/${selectedCourseId}`
                      }
                      className={styles.sessionCard}
                    >
                      <span className={styles.sessionIcon}>
                        {session.type === 'quiz' ? (
                          <FileQuestion size={16} />
                        ) : (
                          <MessageCircle size={16} />
                        )}
                      </span>
                      <div className={styles.sessionInfo}>
                        <span className={styles.sessionTitle}>
                          {session.title ?? `${session.type === 'quiz' ? 'Quiz' : 'Chat'}`}
                        </span>
                        <span className={styles.sessionDate}>
                          {new Date(session.date).toLocaleDateString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {selectedInteractions.length > MAX_RECENT && <p> See all </p>}
                </div>
              ) : (
                <p className={styles.empty}>No question sets or chats yet.</p>
              )}
            </div>

            <div className={styles.actionsSection}>
              <h2 className={styles.sectionHeading}>Actions</h2>
              <div className={styles.actionButtons}>
                <Link
                  href={`/course/${selectedCourseId}/generate-question`}
                  className={styles.actionBtn}
                >
                  <FileQuestion size={20} />
                  Generate question set
                </Link>
                <button
                  onClick={() => selectedCourseId && startChat(selectedCourseId)}
                  className={styles.actionBtn}
                >
                  <MessageCircle size={20} />
                  Chat about course
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className={styles.empty}>Start by uploading some material!</p>
        )}
      </section>
    </div>
  );
}
