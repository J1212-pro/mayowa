import fs from "fs"
import path from "path"

// Blog posts are JSON files in public/blog/. On Vercel new posts are committed
// to GitHub (lib/github.ts) which triggers a redeploy that ships them.
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

export function listPosts(): BlogPost[] {
  const dir = blogDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        const post = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as BlogPost
        return post?.slug && post?.title && post?.html ? post : null
      } catch {
        return null
      }
    })
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): BlogPost | null {
  return listPosts().find((p) => p.slug === slug) ?? null
}
