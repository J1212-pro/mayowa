import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"
import { generatePost, hasAnthropic } from "@/lib/blog-generator"

export const maxDuration = 300

// Manual "write a post now" trigger from the admin panel.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }
  if (!hasAnthropic()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on this server." },
      { status: 500 },
    )
  }

  try {
    const post = await generatePost()
    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true, slug: post.slug, title: post.title })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed." },
      { status: 500 },
    )
  }
}
