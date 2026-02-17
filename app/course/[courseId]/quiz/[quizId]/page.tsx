import { getCourse, getInteractionById, getChatGeneratedQuestions } from '@/app/db/queries';
import QuizReplayClient from './QuizReplayClient';
import TopBar from '@/app/components/TopBar';

interface PageProps {
  params: Promise<{ courseId: string; quizId: string }>;
}

export default async function QuizReplayPage({ params }: PageProps) {
  const { courseId, quizId } = await params;
  const course = getCourse(courseId);
  const interaction = getInteractionById(quizId);
  const questionSets = getChatGeneratedQuestions(quizId);

  if (!course || !interaction || interaction.type !== 'quiz') {
    return (
      <>
        <TopBar />
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          Quiz not found
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <QuizReplayClient
        courseId={courseId}
        courseName={course.name}
        quizTitle={interaction.title ?? 'Question set'}
        questionSets={questionSets}
      />
    </>
  );
}
