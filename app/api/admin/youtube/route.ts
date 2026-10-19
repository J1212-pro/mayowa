import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { isYouTubeId, parseYouTubeId } from "@/lib/youtube"
import { listYouTubeVideos, removeYouTubeVideo, saveYouTubeVideo } from "@/lib/youtube-videos"

function refreshPortfolio() {
  revalidatePath("/portfolio")
  revalidatePath("/admin")
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  const body = await req.json().catch(() => null)
  const id = parseYouTubeId(body?.url)
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!id) return NextResponse.json({ error: "Enter a valid YouTube video link." }, { status: 400 })
  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Enter a portfolio title (up to 120 characters)." }, { status: 400 })
  }
  try {
    const videos = await listYouTubeVideos()
    if (videos.some((video) => video.id === id)) {
      return NextResponse.json({ error: "This YouTube video is already in your portfolio." }, { status: 409 })
    }
    const video = { id, title, addedAt: new Date().toISOString() }
    await saveYouTubeVideo(video)
    refreshPortfolio()
    return NextResponse.json({ ok: true, video }, { status: 201 })
  } catch (err) {
    console.error("Could not save YouTube video:", err)
    return NextResponse.json({ error: "Could not save the video. Check your storage connection and try again." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!isYouTubeId(body?.id)) return NextResponse.json({ error: "Invalid YouTube video." }, { status: 400 })
  try {
    const videos = await listYouTubeVideos()
    if (!videos.some((video) => video.id === body.id)) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 })
    }
    await removeYouTubeVideo(body.id)
    refreshPortfolio()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Could not remove YouTube video:", err)
    return NextResponse.json({ error: "Could not remove the video. Check your storage connection and try again." }, { status: 500 })
  }
}
