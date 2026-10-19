"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { parseYouTubeId, youtubeWatchUrl, type YouTubeVideo } from "@/lib/youtube"

export function YouTubeAdmin({ videos }: { videos: YouTubeVideo[] }) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState(false)

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage("")
    setError(false)
    if (!parseYouTubeId(url)) {
      setError(true)
      setMessage("Paste a valid YouTube video link, such as youtube.com/watch?v=… or youtu.be/…")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not save the video. Please try again.")
      setUrl("")
      setTitle("")
      setMessage("Video added. It is now in your portfolio.")
      router.refresh()
    } catch (err) {
      setError(true)
      setMessage(err instanceof Error ? err.message : "Could not save the video.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (video: YouTubeVideo) => {
    if (!confirm(`Remove "${video.title}" from your portfolio? The video will stay on YouTube.`)) return
    setBusy(true)
    setMessage("")
    setError(false)
    try {
      const res = await fetch("/api/admin/youtube", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: video.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not remove the video. Please try again.")
      setMessage("Video removed from your portfolio.")
      router.refresh()
    } catch (err) {
      setError(true)
      setMessage(err instanceof Error ? err.message : "Could not remove the video.")
    } finally {
      setBusy(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"

  return (
    <section className="rounded-3xl bg-white p-6 text-neutral-950 sm:p-8">
      <h2 className="text-lg font-semibold">YouTube videos</h2>
      <p className="mt-1 text-sm text-neutral-500">Add a link and a title to show a long video in your portfolio automatically.</p>
      <form onSubmit={save} className="mt-5 space-y-4">
        <div>
          <label htmlFor="youtube-url" className="mb-1.5 block text-sm font-medium">YouTube video link</label>
          <input id="youtube-url" name="url" type="text" inputMode="url" autoComplete="off" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" maxLength={2048} required disabled={busy} aria-describedby="youtube-help" className={inputClass} />
          <p id="youtube-help" className="mt-2 text-xs text-neutral-500">Use a public or unlisted video with embedding enabled on YouTube.</p>
        </div>
        <div>
          <label htmlFor="youtube-title" className="mb-1.5 block text-sm font-medium">Portfolio title</label>
          <input id="youtube-title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A brand story, brought to life" maxLength={120} required disabled={busy} className={inputClass} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Working…" : "Add to portfolio"}</button>
          <a href="/portfolio#youtube-videos" target="_blank" rel="noopener" className="text-sm text-neutral-600 underline hover:text-neutral-950">View portfolio ↗</a>
        </div>
      </form>
      {message && <p role={error ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}>{message}</p>}
      <ul className="mt-5 divide-y divide-neutral-200 border-t border-neutral-200">
        {videos.map((video) => (
          <li key={video.id} className="flex items-center justify-between gap-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="break-words font-medium">{video.title}</p>
              <a href={youtubeWatchUrl(video.id)} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-neutral-500 underline">{youtubeWatchUrl(video.id)}</a>
            </div>
            <button type="button" onClick={() => remove(video)} disabled={busy} aria-label={`Remove ${video.title}`} className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60">Remove</button>
          </li>
        ))}
        {!videos.length && <li className="py-3 text-sm text-neutral-400">No YouTube videos yet. Add your first link above.</li>}
      </ul>
    </section>
  )
}
