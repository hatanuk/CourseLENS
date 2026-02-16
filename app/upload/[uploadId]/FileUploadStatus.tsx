import { FileMetadata } from "@/app/data/structures";
import styles from "./UploadPage.module.css"


type FileUploadStatusProps {
    files: FileMetadata[];
    processError: string | null;
}

export default async function FileUploadStatus({files}: FileUploadStatusProps) {

    return <section className={styles.section}>
    <h2 className={styles.sectionTitle}>Files</h2>
    {files.length === 0 ? (
      <p className={styles.emptyState}>No files in this upload.</p>
    ) : (
      <>
        {processError && (
          <p className={styles.fileStatus} data-status="error" style={{ marginBottom: '0.5rem' }}>{processError}</p>
        )}
        <div className={styles.fileList}>
          {files.map((file) => (
            <div key={file.id} className={styles.fileRow}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.originalName}</span>
                <span className={styles.fileStatus} data-status={fileStatus}>
                  {fileStatus === 'processing' && (displayLabel ? `${displayLabel} ${Math.round(progress)}%` : 'Processing...')}
                  {fileStatus === 'pending' && 'Ready'}
                  {fileStatus === 'done' && 'Done'}
                  {fileStatus === 'error' && 'Error'}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </section>
}
