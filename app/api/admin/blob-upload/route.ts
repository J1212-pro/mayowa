import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import path from "path"
import { isAdmin } from "@/lib/admin"
import { safeName, VIDEO_EXTS, IMAGE_EXTS } from "@/lib/media"

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]

const MAX_VIDEO_BYTES = 300 * 1024 * 1024 // 300 MB
const MAX_IMAGE_BYTES = 25 * 1024 * 1024 // 25 MB

// Authorizes direct browser -> Vercel Blob uploads from the admin panel.
// The file bytes never pass through this function, so Vercel's request-size
// limit doesn't apply — videos up to 300 MB upload straight from the browser.
export async function POST(request: Request) {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdmin())) {
          throw new Error("Not signed in.")
        }
        // Only portfolio/<file> or images/<product>/<file>, with safe names and
        // media extensions, so uploads can't overwrite blog posts, the
        // subscriber list, or anything else in the store.
        const parts = pathname.split("/")
        const isVideo = parts.length === 2 && parts[0] === "portfolio"
        const isImage = parts.length === 3 && parts[0] === "images"
        const segmentsOk = parts.slice(1).every((s) => s !== "" && safeName(s) === s)
        const ext = path.extname(parts[parts.length - 1] || "").toLowerCase()
        const extOk = isVideo ? VIDEO_EXTS.has(ext) : IMAGE_EXTS.has(ext)
        if ((!isVideo && !isImage) || !segmentsOk || !extOk) {
          throw new Error("Invalid upload destination.")
        }
        return {
          // Explicit types only (no SVG, which can carry scripts).
          allowedContentTypes: isVideo ? VIDEO_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
        }
      },
      onUploadCompleted: async () => {
        // Media is listed live from the blob store — nothing to record here.
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload authorization failed." },
      { status: 400 },
    )
  }
}
