import { NextResponse } from "next/server"
import { ADMIN_COOKIE, makeToken, passwordMatches } from "@/lib/admin"

// Best-effort in-memory rate limit: 8 attempts per 15 minutes per IP.
const attempts = new Map<string, { n: number; t: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 8

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin is not configured on this server." }, { status: 500 })
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const entry = attempts.get(ip) ?? { n: 0, t: Date.now() }
  if (Date.now() - entry.t > WINDOW_MS) {
    entry.n = 0
    entry.t = Date.now()
  }
  if (entry.n >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  if (!passwordMatches(body?.password)) {
    entry.n++
    attempts.set(ip, entry)
    return NextResponse.json({ error: "Wrong password." }, { status: 401 })
  }

  attempts.delete(ip)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  })
  return res
}
