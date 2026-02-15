import { getAllCourses, getCourseDocsWithNames } from '../db/queries';
import AppShell from '../components/AppShell';
import CoursesClient from './CoursesClient';
import { getSessionId } from '../lib/sessionHandler';
import { Course } from '../data/structures';
import TopBar from '../components/TopBar';

export default async function CoursesPage() {

  const sessionId = await getSessionId()
  let courses: Course[] = []
  if (sessionId) {
    courses = getAllCourses(sessionId)
  }

  const allDocs: Record<string, ReturnType<typeof getCourseDocsWithNames>> = {};
  for (const course of courses) {
    allDocs[course.id] = getCourseDocsWithNames(course.id);
  }

  return (
    <AppShell>
      <TopBar />
      <CoursesClient courses={courses} allDocs={allDocs} />
    </AppShell>
  );
}
