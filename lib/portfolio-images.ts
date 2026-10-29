export const MAX_PHOTOS = 100
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024
export const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
export const MAX_EXTRACTED_BYTES = 250 * 1024 * 1024
export const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"]

export function portfolioName(value: unknown): string {
  if (typeof value !== "string") throw new Error("Enter a portfolio name.")
  const name = value.normalize("NFC").trim().replace(/\s+/g, " ")
  if (!name || name.length > 80 || /^[.]/.test(name) || /[. ]$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) || /[<>:"/\\|?*\u0000-\u001f\u007f]/.test(name)) {
    throw new Error("Use a portfolio name up to 80 characters without slashes or special file characters.")
  }
  return name
}

export function photoExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || ""
}

export function isPhotoPath(name: string): boolean {
  const parts = name.replace(/\\/g, "/").split("/")
  return parts.every((part) => !!part && !part.startsWith(".") && part !== "__MACOSX") && PHOTO_EXTENSIONS.includes(photoExtension(name))
}

/** Validate signatures as well as extensions before saving public files. */
export function photoType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end))
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg"
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return "png"
  if (["GIF87a", "GIF89a"].includes(ascii(0, 6))) return "gif"
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp"
  if (ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 32))) return "avif"
  return null
}
