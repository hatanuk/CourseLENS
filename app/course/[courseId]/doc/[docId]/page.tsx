import { getAllCourses, getCourse, getCourseDocs, getDocument, getIndexNodes } from '@/app/db/queries';
import DocumentWorkspaceClient from './DocumentWorkspaceClient';

interface PageProps {
  params: Promise<{ courseId: string; docId: string }>;
}

export default async function DocumentWorkspacePage({ params }: PageProps) {
  const { courseId, docId } = await params;

  const courses = getAllCourses();
  const course = getCourse(courseId);
  const doc = getDocument(docId);
  
  // Get all docs for each course (for the course switcher)
  const allDocs: Record<string, ReturnType<typeof getCourseDocs>> = {};
  for (const c of courses) {
    allDocs[c.id] = getCourseDocs(c.id);
  }

  // Get index nodes for this document, fallback to sample if none
  let indexNodes = getIndexNodes(docId);

  if (!course || !doc) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>Document not found</div>;
  }

  return (
    <DocumentWorkspaceClient
      courses={courses}
      course={course}
      doc={doc}
      allDocs={allDocs}
      indexNodes={indexNodes}
      courseId={courseId}
      docId={docId}
    />
  );
}
