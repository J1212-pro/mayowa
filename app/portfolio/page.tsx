import { Nav, Footer, WaFloat, CtaBand } from "@/components/site"
import { VideoGrid } from "@/components/video-grid"
import { ImageGallery } from "@/components/image-gallery"
import { listVideos, loadProducts } from "@/lib/media"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Portfolio — MAYOWA AI UGC Studio",
  description:
    "AI UGC videos and AI-generated product imagery by MAYOWA — no cameras, no sets, no creators. Watch the work.",
}

export default function PortfolioPage() {
  const products = loadProducts()
  const videos = listVideos()

  return (
    <div className="flex-1">
      <Nav active="portfolio" />

      <header className="px-6 pt-20 text-center">
        <span className="mb-5 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide">
          AI UGC Portfolio
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Watch the work speak</h1>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Every video below was made without a camera, a set, or a creator. Press play — sound on recommended.
        </p>
      </header>

      <section className="px-6 py-20">
        <VideoGrid videos={videos} />
      </section>

      {/* AI Image Generation — contrasting white section */}
      <section id="images" className="bg-white px-6 py-24 text-neutral-950">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <span className="mb-5 inline-block rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-semibold tracking-wide text-white">
              AI Image Generation
            </span>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Products shot without a studio</h2>
            <p className="mt-4 text-neutral-600">
              Every image was generated — no photographer, no samples shipped, no reshoots. Tap a product to see its
              full set.
            </p>
          </div>
          <ImageGallery products={products} onLight />
        </div>
      </section>

      <CtaBand
        title="One brief. A month of content."
        subtitle="Send your product and your goal on WhatsApp — a voice note works — and see first drafts in 48 hours."
      />

      <Footer />
      <WaFloat />
    </div>
  )
}
