import fs from "fs/promises"
import path from "path"
import { githubDeleteFile, githubPutFile, githubReadJsonFiles, useGithubStorage as githubStorageEnabled } from "@/lib/github"
import { isYouTubeId, isYouTubeVideo, type YouTubeVideo } from "@/lib/youtube"
import { createYouTubeStorage, type YouTubeBackend } from "@/lib/youtube-storage"

const PREFIX = "youtube/"
const REPO_DIR = "data/youtube-videos"
const localDir = () => path.join(process.cwd(), REPO_DIR)

async function listYouTubeBlobs(prefix = PREFIX) {
  const { list } = await import("@vercel/blob")
  const blobs: { pathname: string; url: string }[] = []
  let cursor: string | undefined
  do {
    const result = await list({ prefix, cursor, limit: 1000 })
    blobs.push(...result.blobs.filter((blob) => blob.pathname.endsWith(".json")))
    cursor = result.hasMore ? result.cursor : undefined
  } while (cursor)
  return blobs
}

function storage() {
  const backends: YouTubeBackend[] = []

  // A YouTube entry is a small JSON record, not an uploaded video. Prefer
  // the existing GitHub connection so a Blob upload failure cannot block it.
  if (githubStorageEnabled()) {
    backends.push({
      name: "GitHub",
      list: async () => (await githubReadJsonFiles(REPO_DIR)).filter(isYouTubeVideo),
      save: async (video) => {
        await githubPutFile(`${REPO_DIR}/${video.id}.json`, Buffer.from(JSON.stringify(video, null, 2)), `Add YouTube video: ${video.title}`)
      },
      remove: async (id) => {
        if (!(await githubDeleteFile(`${REPO_DIR}/${id}.json`, `Remove YouTube video: ${id}`))) {
          throw new Error("GitHub did not confirm removal of the YouTube link.")
        }
      },
    })
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    backends.push({
      name: "Vercel Blob",
      list: async () => {
        const blobs = await listYouTubeBlobs()
        const records: unknown[] = await Promise.all(blobs.map(async (blob) => {
          const res = await fetch(blob.url, { cache: "no-store" })
          if (!res.ok) throw new Error("Could not read the saved YouTube link.")
          return res.json()
        }))
        return records.filter(isYouTubeVideo)
      },
      save: async (video) => {
        const { put } = await import("@vercel/blob")
        await put(`${PREFIX}${video.id}.json`, JSON.stringify(video, null, 2), {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: true,
        })
      },
      remove: async (id) => {
        const { del } = await import("@vercel/blob")
        const blobs = await listYouTubeBlobs(`${PREFIX}${id}`)
        const urls = blobs.filter((blob) => blob.pathname === `${PREFIX}${id}.json`
          || (blob.pathname.startsWith(`${PREFIX}${id}-`) && blob.pathname.endsWith(".json")))
          .map((blob) => blob.url)
        if (urls.length) await del(urls)
      },
    })
  }

  if (!backends.length && !process.env.VERCEL) {
    backends.push({
      name: "Local files",
      list: async () => {
        let files: string[]
        try {
          files = await fs.readdir(localDir())
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
          throw error
        }
        const records: unknown[] = await Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => {
          return JSON.parse(await fs.readFile(path.join(localDir(), file), "utf8"))
        }))
        return records.filter(isYouTubeVideo)
      },
      save: async (video) => {
        await fs.mkdir(localDir(), { recursive: true })
        await fs.writeFile(path.join(localDir(), `${video.id}.json`), JSON.stringify(video, null, 2), { flag: "wx" })
      },
      remove: async (id) => { await fs.unlink(path.join(localDir(), `${id}.json`)) },
    })
  }

  return createYouTubeStorage(backends, (backend, operation, error) => {
    console.error(`YouTube ${operation} failed (${backend}):`, error)
  })
}

export async function listYouTubeVideos(): Promise<YouTubeVideo[]> {
  return storage().list()
}

export async function saveYouTubeVideo(video: YouTubeVideo): Promise<void> {
  if (!isYouTubeVideo(video)) throw new Error("Invalid YouTube video.")
  await storage().save(video)
}

export async function removeYouTubeVideo(id: string): Promise<void> {
  if (!isYouTubeId(id)) throw new Error("Invalid YouTube video.")
  await storage().remove(id)
}
