export type YouTubeVideo = {
  id: string
  title: string
  addedAt: string
}

export function isYouTubeId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value)
}

/** Accept video links only; never use an arbitrary submitted URL in an iframe. */
export function parseYouTubeId(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 2048) return null
  const text = input.trim()
  if (!text) return null
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null
    const host = url.hostname.toLowerCase()
    const parts = url.pathname.split("/").filter(Boolean)
    let id: string | null = null
    if (["youtu.be", "www.youtu.be"].includes(host) && parts.length === 1) {
      id = parts[0]
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v")
      else if (parts.length === 2 && ["embed", "shorts", "live"].includes(parts[0])) id = parts[1]
    } else if (["youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
      if (parts.length === 2 && parts[0] === "embed") id = parts[1]
    }
    return isYouTubeId(id) ? id : null
  } catch {
    return null
  }
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

export function isYouTubeVideo(value: unknown): value is YouTubeVideo {
  if (!value || typeof value !== "object") return false
  const video = value as YouTubeVideo
  return isYouTubeId(video.id)
    && typeof video.title === "string" && !!video.title.trim() && video.title.length <= 120
    && typeof video.addedAt === "string" && Number.isFinite(Date.parse(video.addedAt))
}
