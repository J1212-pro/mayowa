import { createHmac, createHash, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "mayowa_admin"
const SESSION_HOURS = 12

function secret(): string {
  return process.env.ADMIN_PASSWORD || ""
}

export function makeToken(): string {
  const ts = Date.now().toString()
  const sig = createHmac("sha256", secret()).update(ts).digest("hex")
  return `${ts}.${sig}`
}

export function verifyToken(token: string | undefined): boolean {
  if (!token || !secret()) return false
  const [ts, sig] = token.split(".")
  if (!ts || !sig) return false
  if (Date.now() - Number(ts) > SESSION_HOURS * 60 * 60 * 1000) return false
  const expected = createHmac("sha256", secret()).update(ts).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return verifyToken(store.get(ADMIN_COOKIE)?.value)
}

/** Constant-time password check (hashes both sides so lengths never leak). */
export function passwordMatches(candidate: unknown): boolean {
  const real = secret()
  if (!real || typeof candidate !== "string") return false
  const a = createHash("sha256").update(candidate).digest()
  const b = createHash("sha256").update(real).digest()
  return timingSafeEqual(a, b)
}
