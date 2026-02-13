import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUpload, getFileMetadata } from "@/app/db/queries";
import { processWithUnstructured } from "@/app/lib/unstructured";

export async function POST(request: Request) {
  const sessionId = (await cookies()).get("sid")?.value;
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { uploadId, fileId } = body as { uploadId?: string; fileId?: string };

  if (!uploadId || !fileId) {
    return NextResponse.json(
      { ok: false, error: "uploadId and fileId required" },
      { status: 400 }
    );
  }

  const upload = getUpload(uploadId);
  if (!upload || upload.sessionId !== sessionId) {
    return NextResponse.json({ ok: false, error: "Upload not found" }, { status: 404 });
  }

  const file = getFileMetadata(fileId);
  if (!file || file.uploadId !== uploadId) {
    return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
  }

  try {
    const chunks = await processWithUnstructured(
      file.id,
      file.originalName,
      file.mimeType
    );

    



    return NextResponse.json({ ok: true, elements });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Processing failed",
      },
      { status: 500 }
    );
  }
}
