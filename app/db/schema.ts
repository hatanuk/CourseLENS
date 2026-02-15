import Database from "better-sqlite3";

export const db = new Database("db.sqlite");

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      name TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      consumedAt TEXT,
      courseId TEXT
    );

    CREATE TABLE IF NOT EXISTS fileMetadata (
      id TEXT PRIMARY KEY,
      uploadId TEXT NOT NULL,
      originalName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      ext TEXT NOT NULL,
      size INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      courseId TEXT,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      lastIndexed TEXT,
      FOREIGN KEY (id) REFERENCES fileMetadata(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS indexNodes (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      parentId TEXT DEFAULT NULL,
      title TEXT NOT NULL,
      level INTEGER DEFAULT 0,
      sortOrder INTEGER DEFAULT 0,
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT,
      type TEXT CHECK(type IN ('quiz', 'chat')),
      courseId TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quizQuestions (
      id TEXT PRIMARY KEY,
      sessionId TEXT,
      question TEXT NOT NULL,
      type TEXT CHECK(type IN ('mcq', 'short', 'tf')),
      source TEXT,
      extra TEXT,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chatMessages (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      uploadId TEXT,
      courseId TEXT,
      topic TEXT NOT NULL,
      summary TEXT NOT NULL,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    );
`);
