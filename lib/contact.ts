export const WA_LINK = "https://wa.me/447462224166"
export const PHONE = "+447462224166"
export const PHONE_DISPLAY = "+44 7462 224166"
export const EMAIL = "mayowaaiagent@gmail.com"

export function waHref(text: string) {
  return `${WA_LINK}?text=${encodeURIComponent(text)}`
}
