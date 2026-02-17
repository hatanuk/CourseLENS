import { db } from "./schema";
import type { Course, Document, FileMetadata, IndexNode, QuizQuestion, ChatMessage, Upload, Cluster, Interaction, GeneratedQuestionSet, GeneratedQuestion } from '../data/structures';

// === Fetch Statements ===
const getAllCoursesStmt = db.prepare("SELECT * FROM courses WHERE sessionId = ?");
const getCourseStmt = db.prepare("SELECT * FROM courses WHERE id = ?");
const getCourseByNameStmt = db.prepare("SELECT * FROM courses WHERE sessionId = ? AND name = ?");
const getCourseDocsStmt = db.prepare("SELECT * FROM documents WHERE courseId = ?");
const getDocumentStmt = db.prepare("SELECT * FROM documents WHERE id = ?");
const getFileMetadataStmt = db.prepare("SELECT * FROM fileMetadata WHERE id = ?");
const getFileMetadataByUploadIdStmt = db.prepare("SELECT * FROM fileMetadata WHERE uploadId = ?");
const getUploadStmt = db.prepare("SELECT * FROM uploads WHERE id = ?");
const getUploadsBySessionIdStmt = db.prepare("SELECT * FROM uploads WHERE sessionId = ? ORDER BY createdAt DESC");
const getAllInteractionsStmt = db.prepare("SELECT * FROM interactions ORDER BY date DESC");
const getInteractionByIdStmt = db.prepare("SELECT * FROM interactions WHERE id = ?");
const getInteractionsByCourseStmt = db.prepare("SELECT * FROM interactions WHERE courseId = ? ORDER BY date DESC");
const getTotalQuestionsByCourseStmt = db.prepare(
  "SELECT COUNT(*) as count FROM quizQuestions q JOIN interactions i ON q.interactionId = i.id WHERE i.courseId = ?"
);
const getChatMessagesStmt = db.prepare("SELECT * FROM chatMessages WHERE interactionId = ? ORDER BY sentAt");
const getQuizQuestionsStmt = db.prepare("SELECT * FROM quizQuestions WHERE interactionId = ?");
const getIndexNodesStmt = db.prepare("SELECT * FROM indexNodes WHERE documentId = ? ORDER BY sortOrder");
const getClustersByCourseIdStmt = db.prepare("SELECT * FROM clusters WHERE courseId = ? ORDER BY topic");

// === Insert Statements ===
const insertCourseStmt = db.prepare(
    "INSERT OR REPLACE INTO courses (id, sessionId, name) VALUES (?, ?, ?)"
);
const insertUploadStmt = db.prepare(
    "INSERT OR REPLACE INTO uploads (id, sessionId, createdAt, consumedAt) VALUES (?, ?, ?, ?)"
);
const insertFileMetadataStmt = db.prepare(
    "INSERT OR REPLACE INTO fileMetadata (id, uploadId, originalName, mimeType, ext, size) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertDocumentStmt = db.prepare(
    "INSERT OR REPLACE INTO documents (id, name, courseId, type, status, dateAdded) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertInteractionStmt = db.prepare(
    "INSERT OR REPLACE INTO interactions (id, title, type, courseId, date) VALUES (?, ?, ?, ?, ?)"
);
const insertChatMessageStmt = db.prepare(
    "INSERT INTO chatMessages (id, interactionId, role, content, sentAt, toolUsage) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertIndexNodeStmt = db.prepare(
    "INSERT OR REPLACE INTO indexNodes (id, documentId, parentId, title, level, sortOrder) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertClusterStmt = db.prepare(
    "INSERT OR REPLACE INTO clusters (id, uploadId, courseId, topic, summary) VALUES (?, ?, ?, ?, ?)"
);
const insertQuizQuestionStmt = db.prepare(
    "INSERT INTO quizQuestions (id, interactionId, question, type, source, extra) VALUES (?, ?, ?, ?, ?, ?)"
);

// === Update Statement ===
const updateUploadConsumedStmt = db.prepare("UPDATE uploads SET consumedAt = ? WHERE id = ?");
const updateDocumentCourseIdStmt = db.prepare("UPDATE documents SET courseId = ? WHERE id = ?");
const updateClustersCourseIdByUploadStmt = db.prepare("UPDATE clusters SET courseId = ? WHERE uploadId = ?");
const updateInteractionTitleStmt = db.prepare("UPDATE interactions SET title = ? WHERE id = ?")

// === Query Functions ===
export function getAllCourses(sessionId: string): Course[] {
    return getAllCoursesStmt.all(sessionId) as Course[];
}

export function getCourse(courseId: string): Course | undefined {
    return getCourseStmt.get(courseId) as Course | undefined;
}

export function getCourseByName(sessionId: string, name: string): Course | undefined {
    return getCourseByNameStmt.get(sessionId, name) as Course | undefined;
}

export function getCourseDocs(courseId: string): Document[] {
    return getCourseDocsStmt.all(courseId) as Document[];
}

export function getCourseDocsWithNames(courseId: string): Document[] {
    return getCourseDocsStmt.all(courseId) as Document[];
}

export function getDocument(id: string): Document | undefined {
    return getDocumentStmt.get(id) as Document | undefined;
}

