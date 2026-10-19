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
  const failures: string[] = []
  const recordFailure: FailureReporter = (backend, operation, error) => {
    report(backend, operation, error)
    // The API only exposes these diagnostics to a signed-in admin. Strip
    // credential-shaped strings and URLs before returning provider messages.
    const message = (error instanceof Error ? error.message : "Unknown connection error")
      .replace(/(?:github_pat_|gh[pousr]_|vercel_blob_rw_)[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(/https?:\/\/\S+/g, "[service URL]")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 240)
    failures.push(`${backend}: ${message}`)
  }
  const unavailable = () => new YouTubeStorageError(
    backends.length
      ? `Your link could not be published. ${failures.join(" ")}`
      : "Connect GitHub or Vercel Blob in your hosting settings to publish YouTube links from admin.",
  )

  const readSources = async () => Promise.all(backends.map(async (backend) => {
    try {
      return { backend, videos: await backend.list(), available: true }
    } catch (error) {
      recordFailure(backend.name, "read", error)
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
          recordFailure(backend.name, "save", error)
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
