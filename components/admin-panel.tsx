"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/site"
import type { Video, Product } from "@/lib/media"

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 text-neutral-950 sm:p-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{hint}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function AdminPanel({ videos, products }: { videos: Video[]; products: Product[] }) {
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
