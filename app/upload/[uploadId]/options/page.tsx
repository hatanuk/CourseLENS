import { getSessionId } from "@/app/lib/sessionHandler";
import { getUpload, getAllFileMetadataByUploadId, getCourse } from "@/app/db/queries";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import TopBar from "@/app/components/TopBar";
import OptionsPageClient from "./OptionsPageClient";
import styles from "../UploadPage.module.css";

export default async function OptionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ uploadId: string }>;
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { uploadId } = await params;
  const { courseId } = await searchParams;

  const sessionId = await getSessionId();
  if (!sessionId) redirect("/");

  const upload = getUpload(uploadId);
  if (!upload || upload.sessionId !== sessionId) notFound();

  const files = getAllFileMetadataByUploadId(uploadId);
  const course = courseId ? getCourse(courseId) : undefined;

  return (
    <AppShell>
      <TopBar />
      <div className={styles.container}>
        <OptionsPageClient
          uploadId={uploadId}
          courseId={courseId ?? null}
          courseName={course?.name ?? null}
          files={files}
        />
      </div>
    </AppShell>
  );
}
