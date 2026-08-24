import fs from "fs"
import path from "path"
import { hasBlobStore, listBlobs } from "@/lib/media"

// Blog posts are JSON documents. They live in the Vercel Blob store when it's
// configured (published instantly, no redeploy) and/or as files in public/blog
// shipped with the repo. Both sources are merged at read time.
export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string // ISO
  tags: string[]
  html: string
}

export function blogDir() {
  return path.join(process.cwd(), "public", "blog")
}

function isPost(p: unknown): p is BlogPost {
  const post = p as BlogPost
  return !!post && typeof post.slug === "string" && typeof post.title === "string" && typeof post.html === "string"
}

function localPosts(): BlogPost[] {
  const dir = blogDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        const post = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
        return isPost(post) ? post : null
      } catch {
        return null
      }
    })
    .filter((p): p is BlogPost => p !== null)
}

async function blobPosts(): Promise<BlogPost[]> {
  if (!hasBlobStore()) return []
  const blobs = (await listBlobs("blog/")).filter((b) => b.pathname.endsWith(".json"))
  const posts = await Promise.all(
    blobs.map(async (b) => {
      try {
        const res = await fetch(b.url, { cache: "no-store" })
        if (!res.ok) return null
        const post = await res.json()
        return isPost(post) ? post : null
      } catch {
        return null
      }
    }),
  )
  return posts.filter((p): p is BlogPost => p !== null)
}

export async function listPosts(): Promise<BlogPost[]> {
  const merged = new Map<string, BlogPost>()
  for (const p of localPosts()) merged.set(p.slug, p)
  for (const p of await blobPosts()) merged.set(p.slug, p) // blob wins on conflict
  return [...merged.values()].sort((a, b) => b.date.localeCompare(a.date))
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  return (await listPosts()).find((p) => p.slug === slug) ?? null
}
