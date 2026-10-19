import fs from "fs/promises"
import path from "path"
import { githubDeleteFile, githubPutFile, githubReadJsonFiles, useGithubStorage as githubStorageEnabled } from "@/lib/github"
import { isYouTubeId, isYouTubeVideo, type YouTubeVideo } from "@/lib/youtube"

const PREFIX = "youtube/"
const REPO_DIR = "data/youtube-videos"
const localDir = () => path.join(process.cwd(), REPO_DIR)
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN

// Each video has its own record, so adding one cannot overwrite another.
async function storedRecords(): Promise<unknown[]> {
  if (blobEnabled()) {
    const { list } = await import("@vercel/blob")
    const urls: string[] = []
    let cursor: string | undefined
    do {
      const result = await list({ prefix: PREFIX, cursor, limit: 1000 })
      urls.push(...result.blobs.filter((b) => b.pathname.endsWith(".json")).map((b) => b.url))
      cursor = result.hasMore ? result.cursor : undefined
    } while (cursor)
    return Promise.all(urls.map(async (url) => {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error("Could not load YouTube videos. Please try again.")
      return res.json()
    }))
  }

  // Read from GitHub directly so edits appear without waiting for a redeploy.
  if (githubStorageEnabled()) return githubReadJsonFiles(REPO_DIR)

  let files: string[]
  try {
    files = await fs.readdir(localDir())
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
  return Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => {
    return JSON.parse(await fs.readFile(path.join(localDir(), file), "utf8"))
  }))
}

export async function listYouTubeVideos(): Promise<YouTubeVideo[]> {
  const records = await storedRecords()
  return records.filter(isYouTubeVideo).sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}

export async function saveYouTubeVideo(video: YouTubeVideo): Promise<void> {
  if (!isYouTubeVideo(video)) throw new Error("Invalid YouTube video.")
  const json = JSON.stringify(video, null, 2)
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob")
    await put(`${PREFIX}${video.id}.json`, json, {
      access: "public",
      contentType: "application/json",
      // A new URL also avoids stale CDN content when a removed video is re-added.
      addRandomSuffix: true,
    })
  } else if (githubStorageEnabled()) {
    await githubPutFile(`${REPO_DIR}/${video.id}.json`, Buffer.from(json), `Add YouTube video: ${video.title}`)
  } else {
    if (process.env.VERCEL) throw new Error("Configure Vercel Blob or GitHub storage to save YouTube videos.")
    await fs.mkdir(localDir(), { recursive: true })
    await fs.writeFile(path.join(localDir(), `${video.id}.json`), json, { flag: "wx" })
  }
}

export async function removeYouTubeVideo(id: string): Promise<void> {
  if (!isYouTubeId(id)) throw new Error("Invalid YouTube video.")
  if (blobEnabled()) {
    const { list, del } = await import("@vercel/blob")
    const urls: string[] = []
    let cursor: string | undefined
    do {
      const result = await list({ prefix: `${PREFIX}${id}`, cursor, limit: 1000 })
      // Match both random-suffix records and earlier fixed-path records.
      urls.push(...result.blobs.filter((b) =>
        b.pathname === `${PREFIX}${id}.json` || (b.pathname.startsWith(`${PREFIX}${id}-`) && b.pathname.endsWith(".json")),
      ).map((b) => b.url))
      cursor = result.hasMore ? result.cursor : undefined
    } while (cursor)
    if (urls.length) await del(urls)
  } else if (githubStorageEnabled()) {
    if (!(await githubDeleteFile(`${REPO_DIR}/${id}.json`, `Remove YouTube video: ${id}`))) {
      throw new Error("Could not remove the video from GitHub. Please try again.")
    }
  } else {
    if (process.env.VERCEL) throw new Error("Configure Vercel Blob or GitHub storage to remove YouTube videos.")
    await fs.unlink(path.join(localDir(), `${id}.json`))
  }
}
