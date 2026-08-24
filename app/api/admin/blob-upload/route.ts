import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { isAdmin } from "@/lib/admin"

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
        const isVideo = pathname.startsWith("portfolio/")
        const isImage = pathname.startsWith("images/")
        if (!isVideo && !isImage) {
          throw new Error("Invalid upload destination.")
        }
        return {
          allowedContentTypes: isVideo ? ["video/*"] : ["image/*"],
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
