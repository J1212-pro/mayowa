"use client"

import { useState } from "react"
import { waHref } from "@/lib/contact"
import type { Video } from "@/lib/media"
import type { YouTubeVideo } from "@/lib/youtube"
import { VideoPreviewCard, type VideoCardItem } from "@/components/video-card"

export function VideoGrid({ videos, youtubeVideos = [] }: { videos: Video[]; youtubeVideos?: YouTubeVideo[] }) {
  const [active, setActive] = useState<string | null>(null)
  const items: VideoCardItem[] = [
    ...youtubeVideos.map((video) => ({
      id: `link-${video.id}`, title: video.title, format: video.format || "video" as const,
      ...(video.source === "file" ? { src: video.videoUrl } : { youtubeId: video.id }),
    })),
    ...videos.map((video) => ({ id: video.src, title: video.tag, src: video.src, poster: video.poster, format: video.format || "short" as const })),
  ]
  return (
    <div className="mx-auto max-w-6xl">
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {items.map((video) => <VideoPreviewCard key={video.id} video={video} active={active === video.id} onPlay={() => setActive(video.id)} onClose={() => setActive(null)} />)}
      </div>
      <a href={waHref("Hi Mayowa, I want videos like the ones in your portfolio")} target="_blank" rel="noopener"
        className="mt-3 flex items-center justify-between gap-6 rounded-2xl bg-brand px-6 py-7 font-semibold transition hover:bg-red-600">
        <span>Want videos like these for your brand?<small className="mt-1 block text-sm font-normal opacity-85">First drafts in 48 hours.</small></span>
        <span aria-hidden="true" className="text-3xl">→</span>
      </a>
    </div>
  )
}
