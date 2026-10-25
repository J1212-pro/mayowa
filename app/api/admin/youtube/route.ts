import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { YouTubeStorageError } from "@/lib/youtube-storage"
import { isDirectVideoUrl, isYouTubeId, parseYouTubeId, type YouTubeVideo } from "@/lib/youtube"
import { portfolioYouTubeVideos } from "@/lib/portfolio-youtube"
import { githubPublishUrl } from "@/lib/github-publish"
import { listYouTubeVideos, removeYouTubeVideo, saveYouTubeVideo } from "@/lib/youtube-videos"

function refreshPortfolio() {
  revalidatePath("/portfolio")
  revalidatePath("/admin")
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  const body = await req.json().catch(() => null)
  const source = body?.source === "file" ? "file" : "youtube"
  const url = typeof body?.url === "string" ? body.url.trim() : ""
  const id = source === "file" ? (isDirectVideoUrl(url) ? createHash("sha256").update(url).digest("hex").slice(0, 11) : null) : parseYouTubeId(url)
  let title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!id) return NextResponse.json({ error: source === "file" ? "Enter a public HTTPS link ending in .mp4 or .webm." : "Enter a valid YouTube video link." }, { status: 400 })
  if (title.length > 120 || ![undefined, "short", "video"].includes(body?.format)) {
    return NextResponse.json({ error: "Choose a video format and a title up to 120 characters." }, { status: 400 })
  }
  if (!title && source === "youtube") {
    try {
      const metadata = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { signal: AbortSignal.timeout(5000) })
      if (metadata.ok) {
        const details = await metadata.json()
        if (typeof details.title === "string") title = details.title.slice(0, 120)
      }
    } catch { /* An optional title lookup must not prevent publishing. */ }
  }
  title ||= source === "file" ? "Portfolio video" : "YouTube video"
  const video: YouTubeVideo = { id, title, addedAt: new Date().toISOString(), source, format: body?.format || (url.includes("/shorts/") ? "short" : "video"), ...(source === "file" ? { videoUrl: url } : {}) }
  try {
    const videos = [...portfolioYouTubeVideos, ...await listYouTubeVideos().catch(() => [])]
    if (videos.some((video) => video.id === id)) {
      return NextResponse.json({ error: "This YouTube video is already in your portfolio." }, { status: 409 })
    }
    await saveYouTubeVideo(video)
    refreshPortfolio()
    return NextResponse.json({ ok: true, video }, { status: 201 })
  } catch (err) {
    console.error("Could not save YouTube video:", err)
    return NextResponse.json({
      error: "Automatic publishing is unavailable. Continue on GitHub and choose Commit changes to publish this video. Your site updates after deployment finishes.",
      publishUrl: githubPublishUrl(video, process.env.GITHUB_REPO || "J1212-pro/mayowa", process.env.GITHUB_BRANCH || "master"),
      video,
    }, { status: 503 })
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!isYouTubeId(body?.id)) return NextResponse.json({ error: "Invalid YouTube video." }, { status: 400 })
  if (portfolioYouTubeVideos.some((video) => video.id === body.id)) {
    return NextResponse.json({ error: "This video is published with the website. Edit or delete its record on GitHub, then wait for the site to redeploy." }, { status: 409 })
  }
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
    return NextResponse.json({ error: err instanceof YouTubeStorageError ? err.message : "Could not remove the YouTube link. Please try again." }, { status: 503 })
  }
}
