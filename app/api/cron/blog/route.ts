import { NextResponse } from "next/server"
import { generatePost, hasAnthropic } from "@/lib/blog-generator"

export const maxDuration = 300

// Called by Vercel Cron once a week (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when the CRON_SECRET env var is set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  if (!hasAnthropic()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured — auto-blog is paused." },
      { status: 500 },
    )
  }

  try {
    const post = await generatePost()
    return NextResponse.json({ ok: true, slug: post.slug, title: post.title })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed." },
      { status: 500 },
    )
  }
}
