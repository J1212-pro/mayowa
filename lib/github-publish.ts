import type { YouTubeVideo } from "./youtube"

export function githubPublishUrl(video: YouTubeVideo, repo: string, branch: string): string {
  const url = new URL(`https://github.com/${repo.split("/").map(encodeURIComponent).join("/")}/new/${encodeURIComponent(branch)}`)
  url.searchParams.set("filename", `data/youtube-videos/${video.id}.json`)
  url.searchParams.set("value", JSON.stringify(video, null, 2) + "\n")
  return url.toString()
}

export function githubEditVideoUrl(id: string, repo: string, branch: string): string {
  return `https://github.com/${repo.split("/").map(encodeURIComponent).join("/")}/edit/${encodeURIComponent(branch)}/data/youtube-videos/${encodeURIComponent(id)}.json`
}
