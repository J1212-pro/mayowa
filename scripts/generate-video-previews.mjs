// Run locally with an FFmpeg executable path. Commit the generated previews
// and metadata; production builds do not require FFmpeg.
import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"

const ffmpeg = process.argv[2]
if (!ffmpeg) throw new Error("Pass the path to an FFmpeg executable")
const input = path.resolve("public/portfolio")
const output = path.resolve("public/video-previews")
fs.mkdirSync(output, { recursive: true })
const previews = {}
for (const file of fs.readdirSync(input).filter((file) => /\.(mp4|webm|mov|m4v)$/i.test(file))) {
  const source = path.join(input, file)
  const info = spawnSync(ffmpeg, ["-hide_banner", "-i", source], { encoding: "utf8" })
  const dimensions = info.stderr.match(/Video:[^\r\n]*?\b(\d{2,5})x(\d{2,5})\b/)
  if (!dimensions) throw new Error(`Cannot read dimensions: ${file}`)
  const width = Number(dimensions[1]), height = Number(dimensions[2])
  const name = createHash("sha256").update(file).digest("hex").slice(0, 12) + ".webp"
  const result = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-ss", "0.5", "-i", source, "-frames:v", "1", "-vf", "scale=640:-2", "-quality", "75", path.join(output, name)], { encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr)
  previews[file] = { poster: `/video-previews/${name}`, format: height > width ? "short" : "video", width, height }
}
fs.writeFileSync("lib/video-previews.json", JSON.stringify(previews, null, 2) + "\n")
console.log(`Generated ${Object.keys(previews).length} lightweight previews`)
