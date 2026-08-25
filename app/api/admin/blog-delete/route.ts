import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { blogDir, getPost, trashPost } from "@/lib/blog"
import { hasBlobStore, listBlobs } from "@/lib/media"

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.trim() : ""
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid post." }, { status: 400 })
  }

  // Park a copy in the trash first so the delete can be undone from the panel.
  const current = await getPost(slug)
  if (current) {
    try {
      await trashPost(current)
    } catch {
      return NextResponse.json({ error: "Could not back the post up before deleting — nothing was deleted." }, { status: 500 })
    }
  }

  let deletedBlob = false
  if (hasBlobStore()) {
    try {
      const match = (await listBlobs("blog/")).find((b) => b.pathname === `blog/${slug}.json`)
      if (match) {
        const { del } = await import("@vercel/blob")
        await del(match.url)
        deletedBlob = true
      }
    } catch {
      // fall through to the local check
    }
  }

  let deletedLocal = false
  let localBuiltIn = false
  const localFile = path.join(blogDir(), `${slug}.json`)
  if (fs.existsSync(localFile)) {
    try {
      fs.rmSync(localFile, { force: true })
      deletedLocal = true
    } catch {
      // Read-only on the host: this post ships inside the site code.
      localBuiltIn = true
    }
  }

  if (!deletedBlob && !deletedLocal) {
    if (localBuiltIn) {
      return NextResponse.json(
        { error: "This post is built into the site's code and can't be deleted from here." },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: "This post no longer exists." }, { status: 404 })
  }

  revalidatePath("/", "layout")
  if (localBuiltIn && deletedBlob) {
    return NextResponse.json({ ok: true, note: "Your edited version was removed; the original built-in post is showing again." })
  }
  return NextResponse.json({ ok: true })
}
