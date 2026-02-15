import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUpload,
  getCourse,
  getAllFileMetadataByUploadId,
  updateUploadCourseId,
  updateDocumentsCourseId,
  updateClustersCourseIdByUpload,
} from "@/app/db/queries";
import { setPayloadByDocumentIds } from "@/app/lib/qdrant";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const sessionId = (await cookies()).get("sid")?.value;
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { uploadId } = await params;
  const body = await request.json();
  const { courseId } = body as { courseId?: string };

  if (!courseId) {
    return NextResponse.json({ ok: false, error: "courseId required" }, { status: 400 });
  }

  const upload = getUpload(uploadId);
  if (!upload || upload.sessionId !== sessionId) {
    return NextResponse.json({ ok: false, error: "Upload not found" }, { status: 404 });
  }

  const course = getCourse(courseId);
  if (!course || course.sessionId !== sessionId) {
    return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
  }

  const files = getAllFileMetadataByUploadId(uploadId);
  const fileIds = files.map((f) => f.id);

  updateUploadCourseId(uploadId, courseId);
  updateDocumentsCourseId(fileIds, courseId);
  updateClustersCourseIdByUpload(uploadId, courseId);
  await setPayloadByDocumentIds(fileIds, { course_id: courseId });

  return NextResponse.json({ ok: true });
}
