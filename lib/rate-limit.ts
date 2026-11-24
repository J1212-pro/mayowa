// Best-effort in-memory rate limiting (per server instance).

type Entry = { n: number; t: number }
const buckets = new Map<string, Map<string, Entry>>()

/** Client IP as reported by the hosting proxy (Vercel sets x-real-ip and overwrites x-forwarded-for). */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  )
}

function bucket(name: string): Map<string, Entry> {
  let b = buckets.get(name)
  if (!b) {
    b = new Map()
    buckets.set(name, b)
  }
  return b
}

function prune(b: Map<string, Entry>, windowMs: number) {
  if (b.size < 5000) return
  const now = Date.now()
  for (const [k, v] of b) if (now - v.t > windowMs) b.delete(k)
}

/** True when the key has already used up its attempts in the current window. */
export function isLimited(name: string, key: string, max: number, windowMs: number): boolean {
  const e = bucket(name).get(key)
  if (!e) return false
  if (Date.now() - e.t > windowMs) {
    bucket(name).delete(key)
    return false
  }
  return e.n >= max
}

/** Count one attempt against the key. */
export function hit(name: string, key: string, windowMs: number) {
  const b = bucket(name)
  prune(b, windowMs)
  const now = Date.now()
  const e = b.get(key)
  if (!e || now - e.t > windowMs) b.set(key, { n: 1, t: now })
  else e.n++
}

export function reset(name: string, key: string) {
  bucket(name).delete(key)
}
