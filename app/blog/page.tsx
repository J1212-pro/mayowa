import Link from "next/link"
import { Nav, Footer, WaFloat } from "@/components/site"
import { listPosts } from "@/lib/blog"
import { SITE_URL } from "@/lib/site"

// Cached for speed; refreshed automatically when a post is published (and every 5 min).
export const revalidate = 300

const DESCRIPTION =
  "Weekly breakdowns of what's working in AI UGC, AI product imagery and content marketing for brands that need to post every day."

export const metadata = {
  title: "AI UGC & Content Marketing Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: "AI UGC & Content Marketing Blog | MAYOWA",
    description: DESCRIPTION,
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export default async function BlogPage() {
  const posts = await listPosts()

  return (
    <div className="flex-1">
      <Nav />

      <header className="px-6 pt-20 text-center">
        <span className="mb-5 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide">
          MAYOWA Blog
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">AI content, decoded weekly</h1>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          What&apos;s working in AI UGC, product imagery, and content marketing, fresh every week.
        </p>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        {posts.length === 0 ? (
          <p className="text-center text-white/50">First post drops soon. Check back this week.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <time className="text-xs text-white/40">{formatDate(post.date)}</time>
                  <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
                  <p className="mt-2 text-sm text-white/60">{post.description}</p>
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Footer />
      <WaFloat />
    </div>
  )
}
