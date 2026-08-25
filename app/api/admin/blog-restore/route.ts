import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { restorePost } from "@/lib/blog"

// Bring a deleted post back from the trash.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.trim() : ""
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid post." }, { status: 400 })
  }

  try {
    const post = await restorePost(slug)
    if (!post) {
      return NextResponse.json({ error: "This post isn't in the trash anymore." }, { status: 404 })
    }
    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true, slug: post.slug, title: post.title })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Restore failed." },
      { status: 500 },
    )
  }
}
