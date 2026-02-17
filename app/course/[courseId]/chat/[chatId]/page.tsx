import { getCourse, getInteractionById, getChatMessages } from '@/app/db/queries';
import { insertInteraction } from '@/app/db/queries';
import ChatPageClient from './ChatPageClient';
import TopBar from '@/app/components/TopBar';

interface PageProps {
  params: Promise<{ courseId: string; chatId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { courseId, chatId } = await params;

  const course = getCourse(courseId);
  let interaction = getInteractionById(chatId);

  if (!course) {
    return (
      <>
        <TopBar />
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          Course not found
        </div>
      </>
    );
  }

  if (!interaction) {
    insertInteraction({
      id: chatId,
      title: null,
      type: 'chat',
      courseId,
      date: new Date().toISOString(),
    });
    interaction = getInteractionById(chatId)!;
  }

  const messages = getChatMessages(chatId);

  return (
    <>
      <TopBar />
      <ChatPageClient
        courseId={courseId}
        courseName={course.name}
        chatId={chatId}
        initialMessages={messages}
      />
    </>
  );
}
