import { getSessionId } from "@/app/lib/sessionHandler";
import { getUpload, getAllFileMetadataByUploadId } from "@/app/db/queries";
import { notFound, redirect } from "next/navigation"
import AppShell from "@/app/components/AppShell";
import { Suspense } from "react";
import UploadPageWrapper from "./UploadPageWrapper";
import styles from './UploadPage.module.css'
import TopBar from "@/app/components/TopBar";

async function UploadContent({ uploadId }: { uploadId: string }) {
    const sessionId = await getSessionId()
    const upload = getUpload(uploadId)

    if (!sessionId) {
        redirect("/")
    }

    if (!upload || upload.sessionId !== sessionId) {
        notFound()
    }

    const files = getAllFileMetadataByUploadId(uploadId);

    return (
        <UploadPageWrapper files={files} uploadId={uploadId} />
    );
}

export default async function Page({ params }: { params: Promise<{ uploadId: string }> }) {
    const { uploadId } = await params;
    return (
        <AppShell>
            <TopBar />
            <div className={styles.container}>
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading upload...</div>}>
                    <UploadContent uploadId={uploadId} />
                </Suspense>
            </div>
        </AppShell>
    );
}
