import { getSessionId } from "@/app/lib/sessionHandler";
import { getUpload, getAllFileMetadataByUploadId } from "@/app/db/queries";
import { notFound, redirect } from "next/navigation";
import TopBar from "@/app/components/TopBar";
import StatusPageClient from "./StatusPageClient";
import styles from "../UploadPage.module.css";

export default async function StatusPage({
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

  return (
    <>
      <TopBar />
      <div className={styles.container}>
        <StatusPageClient
          uploadId={uploadId}
          courseId={courseId ?? null}
          files={files}
        />
      </div>
    </>
  );
}
