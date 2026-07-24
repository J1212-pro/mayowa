import fs from "fs"
import path from "path"
import { createHash } from "crypto"

export type Subscriber = { name: string; email: string; date: string }

// Local fallback store (dev / self-hosted). Gitignored.
const LOCAL_FILE = path.join(process.cwd(), ".data", "newsletter.json")

function hasBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// Unguessable blob path so the subscriber list can't be fetched by guessing.
function blobPath(): string {
  const key = createHash("sha256")
    .update(`mayowa-newsletter:${process.env.ADMIN_PASSWORD || ""}`)
    .digest("hex")
    .slice(0, 32)
  return `newsletter/subscribers-${key}.json`
}

export async function listSubscribers(): Promise<Subscriber[]> {
  if (hasBlob()) {
    try {
      const { head } = await import("@vercel/blob")
      const meta = await head(blobPath())
      const res = await fetch(meta.url, { cache: "no-store" })
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }
  try {
    const data = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function addSubscriber(name: string, email: string): Promise<{ added: boolean; total: number }> {
  const subs = await listSubscribers()
  const normalized = email.trim().toLowerCase()
  if (subs.some((s) => s.email === normalized)) {
    return { added: false, total: subs.length }
  }
  subs.push({ name: name.trim().slice(0, 80), email: normalized, date: new Date().toISOString() })

  if (hasBlob()) {
    const { put } = await import("@vercel/blob")
    await put(blobPath(), JSON.stringify(subs, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    })
  } else {
    try {
      fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true })
      fs.writeFileSync(LOCAL_FILE, JSON.stringify(subs, null, 2))
    } catch {
      // Read-only host without Blob configured — the email notification in
      // the API route still delivers the signup to the inbox.
    }
  }
  return { added: true, total: subs.length }
}

/** Excel-friendly CSV (BOM so Excel opens UTF-8 correctly). */
export function subscribersCsv(subs: Subscriber[]): string {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const rows = [
    ["Name", "Email", "Signed up"],
    ...subs.map((s) => [s.name, s.email, s.date]),
  ]
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n")
}
