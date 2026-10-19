import { youtubeWatchUrl, type YouTubeVideo } from "@/lib/youtube"

export function YouTubeGallery({ videos }: { videos: YouTubeVideo[] }) {
  if (!videos.length) return null

  return (
    <section id="youtube-videos" aria-labelledby="youtube-heading" className="scroll-mt-24 px-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 id="youtube-heading" className="text-3xl font-semibold tracking-tight">Long-form videos</h2>
          <p className="mt-3 text-white/60">Watch the full stories, right here.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {videos.map((video) => (
            <article key={video.id} className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                title={video.title}
                className="aspect-video w-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <h3 className="min-w-0 break-words text-lg font-semibold">{video.title}</h3>
                <a href={youtubeWatchUrl(video.id)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-white/60 underline underline-offset-4 hover:text-white">
                  Watch on YouTube ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
