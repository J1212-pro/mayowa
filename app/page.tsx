import Link from "next/link"
import { ShaderBackground } from "@/components/ui/shader-background"
import { HeroCharacter } from "@/components/hero-character"
import { HeroTitle } from "@/components/hero-title"
import { listVideos } from "@/lib/media"

export const dynamic = "force-dynamic"
import { waHref, PHONE, PHONE_DISPLAY } from "@/lib/contact"
import {
  Nav,
  Footer,
  WaFloat,
  CtaBand,
  VideoCard,
  WhatsAppIcon,
  PhoneIcon,
  CamIcon,
} from "@/components/site"

const services = [
  {
    icon: "video",
    title: "AI UGC Video",
    body: "Creator-style videos for TikTok, Reels, and ads — hooks scripted, talent generated, cuts delivered ready to post. New batches every week.",
  },
  {
    icon: "image",
    title: "AI Image Generation",
    body: "Product heroes, campaign visuals, and brand imagery in your exact style — no studio, no shipping samples, no reshoots. 4K files, ad-ready.",
  },
  {
    icon: "web",
    title: "Website Design",
    body: "Landing pages and full sites built to sell — mobile-first, fast to load, designed around the one action you want visitors to take.",
  },
]

const steps = [
  {
    n: "1",
    title: "Send the brief on WhatsApp",
    body: "Tell us the product, the audience, and the goal. A voice note works. We turn it into a creative plan the same day.",
  },
  {
    n: "2",
    title: "Review first drafts in 48h",
    body: "You get the first batch — videos, images, or page designs. Mark what you like, cut what you don't.",
  },
  {
    n: "3",
    title: "Ship and repeat weekly",
    body: "Approved work is delivered in every format you need, then the engine keeps running with fresh batches.",
  },
]

const stats = [
  { b: "30+", s: "ready-to-post creatives per brief" },
  { b: "48h", s: "from brief to first drafts" },
  { b: "24", s: "image variants per campaign set" },
  { b: "100%", s: "human-reviewed before shipping" },
]

function ServiceIcon({ kind }: { kind: string }) {
  if (kind === "video") return <CamIcon className="h-5 w-5" />
  if (kind === "image")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm4.5 5A1.5 1.5 0 1 0 8.5 11 1.5 1.5 0 0 0 8.5 8ZM5 19h14l-4.5-7-3.5 4.5-2-2.5L5 19Z" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm2 3v11h14V8H5Z" />
    </svg>
  )
}

export default function Home() {
  const videos = listVideos()
  const teaser = videos.slice(0, 3)
  return (
    <div className="flex-1">
      <Nav />

      {/* Hero with animated shader background */}
      <header className="relative overflow-hidden">
        <ShaderBackground />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black" />
        <div className="relative mx-auto grid max-w-6xl items-end gap-10 px-6 pt-16 md:min-h-[640px] md:grid-cols-[1.05fr_0.95fr]">
          <div className="pb-16 pt-6 md:pb-20">
            <span className="mb-5 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-neutral-950">
              AI UGC Studio
            </span>
            <HeroTitle />
            <p className="mt-6 max-w-md text-lg text-white/70">
              MAYOWA creates AI UGC videos, product imagery, and websites for brands that need to post every day —
              without shoots, creators, or studios.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={waHref("Hi Mayowa, I'm interested in AI content for my brand")}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(255,43,43,0.4)]"
              >
                <WhatsAppIcon />
                Message on WhatsApp
              </a>
              <a
                href={`tel:${PHONE}`}
                className="flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:border-white"
              >
                <PhoneIcon />
                {PHONE_DISPLAY}
              </a>
            </div>
            <p className="mt-5 text-sm text-white/50">First drafts in 48 hours. Reply usually within the hour.</p>
          </div>
          <div className="relative flex items-end justify-center pb-16 md:pb-20">
            <HeroCharacter />
          </div>
        </div>
      </header>

      {/* Services */}
      <section id="services" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-13 max-w-xl text-center">
            <span className="mb-5 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide">
              What We Do
            </span>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Content in every format your brand needs
            </h2>
            <p className="mt-4 text-white/60">
              AI does the volume, we do the taste. Everything is human-reviewed before it reaches you.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl bg-white p-7 text-neutral-950 transition hover:-translate-y-1.5"
              >
                <div
                  className={`mb-10 flex h-11 w-11 items-center justify-center rounded-xl text-white ${i === 1 ? "bg-brand" : "bg-neutral-950"}`}
                >
                  <ServiceIcon kind={s.icon} />
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio teaser */}
      <section id="portfolio" className="px-6 py-24 pt-0">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-13 max-w-xl text-center">
            <span className="mb-5 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide">
              AI UGC Portfolio
            </span>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Watch the work speak</h2>
            <p className="mt-4 text-white/60">
              Every video was made without a camera, a set, or a creator. Tap a video for sound.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {teaser.map((v) => (
              <VideoCard key={v.src} src={v.src} tag="AI UGC · 9:16" />
            ))}
            <Link
              href="/portfolio"
              className="flex aspect-[9/16] flex-col justify-between rounded-2xl bg-brand p-7 text-xl font-semibold leading-snug transition hover:-translate-y-1.5 hover:shadow-[0_14px_34px_rgba(255,43,43,0.35)]"
            >
              <span>
                View the full portfolio
                <small className="mt-2 block text-sm font-normal opacity-85">{videos.length} videos and counting</small>
              </span>
              <span className="self-end text-4xl leading-none">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-24 pt-0">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-13 max-w-xl text-center">
            <span className="mb-5 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide">
              How It Works
            </span>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">From brief to posted in three steps</h2>
            <p className="mt-4 text-white/60">
              You&apos;re only needed at the start and the sign-off. The engine handles the rest.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((st) => (
              <div key={st.n} className="flex min-h-52 flex-col rounded-2xl bg-white p-7 text-neutral-950">
                <span className="mb-auto font-display text-4xl text-brand">{st.n}</span>
                <h3 className="mt-5 font-semibold">{st.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600">{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((st, i) => (
            <div key={st.b} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <b className={`block text-3xl font-bold tracking-tight ${i % 2 === 0 ? "text-brand" : ""}`}>{st.b}</b>
              <span className="mt-1 block text-sm text-white/60">{st.s}</span>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Your competitors post every day. Now you can too."
        subtitle="Send one brief on WhatsApp and see first drafts in 48 hours. If you don't love them, you owe nothing."
      />

      <Footer />
      <WaFloat />
    </div>
  )
}
