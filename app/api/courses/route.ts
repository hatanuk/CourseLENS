import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { insertCourse, getCourseByName } from "@/app/db/queries";
import { getSessionId } from "@/app/lib/sessionHandler";
import { Course } from "@/app/data/structures";

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body as { name?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
  }
  const sessionId = await getSessionId();
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "no session id" }, { status: 400 });
  }
  const trimmed = name.trim();
  if (getCourseByName(sessionId, trimmed)) {
    return NextResponse.json({ ok: false, error: "A course with this name already exists" }, { status: 409 });
  }
  const id = randomUUID();
  const course: Course = { id, name: trimmed, sessionId };
  insertCourse(course);
  return NextResponse.json({ ok: true, course });
}
