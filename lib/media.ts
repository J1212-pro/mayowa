import fs from "fs"
import path from "path"

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

export function listVideos(): Video[] {
  const dir = videosDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => ({
      file: f,
      src: "/portfolio/" + encodeURIComponent(f),
      tag: path.parse(f).name,
    }))
}

export function loadProducts(): Product[] {
  const root = imagesDir()
  if (!fs.existsSync(root)) return []
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((dir) => {
      const images = fs
        .readdirSync(path.join(root, dir.name))
        .filter((file) => IMAGE_EXTS.has(path.extname(file).toLowerCase()))
        .sort()
        .map((file) => `/images/${encodeURIComponent(dir.name)}/${encodeURIComponent(file)}`)
      return { name: dir.name, images }
    })
    .filter((product) => product.images.length > 0)
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
