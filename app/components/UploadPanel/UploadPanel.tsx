'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getIcon } from './FilePreview';
import FilePreview from './FilePreview';
import styles from './UploadPanel.module.css';
import handleUpload from '@/app/actions/upload';
import { ACCEPTED_MIME_TYPES, isAcceptedFile } from '@/app/data/upload';

const MAX_FILES = 6;

const FILE_TYPES = [
  { label: 'pdf', icon: getIcon('pdf', 18), color: '#e37717' },
  { label: 'txt', icon: getIcon('txt', 18), color: '#64748b' },
  { label: 'pptx', icon: getIcon('pptx', 18), color: '#e34d3d' },
  { label: 'docx', icon: getIcon('docx', 18), color: '#2961d9' },
] as const;

export default function UploadPanel() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = files.length > 0

  const [state, upload, pending] = useActionState(handleUpload, null)

  async function handleSubmit() {
    const fd = new FormData()
  
    files.forEach(file => {
      fd.append("files", file)
    })
  
    startTransition(() => {
      upload(fd)
    })
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function addFiles(newFiles: File[]) {
    setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  function clearAll() {
    setFiles([]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (selected?.length) {
      const accepted = Array.from(selected).filter(isAcceptedFile);
      addFiles(accepted);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isAcceptedFile(file)) {
      addFiles([file]);
    }
  }

  const dropAreaClass = `${styles.dropArea} ${isDragging ? styles.dropAreaDragging : ''}`;

  return (
    <div className={styles.panel}>
      <div
        className={dropAreaClass}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest(`.${styles.removeBtn}`) && !target.closest(`.${styles.clearAllBtn}`)) {
            inputRef.current?.click();
          }
        }}
      >
        {files.length > 0 ? (
          <>
            <div className={styles.filePreviews}>
              {files.map((file, i) => (
                <div key={`${file.name}-${file.size}-${i}`} className={styles.filePreviewWrap}>
                  <FilePreview file={file} onRemove={() => removeFile(i)} />
                </div>
              ))}
            </div>
            <div className={styles.limitRow}>
              <span className={styles.limitIndicator}>{files.length}/{MAX_FILES} files</span>
              <button type="button" className={styles.clearAllBtn} onClick={(e) => { e.stopPropagation(); clearAll(); }}>
                Clear all
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.dropEmpty}>
              <div className={styles.dropIcon}>◡̈</div>
              <div className={styles.dropText}>drag & drop</div>
              <div className={styles.dropHint}>or click to add your course material here!</div>
            </div>
            <div className={styles.fileTypeChips}>
              {FILE_TYPES.map(({ label, icon, color }) => (
                <div key={label} className={styles.chip}>
                  <span style={{ color }}>{icon}</span>
                  <span className={styles.chipLabel}>{label}</span>
                </div>
              ))}
            </div>
            <div className={`${styles.chip} ${styles.fileTypeChips}`}>etc ... </div>
          </>
        )}
      </div>

      <button
        className={styles.submitBtn}
        disabled={!canSubmit || pending}
        onClick={handleSubmit}
      >
        {pending ? (
          <>
            <Loader2 className={styles.submitSpinner} size={18} />
            Uploading…
          </>
        ) : (
          'Submit'
        )}
      </button>

        <input
          type="file"
          name="files"
          ref={inputRef}
          onChange={handleFileSelect}
          accept={ACCEPTED_MIME_TYPES.join(',')}
          multiple
          hidden
        />
    </div>
  );
}
