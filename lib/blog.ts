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
        // Default caching so cached pages stay fast; on-demand revalidation
        // (after publishing) plus the page-level revalidate keep it fresh.
        const res = await fetch(b.url)
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

/** Publish a post: Blob store when configured (instant), else local file. */
export async function savePost(post: BlogPost): Promise<void> {
  const json = JSON.stringify(post, null, 2)
  if (hasBlobStore()) {
    const { put } = await import("@vercel/blob")
    await put(`blog/${post.slug}.json`, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    })
  } else {
    fs.mkdirSync(blogDir(), { recursive: true })
    fs.writeFileSync(path.join(blogDir(), `${post.slug}.json`), json)
  }
}

/** Editor/pasted content -> post HTML. HTML passes through; plain text becomes paragraphs. */
export function contentToHtml(content: string): string {
  const looksLikeHtml = /<\s*(p|h2|h3|ul|ol|li|blockquote|strong|em|br|b|i|a|div)[\s>/]/i.test(content)
  if (looksLikeHtml) return content
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return content
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escape(block).replace(/\r?\n/g, "<br />")}</p>`)
    .join("\n")
}

/** Fallback meta description from post HTML. */
export function descriptionFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
}

/** Remove a post's stored file (blob + local) without trashing it. Used when renaming. */
export async function removePostFile(slug: string): Promise<void> {
  if (hasBlobStore()) {
    const match = (await listBlobs("blog/")).find((b) => b.pathname === `blog/${slug}.json`)
    if (match) {
      const { del } = await import("@vercel/blob")
      await del(match.url)
    }
  }
  const localFile = path.join(blogDir(), `${slug}.json`)
  if (fs.existsSync(localFile)) fs.rmSync(localFile, { force: true })
}

// ---- Trash: deleted posts are parked here so they can be restored ----

function localTrashDir() {
  return path.join(process.cwd(), ".data", "blog-trash")
}

export async function trashPost(post: BlogPost): Promise<void> {
  const json = JSON.stringify(post, null, 2)
  if (hasBlobStore()) {
    const { put } = await import("@vercel/blob")
    await put(`trash/blog/${post.slug}.json`, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    })
  } else {
    fs.mkdirSync(localTrashDir(), { recursive: true })
    fs.writeFileSync(path.join(localTrashDir(), `${post.slug}.json`), json)
  }
}

export async function listTrashedPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = []
  if (hasBlobStore()) {
    const blobs = (await listBlobs("trash/blog/")).filter((b) => b.pathname.endsWith(".json"))
    for (const b of blobs) {
      try {
        const res = await fetch(b.url, { cache: "no-store" })
        if (!res.ok) continue
        const post = await res.json()
        if (isPost(post)) posts.push(post)
      } catch {
        // skip unreadable entries
      }
    }
  }
  const dir = localTrashDir()
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      try {
        const post = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
        if (isPost(post) && !posts.some((p) => p.slug === post.slug)) posts.push(post)
      } catch {
        // skip unreadable entries
      }
    }
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

/** Bring a trashed post back to the live blog. */
export async function restorePost(slug: string): Promise<BlogPost | null> {
  const post = (await listTrashedPosts()).find((p) => p.slug === slug)
  if (!post) return null
  await savePost(post)
  // Remove the trash copy (best effort — the post is already restored).
  try {
    if (hasBlobStore()) {
      const match = (await listBlobs("trash/blog/")).find((b) => b.pathname === `trash/blog/${slug}.json`)
      if (match) {
        const { del } = await import("@vercel/blob")
        await del(match.url)
      }
    }
    const localFile = path.join(localTrashDir(), `${slug}.json`)
    if (fs.existsSync(localFile)) fs.rmSync(localFile, { force: true })
  } catch {
    // ignore — a stale trash copy is harmless
  }
  return post
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "") // strip hyphens AFTER truncating so a cut never leaves one dangling
}
