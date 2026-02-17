'use client';

import { useState } from 'react';
import type { Course } from '@/app/data/structures';
import SelectDropdown from '@/app/components/SelectDropdown/SelectDropdown';
import styles from './UploadPage.module.css';

type CourseOption = { id: string; name: string } | null;

interface CourseSelectorProps {
  courses: Course[];
  selected: CourseOption;
  onSelect: (course: CourseOption) => void;
  disabled?: boolean;
}

export default function CourseSelector({ courses, selected, onSelect, disabled }: CourseSelectorProps) {
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
      onSelect({ id: data.course.id, name: data.course.name });
      setNewName('');
      setIsCreating(false);
    } else {
      setCreateError(data.error ?? 'Failed to create course');
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Course</h2>
      {isCreating ? (
        <div className={styles.optionGroup}>
          <input
            type="text"
            className={styles.input}
            placeholder="Course name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          {createError && <p className={styles.fileStatus} data-status="error" style={{ marginTop: '0.5rem' }}>{createError}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className={styles.generateBtn}
              onClick={handleCreate}
              disabled={!newName.trim() || disabled}
            >
              Create
            </button>
            <button
              type="button"
              className={styles.segmentedBtn}
              onClick={() => { setIsCreating(false); setNewName(''); setCreateError(null); }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.optionGroup}>
          <SelectDropdown
            items={courses.map((c) => ({ id: c.id, label: c.name }))}
            selectedIds={selected ? new Set([selected.id]) : new Set()}
            onSelect={(id) => {
              const c = courses.find((x) => x.id === id);
              if (c) onSelect({ id: c.id, name: c.name });
            }}
            onClear={() => onSelect(null)}
            placeholder="Select a course"
            disabled={disabled}
          />
          <button
            type="button"
            className={styles.segmentedBtn}
            onClick={() => setIsCreating(true)}
            disabled={disabled}
            style={{ marginTop: '0.5rem' }}
          >
            + Create new course
          </button>
        </div>
      )}
    </section>
  );
}
