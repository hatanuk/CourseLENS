import { db } from "./schema";
import type { Course, Document, FileMetadata, IndexNode, QuizQuestion, ChatMessage, Session, Upload } from '../data/structures';

// === Fetch Statements ===
const getAllCoursesStmt = db.prepare("SELECT * FROM courses");
const getCourseStmt = db.prepare("SELECT * FROM courses WHERE id = ?");
const getCourseDocsStmt = db.prepare("SELECT * FROM documents WHERE courseId = ?");
const getDocumentStmt = db.prepare("SELECT * FROM documents WHERE id = ?");
const getFileMetadataStmt = db.prepare("SELECT * FROM fileMetadata WHERE id = ?");
const getFileMetadataByUploadIdStmt = db.prepare("SELECT * FROM fileMetadata WHERE uploadId = ?");
const getUploadStmt = db.prepare("SELECT * FROM uploads WHERE id = ?");
const getUploadsBySessionIdStmt = db.prepare("SELECT * FROM uploads WHERE sessionId = ? ORDER BY createdAt DESC");
const getAllSessionsStmt = db.prepare("SELECT * FROM sessions ORDER BY date DESC");
const getSessionsByCourseStmt = db.prepare("SELECT * FROM sessions WHERE courseId = ? ORDER BY date DESC");
const getChatMessagesStmt = db.prepare("SELECT * FROM chatMessages WHERE sessionId = ? ORDER BY createdAt");
const getQuizQuestionsStmt = db.prepare("SELECT * FROM quizQuestions WHERE sessionId = ?");
const getIndexNodesStmt = db.prepare("SELECT * FROM indexNodes WHERE documentId = ? ORDER BY sortOrder");

// === Insert Statements ===
const insertCourseStmt = db.prepare(
    "INSERT OR REPLACE INTO courses (id, name, documentCount, indexedCount) VALUES (?, ?, ?, ?)"
);
const insertUploadStmt = db.prepare(
    "INSERT OR REPLACE INTO uploads (id, sessionId, createdAt, consumedAt) VALUES (?, ?, ?, ?)"
);
const insertFileMetadataStmt = db.prepare(
    "INSERT OR REPLACE INTO fileMetadata (id, uploadId, originalName, mimeType, ext, size) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertDocumentStmt = db.prepare(
    "INSERT OR REPLACE INTO documents (id, courseId, type, status, lastIndexed) VALUES (?, ?, ?, ?, ?)"
);
const insertSessionStmt = db.prepare(
    "INSERT OR REPLACE INTO sessions (id, title, type, courseId, date) VALUES (?, ?, ?, ?, ?)"
);
const insertChatMessageStmt = db.prepare(
    "INSERT INTO chatMessages (id, sessionId, role, content) VALUES (?, ?, ?, ?)"
);
const insertIndexNodeStmt = db.prepare(
    "INSERT OR REPLACE INTO indexNodes (id, documentId, parentId, title, level, sortOrder) VALUES (?, ?, ?, ?, ?, ?)"
);

// === Query Functions ===
export function getAllCourses(): Course[] {
    return getAllCoursesStmt.all() as Course[];
}

export function getCourse(courseId: string): Course | undefined {
    return getCourseStmt.get(courseId) as Course | undefined;
}

export function getCourseDocs(courseId: string): Document[] {
    return getCourseDocsStmt.all(courseId) as Document[];
}

export function getDocument(id: string): Document | undefined {
    return getDocumentStmt.get(id) as Document | undefined;
}

export function getFileMetadata(id: string): FileMetadata | undefined {
    return getFileMetadataStmt.get(id) as FileMetadata | undefined;
}

export function getFileMetadataByUploadId(uploadId: string): FileMetadata | undefined {
    return getFileMetadataByUploadIdStmt.get(uploadId) as FileMetadata | undefined;
}

export function getUpload(id: string): Upload | undefined {
    return getUploadStmt.get(id) as Upload | undefined;
}

