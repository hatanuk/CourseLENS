'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { FileMetadata, Course } from '@/app/data/structures';
import CourseSelector from './CourseSelector';
import styles from './UploadPage.module.css';

const STAGE_LABELS: Record<string, string> = {
  parsing: 'Parsing...',
  embedding: 'Embedding & clustering...',
  labeling: 'Labeling...',
  saving: 'Saving...',
};

interface UploadPageWrapperProps {
  files: FileMetadata[];
  uploadId: string;
  courses: Course[];
  consumedAt: string | null;
}

export default function UploadPageWrapper({ files, uploadId, courses, consumedAt }: UploadPageWrapperProps) {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');

  const canSave = selectedCourse;

  //const [processComplete, setProcessComplete] = useState(!!consumedAt);
  //const [processError, setProcessError] = useState<string | null>(null);
  //const [progress, setProgress] = useState(consumedAt ? 100 : 0);


  async function handleContinue() {
    if (!selectedCourse) return;
    const res = await fetch(`/api/upload/${uploadId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: selectedCourse.id }),
    });
    if (res.ok) {
      router.push(`/upload/${uploadId}/status?courseId=${selectedCourse.id}`);
    }
  }

  const allCourses = useMemo(() => {
    const ids = new Set(courses.map((c) => c.id));
    if (selectedCourse && !ids.has(selectedCourse.id)) {
      return [...courses, { ...selectedCourse, sessionId: '' }];
    }
    return courses;
  }, [courses, selectedCourse]);


  return (
    <>
      <CourseSelector
        courses={allCourses}
        selected={selectedCourse}
        onSelect={setSelectedCourse}
      />
      <section className={styles.section}>
        <button
          className={styles.generateBtn}
          disabled={!canSave}
          onClick={handleContinue}
        >
          Continue
        </button>
      </section>
    </>
  );
}
