import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

const figuresDir = path.join(process.cwd(), "app", "data", "figures");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const dir = path.join(figuresDir, docId);
  try {
    const files = await readdir(dir);
    const figures = files
      .filter((f) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
      .map((f) => `/api/figures/${docId}/${f}`);
    return NextResponse.json({ figures });
  } catch {
    return NextResponse.json({ figures: [] });
  }
}
