"use client"

import { useEffect, useState } from "react"

const SHOWN_KEY = "mayowa-newsletter-last-shown"
const DONE_KEY = "mayowa-newsletter-subscribed"
const ONE_DAY = 24 * 60 * 60 * 1000

export function NewsletterPopup() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")

  useEffect(() => {
    if (localStorage.getItem(DONE_KEY)) return
    const last = Number(localStorage.getItem(SHOWN_KEY) || 0)
    if (Date.now() - last < ONE_DAY) return
    const t = setTimeout(() => {
      setOpen(true)
      localStorage.setItem(SHOWN_KEY, String(Date.now()))
    }, 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (!open) return null

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    setStatus("sending")
    try {
      const res = await fetch("https://formsubmit.co/ajax/mayowaaiagent@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          _subject: "New newsletter signup — MAYOWA website",
          _template: "table",
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus("done")
      localStorage.setItem(DONE_KEY, "1")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Join the newsletter"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-8 text-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {status === "done" ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </span>
            <h3 className="text-xl font-semibold">You&apos;re in! 🎉</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Welcome to the MAYOWA newsletter. Fresh AI content drops, coming your way.
            </p>
          </div>
        ) : (
          <>
            <span className="mb-4 inline-block rounded-full bg-neutral-950 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-white">
              Newsletter
            </span>
            <h3 className="text-2xl font-semibold tracking-tight">
              Content ideas your competitors don&apos;t have. Free.
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Join the MAYOWA newsletter — AI content trends, real examples, and offers, straight to your inbox.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                name="name"
                type="text"
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Your email"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-xl bg-brand py-3.5 font-semibold text-white transition hover:shadow-[0_8px_24px_rgba(255,43,43,0.4)] disabled:opacity-60"
              >
                {status === "sending" ? "Joining…" : "Join the newsletter"}
              </button>
              {status === "error" && (
                <p className="text-center text-xs text-red-600">
                  Something went wrong. Please try again, or message us on WhatsApp.
                </p>
              )}
            </form>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full text-center text-xs text-neutral-400 transition hover:text-neutral-600"
            >
              Not now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
