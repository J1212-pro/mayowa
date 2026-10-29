import { unzip } from "fflate"
import { isPhotoPath, MAX_ARCHIVE_BYTES, MAX_EXTRACTED_BYTES, MAX_PHOTO_BYTES, MAX_PHOTOS, photoExtension } from "./portfolio-images"

export async function extractPhotos(files: File[]): Promise<{ photos: File[]; skipped: number }> {
  const photos: File[] = []
  let skipped = 0
  let total = 0
  for (const file of files) {
    if (photoExtension(file.name) !== "zip") {
      if (!isPhotoPath(file.name)) { skipped++; continue }
      total += file.size
      photos.push(file)
    } else {
      if (file.size > MAX_ARCHIVE_BYTES) throw new Error("Keep each ZIP under 100 MB.")
      const buffer = await file.arrayBuffer()
      const archive = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
        let invalid = false
        let count = photos.length
        unzip(new Uint8Array(buffer), {
          filter: (entry) => {
            if (entry.name.endsWith("/")) return false
            if (!isPhotoPath(entry.name)) { skipped++; return false }
            total += entry.originalSize
            count++
            if (count > MAX_PHOTOS || total > MAX_EXTRACTED_BYTES) { invalid = true; return false }
            return true
          },
        }, (error, entries) => {
          if (invalid) reject(new Error("Choose up to 100 photos, with no more than 250 MB of original images."))
          else if (error) reject(new Error("This ZIP could not be opened. Use a standard, unencrypted ZIP."))
          else resolve(entries)
        })
      })
      for (const [name, bytes] of Object.entries(archive)) {
        photos.push(new File([bytes.slice().buffer], name.split(/[\\/]/).pop() || name))
      }
    }
    if (photos.length > MAX_PHOTOS || total > MAX_EXTRACTED_BYTES) throw new Error("Choose up to 100 photos, with no more than 250 MB of original images.")
  }
  if (!photos.length) throw new Error("No supported photos found. Choose JPG, PNG, WebP, GIF or AVIF images, or a ZIP containing them.")
  return { photos, skipped }
}

/** Resize before upload so each request fits the hosting limit. GIFs retain animation. */
export async function preparePhoto(file: File): Promise<File> {
  const extension = photoExtension(file.name)
  const stem = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 50) || "photo"
  const id = crypto.randomUUID().slice(0, 8)
  if (extension === "gif") {
    if (file.size > MAX_PHOTO_BYTES) throw new Error(`${file.name}: animated GIFs must be under 3 MB.`)
    return new File([file], `${stem}-${id}.gif`, { type: "image/gif" })
  }
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file) }
  catch { throw new Error(`${file.name}: this image could not be opened. Try exporting it as JPG or PNG.`) }
  try {
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Your browser could not prepare images. Try a newer browser.")
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.88, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality))
      if (blob && blob.size <= MAX_PHOTO_BYTES) {
        const ext = blob.type === "image/webp" ? "webp" : "png"
        return new File([blob], `${stem}-${id}.${ext}`, { type: blob.type })
      }
    }
    throw new Error(`${file.name}: still too large after resizing. Choose a smaller image.`)
  } finally { bitmap.close() }
}
