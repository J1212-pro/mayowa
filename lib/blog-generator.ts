import Anthropic from "@anthropic-ai/sdk"
import { listPosts, savePost, type BlogPost } from "@/lib/blog"
import { TIKTOK, INSTAGRAM, EMAIL } from "@/lib/contact"

export function hasAnthropic(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/** Pull today's trending searches from Google Trends (free RSS, no key). */
async function fetchTrendingTopics(): Promise<string[]> {
  try {
    const res = await fetch("https://trends.google.com/trending/rss?geo=US", {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const titles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1].trim())
    return titles.slice(1, 21) // first <title> is the feed name
  } catch {
    return []
  }
}

const POST_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  required: ["slug", "title", "description", "tags", "html"],
  properties: {
    slug: {
      type: "string" as const,
      description: "URL slug: lowercase words separated by hyphens, no spaces or special characters, max 60 chars",
    },
    title: { type: "string" as const, description: "Compelling post title, max 70 chars" },
    description: { type: "string" as const, description: "SEO meta description, 140-160 chars" },
    tags: { type: "array" as const, items: { type: "string" as const }, description: "3-5 topic tags" },
    html: {
      type: "string" as const,
      description:
        "Full post body as clean HTML using only h2, h3, p, ul, ol, li, strong, em, blockquote tags. No h1 (the page adds it), no scripts, no styles, no images. 900-1400 words.",
    },
  },
}

export async function generatePost(): Promise<BlogPost> {
  if (!hasAnthropic()) {
    throw new Error("ANTHROPIC_API_KEY is not configured on this server.")
  }

  const client = new Anthropic()
  const trends = await fetchTrendingTopics()
  const existing = await listPosts()
  const existingTitles = existing.map((p) => p.title)
  const linkTargets = existing.slice(0, 5).map((p) => `- /blog/${p.slug} ("${p.title}")`)

  const prompt = `You write the weekly blog for MAYOWA (mayowaai.online), an AI content studio that sells three services: AI UGC video creation (creator-style ads without creators), AI product image generation (product shots without photoshoots), and website design. Audience: small business owners, e-commerce brands, and marketers who want more content with less budget.

Write one blog post that connects something currently relevant to the value of AI-generated content for brands. It must be genuinely useful (actionable tips, concrete examples, honest tradeoffs), not an ad — but naturally position AI UGC/imagery as the practical answer where it fits.

${trends.length ? `Today's trending searches on Google (pick ONE only if it can be tied naturally to marketing/content/AI — otherwise ignore them and choose an evergreen angle):\n${trends.map((t) => `- ${t}`).join("\n")}` : "No trend data available — choose a strong evergreen angle about AI content marketing."}

${existingTitles.length ? `Already published (do NOT repeat these topics):\n${existingTitles.map((t) => `- ${t}`).join("\n")}` : ""}

Internal linking (SEO): inside the body copy, naturally link once to <a href="/portfolio">the MAYOWA portfolio</a> where it supports a point, and link to ONE related earlier post from this list if any fits the topic (use the relative URL exactly as given):
${linkTargets.length ? linkTargets.join("\n") : "- (no earlier posts yet — portfolio link only)"}

Tone: confident, plain-spoken, zero corporate filler. Short paragraphs. Never use the em dash character (—) anywhere in the title, description, or html; use commas, colons, or full stops instead. End the html with a brief call-to-action paragraph inviting readers to DM MAYOWA on TikTok or Instagram or email ${EMAIL} for a free content audit.`

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 30000,
    output_config: {
      format: { type: "json_schema", schema: POST_SCHEMA },
    },
    messages: [{ role: "user", content: prompt }],
  })
  const response = await stream.finalMessage()

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to generate this post. Try again later.")
  }

  const textBlock = response.content.find((b) => b.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No content returned from the model.")
  }
  const data = JSON.parse(textBlock.text) as Omit<BlogPost, "date">

  const slug = data.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "") // strip hyphens AFTER truncating so a cut never leaves one dangling

  // Safety net: the site style bans em dashes in visible text.
  const deDash = (s: string) => s.replace(/\s*—\s*/g, ", ")

  const post: BlogPost = {
    slug,
    title: deDash(data.title),
    description: deDash(data.description),
    date: new Date().toISOString(),
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : [],
    html: deDash(data.html),
  }

  await savePost(post)
  return post
}

// Social links re-exported so generated CTAs and pages stay in sync
export { TIKTOK, INSTAGRAM }
