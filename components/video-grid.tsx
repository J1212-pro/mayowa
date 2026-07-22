"use client"

import { useRef, useState } from "react"
import { waHref } from "@/components/site"
import type { Video } from "@/lib/media"

function PlayerCard({ src, tag }: { src: string; tag: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      document.querySelectorAll<HTMLVideoElement>(".pf-video").forEach((o) => {
        if (o !== v) o.pause()
      })
      v.play()
    } else {
      v.pause()
    }
  }

  return (
    <div
      onClick={toggle}
      className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-neutral-900"
    >
      <video
        ref={ref}
        src={src}
        preload="metadata"
        playsInline
        className="pf-video h-full w-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-sm">
        {tag}
      </span>
      {!playing && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur-md transition group-hover:scale-110 group-hover:bg-brand">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
    </div>
  )
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 md:grid-cols-3">
      {videos.map((v) => (
        <PlayerCard key={v.src} src={v.src} tag={v.tag} />
      ))}
      <a
        href={waHref("Hi Mayowa, I want videos like the ones in your portfolio")}
        target="_blank"
        rel="noopener"
        className="flex aspect-[9/16] flex-col justify-between rounded-2xl bg-brand p-7 text-xl font-semibold leading-snug transition hover:-translate-y-1.5 hover:shadow-[0_14px_34px_rgba(255,43,43,0.35)]"
      >
        <span>
          Want videos like these for your brand?
          <small className="mt-2 block text-sm font-normal opacity-85">First drafts in 48 hours.</small>
        </span>
        <span className="self-end text-4xl leading-none">→</span>
      </a>
    </div>
  )
}
