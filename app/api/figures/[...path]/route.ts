import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const figuresDir = path.join(process.cwd(), "app", "data", "figures");

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  if (!pathSegments?.length || pathSegments.length < 2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const docId = pathSegments[0];
  const filename = pathSegments[pathSegments.length - 1];
  if (!/^[a-f0-9-]+$/i.test(docId) || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const filepath = path.join(figuresDir, docId, filename);
  const resolved = path.resolve(filepath);
  if (!resolved.startsWith(path.resolve(figuresDir))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const ext = path.extname(filename).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  try {
    const buf = await readFile(filepath);
    return new Response(buf, {
      headers: { "Content-Type": mime, "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
