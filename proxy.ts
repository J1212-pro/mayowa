import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Serve the blog on its own subdomain: blog.mayowaai.online/<slug> is
// internally rewritten to /blog/<slug>. Static assets, API routes, and the
// admin stay untouched.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || ""
  if (!host.startsWith("blog.")) return NextResponse.next()

  const url = request.nextUrl.clone()
  const p = url.pathname
  if (p.startsWith("/blog") || p.startsWith("/api") || p.startsWith("/_next") || p.startsWith("/admin") || p.includes(".")) {
    return NextResponse.next()
  }
  url.pathname = p === "/" ? "/blog" : `/blog${p}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
