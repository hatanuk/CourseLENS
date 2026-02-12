import type { Course, Document, IndexNode, QuizQuestion, ChatMessage, Session } from './structures';

export const courses: Course[] = [
    { id: 'cs101', name: 'Intro to Computer Science', documentCount: 12, indexedCount: 10 },
    { id: 'math201', name: 'Linear Algebra', documentCount: 8, indexedCount: 8 },
    { id: 'phys150', name: 'Physics I', documentCount: 15, indexedCount: 12 },
    { id: 'bio100', name: 'Biology Fundamentals', documentCount: 6, indexedCount: 4 },
  ];
  
  export const documents: Document[] = [
    { id: 'doc1', courseId: 'cs101', type: 'pdf', status: 'indexed', lastIndexed: '2024-01-15' },
    { id: 'doc2', courseId: 'cs101', type: 'pdf', status: 'indexed', lastIndexed: '2024-01-14' },
    { id: 'doc3', courseId: 'cs101', type: 'video', status: 'indexing', lastIndexed: null },
    { id: 'doc4', courseId: 'cs101', type: 'image', status: 'pending', lastIndexed: null },
    { id: 'doc5', courseId: 'math201', type: 'pdf', status: 'indexed', lastIndexed: '2024-01-10' },
    { id: 'doc6', courseId: 'math201', type: 'pdf', status: 'indexed', lastIndexed: '2024-01-12' },
    { id: 'doc7', courseId: 'phys150', type: 'pdf', status: 'indexed', lastIndexed: '2024-01-08' },
    { id: 'doc8', courseId: 'phys150', type: 'video', status: 'error', lastIndexed: null },
    { id: 'doc9', courseId: 'bio100', type: 'pdf', status: 'indexed', lastIndexed: '2024-01-05' },
  ];
  
  export const sampleIndex: IndexNode[] = [
    {
      id: 'ch1',
      title: '1. Introduction to Computing',
      level: 0,
      children: [
        { id: 'ch1.1', title: '1.1 What is a Computer?', level: 1 },
        { id: 'ch1.2', title: '1.2 History of Computing', level: 1 },
        {
          id: 'ch1.3',
          title: '1.3 Computer Architecture',
          level: 1,
          children: [
            { id: 'ch1.3.1', title: '1.3.1 CPU and Memory', level: 2 },
            { id: 'ch1.3.2', title: '1.3.2 Input/Output', level: 2 },
          ],
        },
      ],
    },
    {
      id: 'ch2',
      title: '2. Programming Basics',
      level: 0,
      children: [
        { id: 'ch2.1', title: '2.1 Variables and Types', level: 1 },
        { id: 'ch2.2', title: '2.2 Control Flow', level: 1 },
        { id: 'ch2.3', title: '2.3 Functions', level: 1 },
      ],
    },
    {
      id: 'ch3',
      title: '3. Data Structures',
      level: 0,
      children: [
        { id: 'ch3.1', title: '3.1 Arrays and Lists', level: 1 },
        { id: 'ch3.2', title: '3.2 Trees and Graphs', level: 1 },
      ],
    },
  ];
  
  export const mockQuestions: QuizQuestion[] = [
    { id: 'q1', question: 'What are the main components of a CPU?', type: 'short' },
    { id: 'q2', question: 'A variable can change its type during runtime in Python.', type: 'tf' },
    { id: 'q3', question: 'Which data structure uses LIFO ordering?', type: 'mcq' },
  ];
  
  export const mockChatHistory: ChatMessage[] = [
    { id: 'm1', role: 'user', content: 'Explain the concept of recursion.' },
    { id: 'm2', role: 'assistant', content: 'Recursion is a programming technique where a function calls itself to solve smaller instances of the same problem. It requires a base case to terminate.' },
  ];
  
  export const mockSessions: Session[] = [
    { id: 's1', title: 'Quiz: Chapter 1 Review', date: '2024-01-15', type: 'quiz' },
    { id: 's2', title: 'Chat: Recursion concepts', date: '2024-01-14', type: 'chat' },
    { id: 's3', title: 'Quiz: Data Structures', date: '2024-01-12', type: 'quiz' },
  ];
  
  export function getCourseDocs(courseId: string): Document[] {
    return documents.filter(d => d.courseId === courseId);
  }

  export function getCourse(courseId: string): Course | undefined {
    return courses.find(c => c.id === courseId);
  }
  
  export function getDocument(id: string): Document | undefined {
    return documents.find(d => d.id === id);
  }
  