export function getUploadsBySessionId(sessionId: string): Upload[] {
    return getUploadsBySessionIdStmt.all(sessionId) as Upload[];
}

export function getAllSessions(): Session[] {
    return getAllSessionsStmt.all() as Session[];
}

export function getSessionsByCourse(courseId: string): Session[] {
    return getSessionsByCourseStmt.all(courseId) as Session[];
}

export function getChatMessages(sessionId: string): ChatMessage[] {
    return getChatMessagesStmt.all(sessionId) as ChatMessage[];
}

export function getQuizQuestions(sessionId: string): QuizQuestion[] {
    return getQuizQuestionsStmt.all(sessionId) as QuizQuestion[];
}

export function getIndexNodes(documentId: string): IndexNode[] {
    const rows = getIndexNodesStmt.all(documentId) as Array<{
        id: string;
        documentId: string;
        parentId: string | null;
        title: string;
        level: number;
        sortOrder: number;
    }>;
    return buildTree(rows);
}

function buildTree(rows: Array<{ id: string; parentId: string | null; title: string; level: number }>): IndexNode[] {
    const nodeMap = new Map<string, IndexNode>();
    const roots: IndexNode[] = [];

    for (const row of rows) {
        nodeMap.set(row.id, { id: row.id, title: row.title, level: row.level, children: [] });
    }

    for (const row of rows) {
        const node = nodeMap.get(row.id)!;
        if (row.parentId && nodeMap.has(row.parentId)) {
            nodeMap.get(row.parentId)!.children!.push(node);
        } else {
            roots.push(node);
        }
    }

    for (const node of nodeMap.values()) {
        if (node.children?.length === 0) delete node.children;
    }

    return roots;
}

// === Insert Functions ===

export function insertUpload(upload: Omit<Upload, "createdAt" | "consumedAt">): void {
    insertUploadStmt.run(upload.id, upload.sessionId, new Date().toISOString(), null);
}

export function insertFileMetadata(meta: FileMetadata): void {
    insertFileMetadataStmt.run(meta.id, meta.uploadId, meta.originalName, meta.mimeType, meta.ext, meta.size);
}

export function insertCourse(course: Course): void {
    insertCourseStmt.run(course.id, course.name, course.documentCount, course.indexedCount);
}

export function insertDocument(doc: Document): void {
    insertDocumentStmt.run(doc.id, doc.courseId, doc.type, doc.status, doc.lastIndexed);
}

export function insertSession(session: Session & { courseId?: string }): void {
    insertSessionStmt.run(session.id, session.title, session.type, session.courseId ?? null, session.date);
}

export function insertChatMessage(sessionId: string, msg: ChatMessage): void {
    insertChatMessageStmt.run(msg.id, sessionId, msg.role, msg.content);
}

export function insertIndexTree(documentId: string, nodes: IndexNode[], parentId: string | null = null, startOrder = 0): number {
    let order = startOrder;
    for (const node of nodes) {
        insertIndexNodeStmt.run(node.id, documentId, parentId, node.title, node.level, order++);
        if (node.children) {
            order = insertIndexTree(documentId, node.children, node.id, order);
        }
    }
    return order;
}

// === Seeding ===
export function seedDatabase(): void {
    const existing = getAllCoursesStmt.all();
    if (existing.length > 0) return;

    const { courses, documents, sampleIndex, mockSessions, mockChatHistory } = require('../data/mock');

    for (const course of courses) insertCourse(course);
    for (const doc of documents) insertDocument(doc);

    if (documents.length > 0) {
        insertIndexTree(documents[0].id, sampleIndex);
    }

    for (const session of mockSessions) {
        insertSession({ ...session, courseId: 'cs101' });
    }

    const chatSession = mockSessions.find((s: Session) => s.type === 'chat');
    if (chatSession) {
        for (const msg of mockChatHistory) {
            insertChatMessage(chatSession.id, msg);
        }
    }
}

seedDatabase();
