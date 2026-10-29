import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"
import { hasGithub, githubCommitPhotos, githubStagePhoto } from "@/lib/github"
import { isPhotoPath, MAX_PHOTO_BYTES, MAX_PHOTOS, photoExtension, photoType, portfolioName } from "@/lib/portfolio-images"
import { photoTicket, verifyPhotoTicket, type StagedPhoto } from "@/lib/portfolio-photo-ticket"

export const maxDuration = 60

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  if (!hasGithub()) return NextResponse.json({ error: "Connect GitHub publishing in your hosting settings first. Add GITHUB_TOKEN with Contents read and write access to your repository." }, { status: 503 })
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData()
      const folder = portfolioName(form.get("name"))
      const file = form.get("file")
      if (!(file instanceof File) || !file.size || file.size > MAX_PHOTO_BYTES || !isPhotoPath(file.name) || /[/\\]/.test(file.name) || file.name.length > 100) {
        return NextResponse.json({ error: "Choose a supported photo under 3 MB." }, { status: 400 })
      }
      const bytes = Buffer.from(await file.arrayBuffer())
      const type = photoType(bytes)
      const extension = photoExtension(file.name)
      if (!type || type !== (extension === "jpg" ? "jpeg" : extension)) return NextResponse.json({ error: "The photo content does not match its file type." }, { status: 400 })
      const sha = await githubStagePhoto(bytes)
      return NextResponse.json({ name: file.name, sha, ticket: photoTicket(folder, file.name, sha) })
    }

    const body = await request.json()
    const folder = portfolioName(body?.name)
    const photos: StagedPhoto[] = body?.photos
    if (!Array.isArray(photos) || !photos.length || photos.length > MAX_PHOTOS || new Set(photos.map((photo) => photo?.name)).size !== photos.length) {
      return NextResponse.json({ error: "Publish between 1 and 100 distinct photos." }, { status: 400 })
    }
    for (const photo of photos) {
      if (!photo || typeof photo.name !== "string" || photo.name.length > 100 || /[/\\]/.test(photo.name) || !isPhotoPath(photo.name) || !/^[a-f0-9]{40}$/.test(photo.sha) || !verifyPhotoTicket(folder, photo)) {
        return NextResponse.json({ error: "An upload receipt expired or is invalid. Select the photos again and retry." }, { status: 400 })
      }
    }
    const commit = await githubCommitPhotos(photos.map((photo) => ({ path: `public/images/${folder}/${photo.name}`, sha: photo.sha })), `Publish photo portfolio: ${folder} (${photos.length} photos)`)
    return NextResponse.json({ ok: true, count: photos.length, name: folder, commit })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not publish this portfolio. Try again."
    return NextResponse.json({ error: message }, { status: message.startsWith("Use a portfolio") || message.startsWith("Enter a portfolio") || error instanceof SyntaxError ? 400 : 502 })
  }
}
