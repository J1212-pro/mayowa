import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { getPost, savePost, removePostFile, contentToHtml, descriptionFromHtml, type BlogPost } from "@/lib/blog"

// Edit an existing post. Fields left out keep their current value; passing
// newSlug renames the post's web address (the old one is removed).
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.trim() : ""
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid post." }, { status: 400 })
  }
  const existing = await getPost(slug)
  if (!existing) {
    return NextResponse.json({ error: "This post no longer exists." }, { status: 404 })
  }

  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : existing.title
  if (title.length > 120) {
    return NextResponse.json({ error: "Enter a title (up to 120 characters)." }, { status: 400 })
  }

  const rawContent = typeof body?.content === "string" ? body.content.trim() : ""
  if (rawContent && rawContent.length < 100) {
    return NextResponse.json({ error: "The post content is too short — write at least a few sentences." }, { status: 400 })
  }
  const html = rawContent ? contentToHtml(rawContent) : existing.html

  const tags =
    typeof body?.tags === "string"
      ? body.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
          .slice(0, 5)
      : existing.tags

  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim().slice(0, 200)
      : rawContent
        ? descriptionFromHtml(html)
        : existing.description

  const newSlug = typeof body?.newSlug === "string" && body.newSlug.trim() ? body.newSlug.trim() : slug
  if (!/^[a-z0-9-]+$/.test(newSlug) || newSlug.length > 60) {
    return NextResponse.json({ error: "The new web address may only use lowercase letters, numbers, and hyphens." }, { status: 400 })
  }

  const post: BlogPost = { ...existing, slug: newSlug, title, description, tags, html }

  try {
    await savePost(post)
    if (newSlug !== slug) await removePostFile(slug)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save the post." },
      { status: 500 },
    )
  }

  revalidatePath("/", "layout")
  return NextResponse.json({ ok: true, slug: post.slug, title: post.title })
}
