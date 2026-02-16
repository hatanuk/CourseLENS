import { getAllCourses, getClustersByCourseId, getCourseDocs, getDocument } from '../db/queries';
import { getChunksByClusterIds } from '../lib/qdrant';
import CoursesClient from './CoursesClient';
import { getSessionId } from '../lib/sessionHandler';
import { Course } from '../data/structures';
import TopBar from '../components/TopBar';
import type { Document } from '../data/structures';

export type TopicWithChunks = {
  id: string;
  topic: string;
  chunksByBook: Record<string, string[]>;
};

async function getTopicsWithChunks(courseId: string): Promise<TopicWithChunks[]> {
  const clusters = getClustersByCourseId(courseId);
  if (clusters.length === 0) return [];
  const clusterIds = clusters.map((c) => c.id);
  let chunks;
  try {
    chunks = await getChunksByClusterIds(courseId, clusterIds);
  } catch {
    return clusters.map((c) => ({ id: c.id, topic: c.topic, chunksByBook: {} }));
  }
  const docNames = new Map<string, string>();
  for (const c of chunks) {
    if (!docNames.has(c.document_id)) {
      const doc = getDocument(c.document_id);
      docNames.set(c.document_id, doc?.name ?? c.document_id);
    }
  }
  const byCluster = new Map<string, Map<string, string[]>>();
  for (const c of chunks) {
    let clusterMap = byCluster.get(c.cluster_id);
    if (!clusterMap) {
      clusterMap = new Map();
      byCluster.set(c.cluster_id, clusterMap);
    }
    const bookName = docNames.get(c.document_id) ?? c.document_id;
    let list = clusterMap.get(bookName);
    if (!list) {
      list = [];
      clusterMap.set(bookName, list);
    }
    list.push(c.text);
  }
  return clusters.map((cluster) => ({
    id: cluster.id,
    topic: cluster.topic,
    chunksByBook: Object.fromEntries(byCluster.get(cluster.id) ?? []),
  }));
}

export default async function CoursesPage() {
  const sessionId = await getSessionId();
  let courses: Course[] = [];
  if (sessionId) {
    courses = getAllCourses(sessionId);
  }

  const allTopics: Record<string, TopicWithChunks[]> = {};
  for (const course of courses) {
    allTopics[course.id] = await getTopicsWithChunks(course.id);
  }

  const courseDocuments: Record<string, Document[]> = {}
  if (sessionId) {
    for (let course of courses) {
       courseDocuments[course.id] = getCourseDocs(course.id)
    }
  }

  return (
    <>
      <TopBar />
      <CoursesClient courses={courses} courseDocs={courseDocuments} allTopics={allTopics} />
    </>
  );
}
