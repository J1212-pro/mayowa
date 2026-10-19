import type { YouTubeVideo } from "./youtube"

export type YouTubeBackend = {
  name: string
  list: () => Promise<YouTubeVideo[]>
  save: (video: YouTubeVideo) => Promise<void>
  remove: (id: string) => Promise<void>
}

export class YouTubeStorageError extends Error {}

type FailureReporter = (backend: string, operation: string, error: unknown) => void

/** Ordered backends: prefer GitHub for link metadata, with Blob as a fallback. */
export function createYouTubeStorage(backends: YouTubeBackend[], report: FailureReporter) {
  const unavailable = () => new YouTubeStorageError(
    backends.length
      ? "Your link could not be published because the website's save connections are unavailable. Please try again shortly."
      : "Connect GitHub or Vercel Blob in your hosting settings to publish YouTube links from admin.",
  )

  const readSources = async () => Promise.all(backends.map(async (backend) => {
    try {
      return { backend, videos: await backend.list(), available: true }
    } catch (error) {
      report(backend.name, "read", error)
      return { backend, videos: [] as YouTubeVideo[], available: false }
    }
  }))

  return {
    async list(): Promise<YouTubeVideo[]> {
      const sources = await readSources()
      if (!sources.some((source) => source.available)) throw unavailable()
      const videos = new Map<string, YouTubeVideo>()
      for (const source of sources) {
        for (const video of source.videos) {
          if (!videos.has(video.id)) videos.set(video.id, video)
        }
      }
      return [...videos.values()].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    },

    async save(video: YouTubeVideo): Promise<void> {
      for (const backend of backends) {
        try {
          await backend.save(video)
          return
        } catch (error) {
          report(backend.name, "save", error)
        }
      }
      throw unavailable()
    },

    async remove(id: string): Promise<void> {
      const sources = await readSources()
      // Verify every source before deleting: an unreachable copy must not
      // silently reappear later after reporting a successful removal.
      if (!sources.length || sources.some((source) => !source.available)) {
        throw new YouTubeStorageError("Could not check all saved copies of this link. Please try removing it again shortly.")
      }
      for (const source of sources) {
        if (!source.videos.some((video) => video.id === id)) continue
        try {
          await source.backend.remove(id)
        } catch (error) {
          report(source.backend.name, "remove", error)
          throw new YouTubeStorageError("The link could not be fully removed. Please try again shortly.")
        }
      }
    },
  }
}
