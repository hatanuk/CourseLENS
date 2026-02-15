import { cookies } from "next/headers"
import crypto from "crypto"

export async function getSessionId(): Promise<string | undefined>{ 
  const store = await cookies()
  return store.get("sid")?.value

}
