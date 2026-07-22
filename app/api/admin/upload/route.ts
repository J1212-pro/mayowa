import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"
import { safeName, resolveInside, videosDir, imagesDir, VIDEO_EXTS, IMAGE_EXTS } from "@/lib/media"

const MAX_VIDEO_BYTES = 300 * 1024 * 1024 // 300 MB
const MAX_IMAGE_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const form = await req.formData()
  const kind = form.get("kind")
  const files = form.getAll("files").filter((f): f is File => f instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: "No files received." }, { status: 400 })
  }

  let targetDir: string
  let allowed: Set<string>
  let maxBytes: number

  if (kind === "video") {
    targetDir = videosDir()
    allowed = VIDEO_EXTS
    maxBytes = MAX_VIDEO_BYTES
  } else if (kind === "image") {
    const product = safeName(String(form.get("product") || ""), 60)
    if (!product) {
      return NextResponse.json({ error: "Product name is required for images." }, { status: 400 })
    }
    const dir = resolveInside(imagesDir(), product)
    if (!dir) {
      return NextResponse.json({ error: "Invalid product name." }, { status: 400 })
    }
    fs.mkdirSync(dir, { recursive: true })
    targetDir = dir
    allowed = IMAGE_EXTS
    maxBytes = MAX_IMAGE_BYTES
  } else {
    return NextResponse.json({ error: "Unknown upload kind." }, { status: 400 })
  }

  const saved: string[] = []
  const rejected: string[] = []

  for (const file of files) {
    const name = safeName(file.name)
    const ext = path.extname(name).toLowerCase()
    if (!name || !allowed.has(ext)) {
      rejected.push(`${file.name} (type not allowed)`)
      continue
    }
    if (file.size > maxBytes) {
      rejected.push(`${file.name} (too large)`)
      continue
    }
    const target = resolveInside(targetDir, name)
    if (!target) {
      rejected.push(`${file.name} (invalid name)`)
      continue
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(target, bytes)
    saved.push(name)
  }

  return NextResponse.json({ ok: true, saved, rejected })
}
