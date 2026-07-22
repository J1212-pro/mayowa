"use client"

import { useEffect, useState } from "react"

export type Product = {
  name: string
  images: string[]
}

export function ImageGallery({ products, onLight = false }: { products: Product[]; onLight?: boolean }) {
  const [active, setActive] = useState<Product | null>(null)
  const [index, setIndex] = useState(0)

  const close = () => setActive(null)
  const prev = () => active && setIndex((i) => (i - 1 + active.images.length) % active.images.length)
  const next = () => active && setIndex((i) => (i + 1) % active.images.length)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  if (products.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed p-14 text-center ${
          onLight ? "border-neutral-300 bg-neutral-50 text-neutral-600" : "border-white/20 bg-white/5 text-white/60"
        }`}
      >
        <b className={`mb-2 block text-lg ${onLight ? "text-neutral-950" : "text-white"}`}>
          Your product galleries load from folders
        </b>
        Inside <code className="rounded bg-brand/10 px-2 py-0.5 font-mono text-sm text-brand">public/images</code>,
        create one folder per product — the folder name becomes the product name — and drop the generated images
        inside. Refresh and they appear here.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {products.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setActive(p)
              setIndex(0)
            }}
            className={`group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1.5 ${
              onLight
                ? "border-neutral-200 bg-white hover:shadow-[0_14px_34px_rgba(0,0,0,0.15)]"
                : "border-white/10 bg-neutral-900 hover:shadow-[0_14px_34px_rgba(0,0,0,0.5)]"
            }`}
          >
            <div className="relative aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0]}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="px-3.5 py-3">
              <span className={`block truncate text-sm font-semibold ${onLight ? "text-neutral-950" : "text-white"}`}>
                {p.name}
              </span>
              <span className={`text-xs ${onLight ? "text-neutral-500" : "text-white/60"}`}>
                {p.images.length} {p.images.length === 1 ? "image" : "images"} · tap to view
              </span>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.name} images`}
          onClick={close}
        >
          <div className="flex items-center justify-between px-6 py-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <b className="block">{active.name}</b>
              <span className="text-xs text-white/50">
                {index + 1} / {active.images.length}
              </span>
            </div>
            <button
              onClick={close}
              aria-label="Close gallery"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-14" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.images[index]}
              alt={`${active.name} — image ${index + 1}`}
              className="max-h-[70vh] max-w-full rounded-xl object-contain"
            />
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto px-6 py-4" onClick={(e) => e.stopPropagation()}>
            {active.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                onClick={() => setIndex(i)}
                className={`h-16 w-12 cursor-pointer rounded-lg object-cover transition ${
                  i === index ? "ring-2 ring-brand" : "opacity-50 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
