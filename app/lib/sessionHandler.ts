import { cookies } from "next/headers"
import crypto from "crypto"

export async function getOrCreateSessionId() {
  const store = await cookies()
  let sessionId = store.get("sid")?.value

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    store.set("sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
  }

  return sessionId
}

export async function getSessionId() {
  const store = await cookies()
  return store.get("sid")?.value

}
