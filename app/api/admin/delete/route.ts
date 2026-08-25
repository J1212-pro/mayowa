import fs from "fs"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { safeName, resolveInside, videosDir, imagesDir, hasBlobStore, listBlobs } from "@/lib/media"
import { useGithubStorage, githubDeleteFile, githubDeleteDir } from "@/lib/github"

/** Delete matching media from the Blob store. Returns true if anything was removed. */
async function deleteFromBlob(kind: string, name: string, product: string): Promise<boolean> {
  if (!hasBlobStore()) return false
  try {
    let matches: { url: string }[] = []
    if (kind === "video") {
      matches = (await listBlobs("portfolio/")).filter((b) => b.pathname === `portfolio/${name}`)
    } else if (kind === "image") {
      matches = (await listBlobs(`images/${product}/`)).filter((b) => b.pathname === `images/${product}/${name}`)
    } else if (kind === "product") {
      matches = await listBlobs(`images/${name}/`)
    }
    if (matches.length === 0) return false
    const { del } = await import("@vercel/blob")
    await del(matches.map((b) => b.url))
    return true
  } catch {
    return false
  }
}

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
  const productForImage = safeName(String(body?.product || ""), 60)
  if (kind === "image" && !productForImage) {
    return NextResponse.json({ error: "Missing product." }, { status: 400 })
  }

  // Blob-stored media (direct admin uploads) — removed instantly, no redeploy.
  if (await deleteFromBlob(kind, name, productForImage)) {
    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true })
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
  revalidatePath("/", "layout")
  return NextResponse.json({ ok: true })
}
