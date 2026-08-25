"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { upload as blobUpload } from "@vercel/blob/client"
import { Logo } from "@/components/site"
import type { Video, Product } from "@/lib/media"

const VIDEO_EXT_LIST = [".mp4", ".webm", ".mov", ".m4v"]
const IMAGE_EXT_LIST = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]

function extOk(name: string, allowed: string[]) {
  const dot = name.lastIndexOf(".")
  return dot >= 0 && allowed.includes(name.slice(dot).toLowerCase())
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 text-neutral-950 sm:p-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{hint}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function AdminPanel({
  videos,
  products,
  blobEnabled,
}: {
  videos: Video[]
  products: Product[]
  blobEnabled: boolean
}) {
  const router = useRouter()
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)
  const videoInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const [product, setProduct] = useState("")
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/admin/subscribers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSubscriberCount(data?.total ?? 0))
      .catch(() => setSubscriberCount(0))
  }, [])

  const report = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(""), 6000)
  }

  const upload = async (kind: "video" | "image", input: HTMLInputElement | null) => {
    if (!input?.files?.length) {
      report("Choose files first.")
      return
    }
    if (kind === "image" && !product.trim()) {
      report("Type a product name first — it becomes the card title.")
      return
    }
    setBusy(true)

    // Direct browser -> storage upload: no server size limit, media is live instantly.
    if (blobEnabled) {
      const allowed = kind === "video" ? VIDEO_EXT_LIST : IMAGE_EXT_LIST
      const folder = kind === "video" ? "portfolio" : `images/${product.trim()}`
      const saved: string[] = []
      const rejected: string[] = []
      const files = [...input.files]
      try {
        for (let i = 0; i < files.length; i++) {
          const f = files[i]
          if (!extOk(f.name, allowed)) {
            rejected.push(`${f.name} (type not allowed)`)
            continue
          }
          setMsg(`Uploading ${i + 1} of ${files.length}: ${f.name}…`)
          try {
            await blobUpload(`${folder}/${f.name}`, f, {
              access: "public",
              handleUploadUrl: "/api/admin/blob-upload",
            })
            saved.push(f.name)
          } catch (err) {
            rejected.push(`${f.name} (${err instanceof Error ? err.message : "failed"})`)
          }
        }
        if (saved.length) {
          // Rebuild the cached public pages so the new media shows immediately.
          await fetch("/api/admin/revalidate", { method: "POST" }).catch(() => {})
        }
        const parts = [`Saved ${saved.length} file(s) — live on the site now.`]
        if (rejected.length) parts.push(`Rejected: ${rejected.join(", ")}`)
        report(parts.join(" "))
        input.value = ""
        router.refresh()
      } finally {
        setBusy(false)
      }
      return
    }

    // Fallback (local development): send through the server route.
    const form = new FormData()
    form.set("kind", kind)
    if (kind === "image") form.set("product", product.trim())
    for (const f of input.files) form.append("files", f)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form })
      if (res.status === 413) {
        throw new Error("Files too large for live upload — keep each batch under ~4 MB, or upload from your computer.")
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Upload failed.")
      const parts = [`Saved ${data.saved.length} file(s).`]
      if (data.rejected?.length) parts.push(`Rejected: ${data.rejected.join(", ")}`)
      if (data.github && data.saved.length) parts.push("The site updates in about 2 minutes.")
      report(parts.join(" "))
      input.value = ""
      router.refresh()
    } catch (err) {
      report(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (kind: "video" | "product" | "image", name: string, productName?: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name, product: productName }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Delete failed.")
      report(data.github ? `Deleted ${name}. The site updates in about 2 minutes.` : `Deleted ${name}.`)
      router.refresh()
    } catch (err) {
      report(err instanceof Error ? err.message : "Delete failed.")
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.refresh()
  }

  const generateBlogPost = async () => {
    if (!confirm("Write and publish a new AI blog post now? This takes a minute or two.")) return
    setBusy(true)
    report("Writing the post — this can take a minute or two, don't close the page…")
    try {
      const res = await fetch("/api/admin/blog-generate", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Generation failed.")
      report(`Published: "${data.title}" — live on the blog now.`)
    } catch (err) {
      report(err instanceof Error ? err.message : "Generation failed.")
    } finally {
      setBusy(false)
    }
  }

  const [postTitle, setPostTitle] = useState("")
  const [postTags, setPostTags] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // New blocks in the editor become <p> paragraphs instead of <div>s.
    document.execCommand("defaultParagraphSeparator", false, "p")
  }, [])

  const format = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  const addLink = () => {
    const url = prompt("Link address (e.g. https://example.com):")
    if (url) format("createLink", url)
  }

  const onEditorPaste = (e: React.ClipboardEvent) => {
    // Paste as plain text so outside formatting junk never sneaks in.
    e.preventDefault()
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"))
  }

  const createBlogPost = async () => {
    const html = editorRef.current?.innerHTML ?? ""
    const plain = editorRef.current?.textContent?.trim() ?? ""
    if (!postTitle.trim() || !plain) {
      report("Give the post a title and some content first.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/blog-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: postTitle, tags: postTags, content: html }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Publishing failed.")
      report(`Published: "${data.title}" — live on the blog now.`)
      setPostTitle("")
      setPostTags("")
      if (editorRef.current) editorRef.current.innerHTML = ""
      router.refresh()
    } catch (err) {
      report(err instanceof Error ? err.message : "Publishing failed.")
    } finally {
      setBusy(false)
    }
  }

  const toolbarButton = "rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-white/60 hover:text-white">
            View site
          </a>
          <button
            onClick={logout}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">Content admin</h1>
      <p className="mb-8 text-sm text-white/60">
        Whatever you upload here appears on the website immediately. Video filename = the label shown on the card.
      </p>

      {msg && (
        <div className="mb-6 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-white">{msg}</div>
      )}

      <div className="space-y-6">
        <Section
          title="Newsletter subscribers"
          hint="Everyone who joins the newsletter on the website is saved here. Download the list as a spreadsheet that opens in Excel."
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-neutral-600">
              {subscriberCount === null ? "Counting…" : `${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}`}
            </span>
            <a
              href="/api/admin/subscribers?format=csv"
              download
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              Download Excel (CSV)
            </a>
          </div>
        </Section>

        <Section
          title="Blog"
          hint="A new post is written automatically every Monday. You can also have the AI write one now, or write your own below."
        >
          <div className="flex flex-wrap items-center gap-4">
            <a href="/blog" target="_blank" className="text-sm text-neutral-600 underline hover:text-neutral-950">
              View the blog
            </a>
            <button
              onClick={generateBlogPost}
              disabled={busy}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Working…" : "AI: write a post now"}
            </button>
          </div>

          <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5">
            <p className="text-sm font-semibold">Write your own post</p>
            <input
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Post title"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            <input
              value={postTags}
              onChange={(e) => setPostTags(e.target.value)}
              placeholder="Tags, separated by commas (optional) — e.g. AI UGC, TikTok"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => format("formatBlock", "H2")} className={toolbarButton} title="Big heading">
                Heading
              </button>
              <button type="button" onClick={() => format("formatBlock", "H3")} className={toolbarButton} title="Small heading">
                Subheading
              </button>
              <button type="button" onClick={() => format("formatBlock", "P")} className={toolbarButton} title="Normal paragraph">
                Normal
              </button>
              <span className="mx-1 h-5 w-px bg-neutral-300" />
              <button type="button" onClick={() => format("bold")} className={`${toolbarButton} font-bold`} title="Bold">
                B
              </button>
              <button type="button" onClick={() => format("italic")} className={`${toolbarButton} italic`} title="Italic">
                I
              </button>
              <span className="mx-1 h-5 w-px bg-neutral-300" />
              <button type="button" onClick={() => format("insertUnorderedList")} className={toolbarButton} title="Bullet list">
                • List
              </button>
              <button type="button" onClick={() => format("insertOrderedList")} className={toolbarButton} title="Numbered list">
                1. List
              </button>
              <button type="button" onClick={() => format("formatBlock", "BLOCKQUOTE")} className={toolbarButton} title="Quote">
                &ldquo;Quote&rdquo;
              </button>
              <button type="button" onClick={addLink} className={`${toolbarButton} underline`} title="Add a link">
                Link
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              onPaste={onEditorPaste}
              role="textbox"
              aria-multiline="true"
              aria-label="Post content"
              data-placeholder="Write your post here. Select text and use the buttons above to style it."
              className="min-h-52 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)] [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-1.5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-1.5 [&_ul]:list-disc"
            />
            <button
              onClick={createBlogPost}
              disabled={busy}
              className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Working…" : "Publish post"}
            </button>
          </div>
        </Section>

        <Section
          title="Portfolio videos"
          hint="Upload 9:16 UGC videos (.mp4, .webm, .mov). The filename becomes the on-screen tag — name the file what you want visitors to read."
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={videoInput}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
              multiple
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <button
              onClick={() => upload("video", videoInput.current)}
              disabled={busy}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Working…" : "Upload videos"}
            </button>
          </div>
          <ul className="mt-5 divide-y divide-neutral-200 border-t border-neutral-200">
            {videos.map((v) => (
              <li key={v.file} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">{v.tag}</span>
                <button
                  onClick={() => remove("video", v.file)}
                  disabled={busy}
                  className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                >
                  Delete
                </button>
              </li>
            ))}
            {videos.length === 0 && <li className="py-2.5 text-sm text-neutral-400">No videos yet.</li>}
          </ul>
        </Section>

        <Section
          title="AI image products"
          hint="Type the product name (shown on the card), pick its images, upload. Add more images to an existing product by typing the same name."
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              list="admin-products"
              placeholder="Product name"
              className="w-56 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            <datalist id="admin-products">
              {products.map((p) => (
                <option key={p.name} value={p.name} />
              ))}
            </datalist>
            <input
              ref={imageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif"
              multiple
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <button
              onClick={() => upload("image", imageInput.current)}
              disabled={busy}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Working…" : "Upload images"}
            </button>
          </div>
          <ul className="mt-5 divide-y divide-neutral-200 border-t border-neutral-200">
            {products.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">
                  {p.name} <span className="text-neutral-400">— {p.images.length} images</span>
                </span>
                <button
                  onClick={() => remove("product", p.name)}
                  disabled={busy}
                  className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                >
                  Delete product
                </button>
              </li>
            ))}
            {products.length === 0 && <li className="py-2.5 text-sm text-neutral-400">No products yet.</li>}
          </ul>
        </Section>
      </div>
    </div>
  )
}
