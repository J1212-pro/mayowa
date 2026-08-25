import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { getPost, savePost, contentToHtml, descriptionFromHtml, type BlogPost } from "@/lib/blog"

// Edit an existing post. The slug (web address) and publish date stay the same.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.trim() : ""
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  const content = typeof body?.content === "string" ? body.content.trim() : ""
  const tags =
    typeof body?.tags === "string"
      ? body.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
          .slice(0, 5)
      : []

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid post." }, { status: 400 })
  }
  const existing = await getPost(slug)
  if (!existing) {
    return NextResponse.json({ error: "This post no longer exists." }, { status: 404 })
  }
  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Enter a title (up to 120 characters)." }, { status: 400 })
  }
  if (!content || content.length < 100) {
    return NextResponse.json({ error: "The post content is too short — write at least a few sentences." }, { status: 400 })
  }

  const html = contentToHtml(content)
  const post: BlogPost = {
    ...existing,
    title,
    description: descriptionFromHtml(html),
    tags,
    html,
  }

  try {
    await savePost(post)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save the post." },
      { status: 500 },
    )
  }

  revalidatePath("/", "layout")
  return NextResponse.json({ ok: true, slug: post.slug, title: post.title })
}
