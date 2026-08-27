import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { getPost, savePost, slugify, contentToHtml, descriptionFromHtml, type BlogPost } from "@/lib/blog"

// Manual post creation from the admin panel.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
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

  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Enter a title (up to 120 characters)." }, { status: 400 })
  }
  if (!content || content.length < 100) {
    return NextResponse.json({ error: "The post content is too short. Write at least a few sentences." }, { status: 400 })
  }

  const slug = slugify(title)
  if (!slug) {
    return NextResponse.json({ error: "The title needs some letters or numbers." }, { status: 400 })
  }
  if (await getPost(slug)) {
    return NextResponse.json({ error: "A post with this title already exists. Change the title." }, { status: 409 })
  }

  const html = contentToHtml(content)
  const post: BlogPost = {
    slug,
    title,
    description: descriptionFromHtml(html),
    date: new Date().toISOString(),
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
