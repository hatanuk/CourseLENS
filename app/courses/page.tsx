import { getAllCourses, getCourseDocs } from '../db/queries';
import AppShell from '../components/AppShell';
import CoursesClient from './CoursesClient';

export default function CoursesPage() {
  const courses = getAllCourses();

  const allDocs: Record<string, ReturnType<typeof getCourseDocs>> = {};
  for (const course of courses) {
    allDocs[course.id] = getCourseDocs(course.id);
  }

  return (
    <AppShell>
      <CoursesClient courses={courses} allDocs={allDocs} />
    </AppShell>
  );
}
