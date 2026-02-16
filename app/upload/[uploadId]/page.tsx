import { getSessionId } from "@/app/lib/sessionHandler";
import { getUpload, getAllFileMetadataByUploadId, getAllCourses } from "@/app/db/queries";
import { notFound, redirect } from "next/navigation";
import TopBar from "@/app/components/TopBar";
import UploadPageWrapper from "./UploadPageWrapper";
import styles from "./UploadPage.module.css";

export default async function Page({ params }: { params: Promise<{ uploadId: string }> }) {
    const { uploadId } = await params;
    const sessionId = await getSessionId();
    if (!sessionId) redirect("/");

    const upload = getUpload(uploadId);
    if (!upload || upload.sessionId !== sessionId) notFound();

    const files = getAllFileMetadataByUploadId(uploadId);
    const courses = getAllCourses(sessionId);

    return (
        <>
            <TopBar />
            <div className={styles.container}>
                <UploadPageWrapper files={files} uploadId={uploadId} courses={courses} consumedAt={upload.consumedAt} />
            </div>
        </>
    );
}
