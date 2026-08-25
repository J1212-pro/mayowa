import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { getPost, savePost, slugify, type BlogPost } from "@/lib/blog"

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Plain text -> simple HTML: blank lines split paragraphs; a line ending in ":" or short ALL-CAPS-free heading stays a paragraph. */
function textToHtml(text: string): string {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, "<br />")}</p>`)
    .join("\n")
}

// Manual post creation from the admin panel.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  const content = typeof body?.content === "string" ? body.content.trim() : ""
  const description = typeof body?.description === "string" ? body.description.trim() : ""
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
    return NextResponse.json({ error: "The post content is too short — write at least a few sentences." }, { status: 400 })
  }

  const slug = slugify(title)
  if (!slug) {
    return NextResponse.json({ error: "The title needs some letters or numbers." }, { status: 400 })
  }
  if (await getPost(slug)) {
    return NextResponse.json({ error: "A post with this title already exists — change the title." }, { status: 409 })
  }

  // Pasted HTML is used as-is; plain text is converted to paragraphs.
  const looksLikeHtml = /<\s*(p|h2|h3|ul|ol|li|blockquote|strong|em|br|b|i|a|div)[\s>/]/i.test(content)
  const post: BlogPost = {
    slug,
    title,
    description: description || content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
    date: new Date().toISOString(),
    tags,
    html: looksLikeHtml ? content : textToHtml(content),
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
