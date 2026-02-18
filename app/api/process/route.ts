import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { db } from "@/app/db/schema";
import { getUpload, getAllFileMetadataByUploadId, insertCluster, insertDocument, updateUploadConsumed } from "@/app/db/queries";
import { fileMetadataToDocument } from "@/app/data/structures";
import { elementsToChunks, extractAndSaveImages, processWithUnstructured } from "@/app/lib/unstructured";
import { labelClusters } from "@/app/lib/labeling";
import { ensureCollection, QdrantPoint, upsertPoints } from "@/app/lib/qdrant";

const PYTHON_URL = process.env.PYTHON_API_URL ?? "http://localhost:8000"

function sse(event: string, data: object): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
    const sessionId = (await cookies()).get("sid")?.value;
    if (!sessionId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, courseId } = body as { uploadId?: string; courseId?: string };

    if (!uploadId) {
        return NextResponse.json(
            { ok: false, error: "uploadId required" },
            { status: 400 }
        );
    }

    if (!courseId) {
        return NextResponse.json(
            { ok: false, error: "courseId required" },
            { status: 400 }
        );
    }

    const upload = getUpload(uploadId);
    if (!upload || upload.sessionId !== sessionId) {
        return NextResponse.json({ ok: false, error: "Upload not found" }, { status: 404 });
    }

    if (upload.consumedAt) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify({ ok: true })}\n\n`));
                controller.close();
            },
        });
        return new Response(stream, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
    }

    const files = getAllFileMetadataByUploadId(uploadId);
    if (files.length === 0) {
        return NextResponse.json({ ok: false, error: "No files in upload" }, { status: 404 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: string, data: object) =>
                controller.enqueue(encoder.encode(sse(event, data)));

            try {
                await ensureCollection();

                const totalFiles = files.length;
                const parseWeight = 25;
                const embedWeight = 25;
                const labelWeight = 25;
                const saveWeight = 25;

                let completed = 0;
                const elementsPerFile = await Promise.all(
                    files.map(async (file) => {
                        const el = await processWithUnstructured(file.id, file.originalName, file.mimeType);
                        completed++;
                        send("status", { stage: "parsing", progress: (completed / totalFiles) * parseWeight });
                        return el;
                    })
                );

                const chunksPerFile = elementsPerFile.map((el) => elementsToChunks(el));
                const chunkLengths = chunksPerFile.map((c) => c.length);
                const allChunks = chunksPerFile.flat();

                for (let f = 0; f < files.length; f++) {
                    await extractAndSaveImages(elementsPerFile[f], files[f].id);
                }

                send("status", { stage: "embedding", progress: parseWeight });
                const { embeddings, clusters } = await embedAndCluster(allChunks);
                send("status", { stage: "embedding", progress: parseWeight + embedWeight });

                const openaiKey = process.env.OPENAI_API_KEY;
                if (!openaiKey) throw new Error("OPENAI_API_KEY is not set");

                send("status", { stage: "labeling", progress: parseWeight + embedWeight });
                const { meta } = await labelClusters(allChunks, clusters, openaiKey);
                send("status", { stage: "labeling", progress: parseWeight + embedWeight + labelWeight });

                const indexToClusterId = new Map<number, string>();
                const dateAdded = new Date().toISOString();
                db.transaction(() => {
                    for (let i = 0; i < clusters.length; i++) {
                        const clusterId = randomUUID();
                        const m = meta[i];
                        insertCluster({ id: clusterId, uploadId, courseId, topic: m?.topic ?? "Unlabeled", summary: m?.summary ?? "" });
                        clusters[i].forEach((idx: number) => indexToClusterId.set(idx, clusterId));
                    }
                    for (const file of files) {
                        insertDocument(fileMetadataToDocument(file, courseId, { status: "processed", dateAdded }));
                    }
                })();

                const points: QdrantPoint[] = [];
                let globalIdx = 0;
                for (let f = 0; f < files.length; f++) {
                    const file = files[f];
                    const documentId = file.id;
                    for (let c = 0; c < chunkLengths[f]; c++) {
                        const clusterId = indexToClusterId.get(globalIdx) ?? "";
                        points.push({
                            id: randomUUID(),
                            vector: embeddings[globalIdx],
                            payload: {
                                course_id: courseId,
                                document_id: documentId,
                                chunk_index: c,
                                cluster_id: clusterId,
                                text: allChunks[globalIdx],
                            },
                        });
                        globalIdx++;
                    }
                }

                send("status", { stage: "saving", progress: parseWeight + embedWeight + labelWeight });
                await upsertPoints(points);
                updateUploadConsumed(uploadId);
                send("status", { stage: "saving", progress: 100 });
                send("complete", { ok: true });
            } catch (err) {
                console.error("[process]", err);
                send("error", { message: err instanceof Error ? err.message : "Processing failed" });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

const EMBED_TIMEOUT_MS = 120_000;

async function embedAndCluster(chunks: string[]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);
    let res: Response;
    try {
        res = await fetch(`${PYTHON_URL}/embed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chunks }),
            signal: controller.signal,
        });
    } catch (err) {
        clearTimeout(timeout);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("abort") || msg.includes("timeout")) {
            throw new Error(`Embedding timed out after ${EMBED_TIMEOUT_MS / 1000}s.`);
        }
        throw new Error(`Cannot reach embeddings server at ${PYTHON_URL}.`);
    }
    clearTimeout(timeout);

    if (!res.ok) {
        const text = await res.text();
        let errMsg: string;
        try {
            errMsg = JSON.stringify(JSON.parse(text));
        } catch {
            errMsg = text.slice(0, 200);
        }
        throw new Error(`API error ${res.status}: ${errMsg}`);
    }

    const data = await res.json();
    if (!data.embeddings || !data.clusters || !Array.isArray(data.embeddings) || !Array.isArray(data.clusters)) {
        throw new Error("Invalid response format from embedding service");
    }
    return data;
}
