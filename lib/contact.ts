export const WA_LINK = "https://wa.me/447462224166"
export const PHONE = "+447462224166"
export const PHONE_DISPLAY = "+44 7462 224166"
export const EMAIL = "mayowaaiagent@gmail.com"

export const TIKTOK = "https://www.tiktok.com/@mayowaaiagen"
export const TIKTOK_HANDLE = "@mayowaaiagen"
export const INSTAGRAM = "https://www.instagram.com/mayowaaiagent"
export const INSTAGRAM_HANDLE = "@mayowaaiagent"

export function waHref(text: string) {
  return `${WA_LINK}?text=${encodeURIComponent(text)}`
}
