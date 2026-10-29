import { createHmac, timingSafeEqual } from "node:crypto"

export type StagedPhoto = { name: string; sha: string; ticket: string }

export function photoTicket(folder: string, name: string, sha: string, expires = Date.now() + 60 * 60 * 1000): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error("Admin publishing is not configured.")
  const signature = createHmac("sha256", secret).update(JSON.stringify([folder, name, sha, expires])).digest("hex")
  return `${expires}.${signature}`
}

export function verifyPhotoTicket(folder: string, photo: StagedPhoto): boolean {
  if (typeof photo.ticket !== "string") return false
  const [expiry, signature] = photo.ticket.split(".")
  const expires = Number(expiry)
  if (!Number.isFinite(expires) || expires < Date.now() || expires > Date.now() + 60 * 60 * 1000) return false
  try {
    const expected = photoTicket(folder, photo.name, photo.sha, expires).split(".")[1]
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ""))
  } catch { return false }
}
