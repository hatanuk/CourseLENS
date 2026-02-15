import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
    const res = NextResponse.next()

    let sid = req.cookies.get("sid")?.value

    if (!sid) {
        sid = crypto.randomUUID()

        res.cookies.set("sid", sid, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
        })
    }

    return res
}
