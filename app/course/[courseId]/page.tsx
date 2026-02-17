import { getCourse, getCourseDocs, getInteractionsByCourse } from '@/app/db/queries';
import CourseClient from './CourseClient';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: PageProps) {
  const { courseId } = await params;
  
  const course = getCourse(courseId);
  const docs = getCourseDocs(courseId);
  const sessions = getInteractionsByCourse(courseId);

  if (!course) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>Course not found</div>;
  }

  return (
    <CourseClient 
      course={course}
      docs={docs}
      sessions={sessions}
      courseId={courseId}
    />
  );
}
