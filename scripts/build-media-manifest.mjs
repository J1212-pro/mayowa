// Runs before every build (npm "prebuild"). Writes a small list of the media
// files shipped in public/ so the server code never needs the heavy folders
// bundled into its functions (Vercel caps a function at 250 MB).
import fs from "fs"
import path from "path"

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v"])
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"])

const root = process.cwd()
const portfolioDir = path.join(root, "public", "portfolio")
const imagesDir = path.join(root, "public", "images")

const videos = fs.existsSync(portfolioDir)
  ? fs.readdirSync(portfolioDir).filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase())).sort()
  : []

const products = fs.existsSync(imagesDir)
  ? fs
      .readdirSync(imagesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((dir) => ({
        name: dir.name,
        images: fs
          .readdirSync(path.join(imagesDir, dir.name))
          .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
          .sort(),
      }))
      .filter((p) => p.images.length > 0)
  : []

const manifest = { videos, products }
fs.writeFileSync(path.join(root, "lib", "media-manifest.json"), JSON.stringify(manifest, null, 2))
console.log(`media-manifest: ${videos.length} videos, ${products.length} products`)
