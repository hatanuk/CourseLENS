import { getCourse, getClustersByCourseId } from '@/app/db/queries';
import GenerateQuestionClient from './GenerateQuestionClient';
import TopBar from '@/app/components/TopBar';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function GenerateQuestionPage({ params }: PageProps) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  const clusters = getClustersByCourseId(courseId);

  if (!course) {
    return (
      <>
        <TopBar />
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>Course not found</div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <GenerateQuestionClient
        courseId={courseId}
        courseName={course.name}
        clusters={clusters}
      />
    </>
  );
}
