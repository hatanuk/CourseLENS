'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { FileMetadata } from '@/app/data/structures';
import type { Course } from '@/app/data/structures';
import FileUploadContent from './FileUploadContent';
import CourseSelector from './CourseSelector';
import styles from './UploadPage.module.css';

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
  const [progress, setProgress] = useState(consumedAt ? 100 : 0);
  const [statusLabel, setStatusLabel] = useState('');
  const [processComplete, setProcessComplete] = useState(!!consumedAt);
  const [processError, setProcessError] = useState<string | null>(null);
  const startedRef = useRef<string | null>(consumedAt ? "consumed" : null);

  useEffect(() => {
    if (consumedAt || isProcessing || processComplete || files.length === 0) return;
    if (startedRef.current) return;
    startedRef.current = "started";

    setIsProcessing(true);
    setProcessError(null);

    (async () => {
      try {
        const res = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId }),
        });

        if (!res.ok || !res.body) {
          throw new Error(res.statusText || 'Request failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let event = '';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            else if (line.startsWith('data: ')) data = line.slice(6);
            else if (line === '' && event && data) {
              try {
                const payload = JSON.parse(data);
                if (event === 'status') {
                  setProgress(payload.progress ?? 0);
                  setStatusLabel(payload.stage ?? '');
                } else if (event === 'complete') {
                  setProcessComplete(true);
                  setProgress(100);
                } else if (event === 'error') {
                  throw new Error(payload.message ?? 'Unknown error');
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
              event = '';
              data = '';
            }
          }
        }
      } catch (err) {
        setProcessError(err instanceof Error ? err.message : 'Processing failed');
        startedRef.current = null;
      } finally {
        setIsProcessing(false);
      }
    })();
  }, [uploadId, files.length, isProcessing, processComplete, consumedAt]);

  async function handleSave() {
    if (!processComplete || !selectedCourse) return;
    const res = await fetch(`/api/upload/${uploadId}/assign-course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: selectedCourse.id }),
    });
    if (res.ok) {
      router.push(`/upload/${uploadId}/options?courseId=${selectedCourse.id}`);
    }
  }

  const canSave = processComplete && selectedCourse;
  const allCourses = useMemo(() => {
    const ids = new Set(courses.map((c) => c.id));
    if (selectedCourse && !ids.has(selectedCourse.id)) {
      return [...courses, { ...selectedCourse, sessionId: '' }];
    }
    return courses;
  }, [courses, selectedCourse]);

  return (
    <>
      <FileUploadContent
        files={files}
        uploadId={uploadId}
        isProcessing={isProcessing}
        progress={progress}
        statusLabel={statusLabel}
        processError={processError}
        processComplete={processComplete}
      />
      <CourseSelector
        courses={allCourses}
        selected={selectedCourse}
        onSelect={setSelectedCourse}
      />
      <section className={styles.section}>
        <button
          className={styles.generateBtn}
          disabled={!canSave}
          onClick={handleSave}
        >
          Save
        </button>
      </section>
    </>
  );
}
