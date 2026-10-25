"use client"

import Image from "next/image"
import { useState } from "react"

export type VideoCardItem = {
  id: string
  title: string
  format: "short" | "video"
  src?: string
  youtubeId?: string
  poster?: string
}

export function VideoPreviewCard({ video, active, onPlay, onClose }: {
  video: VideoCardItem
  active: boolean
  onPlay: () => void
  onClose: () => void
}) {
  const [failed, setFailed] = useState(false)
  const poster = video.poster || (video.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg` : undefined)
  return (
    <article className="group mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      <div className={`relative bg-black ${video.format === "short" ? "aspect-[9/16]" : "aspect-video"} ${active && video.youtubeId ? "min-h-[200px]" : ""}`}>
        {active ? video.youtubeId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0`}
            title={video.title}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video src={video.src} poster={video.poster} controls autoPlay playsInline preload="none"
            aria-label={video.title} className="absolute inset-0 h-full w-full object-contain"
            onError={() => setFailed(true)} />
        ) : (
          <button type="button" onClick={() => { setFailed(false); onPlay() }} aria-label={`Play ${video.title}`}
            className="absolute inset-0 block h-full w-full overflow-hidden text-left focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-brand">
            {poster ? <Image src={poster} alt="" fill sizes="(max-width: 639px) calc(100vw - 48px), (max-width: 1023px) 50vw, 380px" className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.02]" />
              : <span className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-900 to-black" />}
            <span className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition group-hover:bg-brand group-hover:text-white">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-medium leading-snug">{video.title}</h3>
          <p className="mt-1 text-xs text-white/45">{video.format === "short" ? "Portrait · 9:16" : "Landscape · 16:9"}</p>
        </div>
        {active && <button type="button" onClick={onClose} aria-label={`Close ${video.title}`} className="shrink-0 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand">Close</button>}
      </div>
      {failed && <p role="alert" className="px-4 pb-4 text-sm text-white/70">This video could not load. <a href={video.src} target="_blank" rel="noopener noreferrer" className="underline">Open video</a></p>}
    </article>
  )
}

export function StandaloneVideoCard({ video }: { video: VideoCardItem }) {
  const [active, setActive] = useState(false)
  return <VideoPreviewCard video={video} active={active} onPlay={() => setActive(true)} onClose={() => setActive(false)} />
}