export function getFileMetadata(id: string): FileMetadata | undefined {
    return getFileMetadataStmt.get(id) as FileMetadata | undefined;
}

export function getAllFileMetadataByUploadId(uploadId: string): FileMetadata[] {
    return getFileMetadataByUploadIdStmt.all(uploadId) as FileMetadata[];
}

export function getUpload(id: string): Upload | undefined {
    return getUploadStmt.get(id) as Upload | undefined;
}

export function updateUploadConsumed(uploadId: string): void {
    updateUploadConsumedStmt.run(new Date().toISOString(), uploadId);
}

export function updateDocumentsCourseId(fileIds: string[], courseId: string): void {
    for (const id of fileIds) {
        updateDocumentCourseIdStmt.run(courseId, id);
    }
}

export function updateClustersCourseIdByUpload(uploadId: string, courseId: string): void {
    updateClustersCourseIdByUploadStmt.run(courseId, uploadId);
}

export function getUploadsBySessionId(sessionId: string): Upload[] {
    return getUploadsBySessionIdStmt.all(sessionId) as Upload[];
}

export function getAllInteractions(): Interaction[] {
    return getAllInteractionsStmt.all() as Interaction[];
}

export function getInteractionById(id: string): (Interaction  & { courseId?: string }) | undefined {
    return getInteractionByIdStmt.get(id) as (Interaction & { courseId?: string }) | undefined;
}

export function getInteractionsByCourse(courseId: string): Interaction[] {
    return getInteractionsByCourseStmt.all(courseId) as Interaction[];
}

export function getTotalQuestionsByCourse(courseId: string): number {
    const row = getTotalQuestionsByCourseStmt.get(courseId) as { count: number } | undefined;
    return row?.count ?? 0;
}

export function getChatMessages(interactionId: string): ChatMessage[] {
    const rows = getChatMessagesStmt.all(interactionId) as Array<ChatMessage & { toolUsage?: string | null }>;
    return rows.map((r) => {
        const { toolUsage: raw, ...rest } = r;
        const toolUsage = raw ? (() => { try { return JSON.parse(raw) as ChatMessage['toolUsage']; } catch { return undefined; } })() : undefined;
        return { ...rest, toolUsage };
    });
}

export function getQuizQuestions(interactionId: string): QuizQuestion[] {
    return getQuizQuestionsStmt.all(interactionId) as QuizQuestion[];
}

export function getChatGeneratedQuestions(interactionId: string): GeneratedQuestionSet[] {
    const rows = getQuizQuestionsStmt.all(interactionId) as Array<QuizQuestion & { source?: string; extra?: string }>;
    if (rows.length === 0) return [];
    const set: GeneratedQuestionSet = {
        question_type: rows[0].type === 'mcq' ? 'multiple_choice' : rows[0].type === 'tf' ? 'true_false' : 'multiple_choice',
        topic: rows[0].source ?? undefined,
        questions: rows.map((r) => {
            const q: GeneratedQuestion = { text: r.question };
            if (r.extra) {
                try {
                    const ex = JSON.parse(r.extra) as { options?: string[]; correct?: number | boolean };
                    if (ex.options) q.options = ex.options;
                    if (ex.correct !== undefined) q.correct = ex.correct;
                } catch {
                    /* ignore */
                }
            }
            return q;
        }),
    };
    return [set];
}

export function getClustersByCourseId(courseId: string): Cluster[] {
    return getClustersByCourseIdStmt.all(courseId) as Cluster[];
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

export function updateInteractionTitle(interactionId: string, title: string): void {
    updateInteractionTitleStmt.run(interactionId, title)
}

export function insertUpload(upload: Omit<Upload, "createdAt" | "consumedAt">): void {
    insertUploadStmt.run(upload.id, upload.sessionId, new Date().toISOString(), null);
}

export function insertFileMetadata(meta: FileMetadata): void {
    insertFileMetadataStmt.run(meta.id, meta.uploadId, meta.originalName, meta.mimeType, meta.ext, meta.size);
}

export function insertCourse(course: Course): void {
    insertCourseStmt.run(course.id, course.sessionId, course.name);
}

export function insertDocument(doc: Document): void {
    insertDocumentStmt.run(doc.id, doc.name, doc.courseId, doc.type, doc.status, doc.dateAdded);
}

export function insertInteraction(interaction: Interaction & { courseId?: string }): void {
    insertInteractionStmt.run(interaction.id, interaction.title, interaction.type, interaction.courseId ?? null, interaction.date);
}

export function insertChatMessage(msg: ChatMessage): void {
    const toolUsageJson = msg.toolUsage ? JSON.stringify(msg.toolUsage) : null;
    insertChatMessageStmt.run(msg.id, msg.interactionId, msg.role, msg.content, msg.sentAt ?? new Date().toISOString(), toolUsageJson);
}

export function insertCluster(cluster: Cluster): void {
    insertClusterStmt.run(cluster.id, cluster.uploadId ?? null, cluster.courseId ?? null, cluster.topic, cluster.summary)
}

export function insertQuizQuestion(q: { id: string; interactionId: string; question: string; type: 'mcq' | 'short' | 'tf'; source?: string; extra?: string }): void {
    insertQuizQuestionStmt.run(q.id, q.interactionId, q.question, q.type, q.source ?? null, q.extra ?? null);
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

