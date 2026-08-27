import fs from "fs"
import path from "path"
import manifest from "./media-manifest.json"

export const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v"])
export const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"])

export type Video = { file: string; src: string; tag: string }
export type Product = { name: string; images: string[] }

const PUBLIC = () => path.join(process.cwd(), "public")

export function videosDir() {
  return path.join(PUBLIC(), "portfolio")
}

export function imagesDir() {
  return path.join(PUBLIC(), "images")
}

export function hasBlobStore(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

/** All blobs under a prefix (Vercel Blob store), empty when not configured. */
export async function listBlobs(prefix: string): Promise<{ pathname: string; url: string }[]> {
  if (!hasBlobStore()) return []
  try {
    const { list } = await import("@vercel/blob")
    const out: { pathname: string; url: string }[] = []
    let cursor: string | undefined
    do {
      const res = await list({ prefix, cursor, limit: 1000 })
      out.push(...res.blobs.map((b) => ({ pathname: b.pathname, url: b.url })))
      cursor = res.hasMore ? res.cursor : undefined
    } while (cursor)
    return out
  } catch {
    return []
  }
}

function localVideos(): Video[] {
  const dir = videosDir()
  // On Vercel the heavy media folders are excluded from the function bundle
  // (next.config outputFileTracingExcludes), so fall back to the build-time
  // manifest there. Locally the folder exists and stays live.
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
    : manifest.videos
  return files.map((f) => ({
    file: f,
    src: "/portfolio/" + encodeURIComponent(f),
    tag: path.parse(f).name,
  }))
}

export async function listVideos(): Promise<Video[]> {
  const merged = new Map<string, Video>()
  for (const v of localVideos()) merged.set(v.file.toLowerCase(), v)
  for (const b of await listBlobs("portfolio/")) {
    const file = b.pathname.slice("portfolio/".length)
    if (!file || file.includes("/")) continue
    if (!VIDEO_EXTS.has(path.extname(file).toLowerCase())) continue
    merged.set(file.toLowerCase(), { file, src: b.url, tag: path.parse(file).name })
  }
  return [...merged.values()].sort((a, b) => a.file.localeCompare(b.file))
}

function localProducts(): Product[] {
  const root = imagesDir()
  const entries = fs.existsSync(root)
    ? fs
        .readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((dir) => ({
          name: dir.name,
          images: fs
            .readdirSync(path.join(root, dir.name))
            .filter((file) => IMAGE_EXTS.has(path.extname(file).toLowerCase()))
            .sort(),
        }))
    : manifest.products
  return entries
    .map((p) => ({
      name: p.name,
      images: p.images.map((file) => `/images/${encodeURIComponent(p.name)}/${encodeURIComponent(file)}`),
    }))
    .filter((product) => product.images.length > 0)
}

export async function loadProducts(): Promise<Product[]> {
  const merged = new Map<string, Product>()
  for (const p of localProducts()) merged.set(p.name.toLowerCase(), { ...p })

  for (const b of await listBlobs("images/")) {
    const rest = b.pathname.slice("images/".length)
    const slash = rest.indexOf("/")
    if (slash <= 0) continue
    const productName = rest.slice(0, slash)
    const file = rest.slice(slash + 1)
    if (!file || file.includes("/")) continue
    if (!IMAGE_EXTS.has(path.extname(file).toLowerCase())) continue
    const key = productName.toLowerCase()
    const existing = merged.get(key)
    if (existing) {
      if (!existing.images.includes(b.url)) existing.images.push(b.url)
    } else {
      merged.set(key, { name: productName, images: [b.url] })
    }
  }

  return [...merged.values()]
    .filter((p) => p.images.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Strip anything dangerous from a user-supplied file or folder name. */
export function safeName(input: string, maxLen = 80): string {
  const base = path.basename(input) // kills any path traversal
  const cleaned = base.replace(/[^a-zA-Z0-9 ._()\-]/g, "").replace(/\s+/g, " ").trim()
  return cleaned.slice(0, maxLen)
}

/** Resolve a child path and guarantee it stays inside the parent directory. */
export function resolveInside(parent: string, ...segments: string[]): string | null {
  const target = path.resolve(parent, ...segments)
  return target.startsWith(path.resolve(parent) + path.sep) ? target : null
}
