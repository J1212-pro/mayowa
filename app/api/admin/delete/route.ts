import fs from "fs"
import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"
import { safeName, resolveInside, videosDir, imagesDir } from "@/lib/media"
import { useGithubStorage, githubDeleteFile, githubDeleteDir } from "@/lib/github"

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const kind = body?.kind
  const name = safeName(String(body?.name || ""))
  if (!name) {
    return NextResponse.json({ error: "Missing name." }, { status: 400 })
  }

  if (useGithubStorage()) {
    const message = `Admin delete: ${name}`
    let ok = false
    if (kind === "video") {
      ok = await githubDeleteFile(`public/portfolio/${name}`, message)
    } else if (kind === "product") {
      ok = await githubDeleteDir(`public/images/${name}`, message)
    } else if (kind === "image") {
      const product = safeName(String(body?.product || ""), 60)
      if (!product) return NextResponse.json({ error: "Missing product." }, { status: 400 })
      ok = await githubDeleteFile(`public/images/${product}/${name}`, message)
    } else {
      return NextResponse.json({ error: "Unknown kind." }, { status: 400 })
    }
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 })
    return NextResponse.json({ ok: true, github: true })
  }

  let target: string | null = null
  if (kind === "video") {
    target = resolveInside(videosDir(), name)
  } else if (kind === "product") {
    target = resolveInside(imagesDir(), name)
  } else if (kind === "image") {
    const product = safeName(String(body?.product || ""), 60)
    if (!product) return NextResponse.json({ error: "Missing product." }, { status: 400 })
    target = resolveInside(imagesDir(), product, name)
  } else {
    return NextResponse.json({ error: "Unknown kind." }, { status: 400 })
  }

  if (!target || !fs.existsSync(target)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  fs.rmSync(target, { recursive: kind === "product", force: true })
  return NextResponse.json({ ok: true })
}
