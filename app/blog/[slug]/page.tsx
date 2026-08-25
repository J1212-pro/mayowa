import Link from "next/link"
import { notFound } from "next/navigation"
import { Nav, Footer, WaFloat, TikTokIcon, InstagramIcon } from "@/components/site"
import { TIKTOK, TIKTOK_HANDLE, INSTAGRAM, INSTAGRAM_HANDLE, EMAIL } from "@/lib/contact"
import { getPost } from "@/lib/blog"
import { SITE_URL } from "@/lib/site"

// Cached for speed; refreshed automatically when a post is published (and every 5 min).
export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Post not found" }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <div className="flex-1">
      <Nav />

      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/blog" className="text-sm text-white/50 hover:text-white">
          ← All posts
        </Link>
        <time className="mt-8 block text-xs text-white/40">{formatDate(post.date)}</time>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{post.title}</h1>

        <div
          className="prose-mayowa mt-8 space-y-5 leading-relaxed text-white/80 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* CTA */}
        <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h2 className="text-xl font-semibold">Want content like this working for your brand?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            MAYOWA makes AI UGC videos, product imagery, and websites. First drafts in 48 hours — DM us or send an
            email.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={TIKTOK}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              <TikTokIcon className="h-4 w-4" />
              {TIKTOK_HANDLE}
            </a>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              <InstagramIcon className="h-4 w-4" />
              {INSTAGRAM_HANDLE}
            </a>
            <a
              href={`mailto:${EMAIL}?subject=Content%20inquiry%20from%20the%20blog`}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-[0_8px_24px_rgba(255,43,43,0.4)]"
            >
              Email us
            </a>
          </div>
        </div>
      </article>

      <Footer />
      <WaFloat />
    </div>
  )
}
