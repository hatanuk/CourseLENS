

export interface FileMetadata {
  id: string;
  uploadId: string;
  originalName: string;
  mimeType: string;
  ext: string;
  size: number;
}

export interface Course {
  id: string;
  sessionId: string;
  name: string;

}

export interface Document {
  id: string; // maps to FileMetadata.id
  name?: string; // filename, set from FileMetadata.originalName when saving
  courseId: string | null;
  type: 'pdf' | 'video' | 'image'| 'text';
  status: 'processing' | 'processed' | 'error';
  dateAdded: string | null;
}

export interface IndexNode {
  id: string;
  title: string;
  level: number;
  children?: IndexNode[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'short' | 'tf';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  type: 'quiz' | 'chat';
}

export interface Upload {
  id: string;
  sessionId: string;
  createdAt: string;
  consumedAt: string | null;
}

export interface Cluster {
  id: string
  uploadId: string | null
  courseId: string | null
  topic: string
  summary: string
}

export type DocumentType = Document['type'];

/** Infers document type from FileMetadata (mimeType/ext). Defaults to 'text' for unknown types. */
export function fileMetadataToDocument(
  meta: FileMetadata,
  courseId: string,
  overrides?: Partial<Pick<Document, 'courseId' | 'status' | 'dateAdded'>>
): Document {
  const type = inferDocumentType(meta.mimeType, meta.ext);
  return {
    id: meta.id,
    name: meta.originalName,
    courseId,
    type,
    status: overrides?.status ?? 'processing',
    dateAdded: overrides?.dateAdded ?? new Date().toISOString(),
  };
}

function inferDocumentType(mimeType: string, ext: string): DocumentType {
  const m = mimeType.toLowerCase();
  const e = ext.toLowerCase().replace(/^\./, '');
  if (m.includes('pdf') || e === 'pdf') return 'pdf';
  if (m.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(e)) return 'video';
  if (m.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(e)) return 'image';
  return 'text';
}
