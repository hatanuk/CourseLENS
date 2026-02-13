import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import pLimit from "p-limit";
import { insertFileMetadata, insertUpload } from "../../db/queries";
import type { FileMetadata } from "../../data/structures";
import { validateFileTypeFromBuffer } from "../../data/upload";
import { getOrCreateSessionId } from "../../lib/sessionHandler";

type UploadResult =
    | { ok: true; redirectTo: string }
    | { ok: false; error: string }

const fileWriteLimit = pLimit(10)

async function safeWrite(filePath: string, buffer: Buffer, metadata: FileMetadata) {
    // atomic operation between filesystem write and database entry

    await writeFile(filePath, buffer)
    try {
        insertFileMetadata(metadata)
    } catch (err) {
        // rollback filesystem
        await unlink(filePath).catch(() => { })
        throw err
    }
}

export async function POST(request: Request): Promise<NextResponse<UploadResult>> {
    const formData = await request.formData()
    const files = formData.getAll('files')
        .filter((v: any): v is File => v instanceof File)

    if (!files || files.length < 1) {
        return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 })
    }

    const sessionId = await getOrCreateSessionId()

    // Persist the files
    const uploadDir = path.join(process.cwd(), "app", "data", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const metadata = []
    const uploadId = `${crypto.randomUUID()}`
    try {
        await Promise.all(
            files.map(async (file: File) =>
                fileWriteLimit(async () => {
                    const fileId = `${crypto.randomUUID()}`
                    const buffer = Buffer.from(await file.arrayBuffer())
                    const fileType = await validateFileTypeFromBuffer(buffer)
                    const filePath = path.join(uploadDir, fileId)

                    const meta: FileMetadata = {
                        id: fileId,
                        uploadId: uploadId,
                        originalName: file.name,
                        mimeType: fileType.mime,
                        ext: fileType.ext,
                        size: buffer.length,

                    }
                    await safeWrite(filePath, buffer, meta)
                })
            )
        )
    } catch (err) {
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : "Upload failed" },
            { status: 500 }
        )
    }
    const upload = {
        id: uploadId,
        sessionId
    }
    insertUpload(upload)

    return NextResponse.json({ ok: true, redirectTo: `/upload/${uploadId}` })
}
