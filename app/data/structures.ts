

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
  name: string;
  documentCount: number;
  indexedCount: number;
}

export interface Document {
  id: string; // maps to FileMetadata.id
  courseId: string | null;
  type: 'pdf' | 'video' | 'image';
  status: 'pending' | 'indexing' | 'indexed' | 'error';
  lastIndexed: string | null;
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
