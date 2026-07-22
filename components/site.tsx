"use client"

import { useState } from "react"
import Link from "next/link"

import { WA_LINK, PHONE, PHONE_DISPLAY, EMAIL, waHref } from "@/lib/contact"

export { WA_LINK, PHONE, PHONE_DISPLAY, EMAIL, waHref }

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.2-.7l.4-.5c.1-.2.2-.3.3-.5v-.5c0-.1-.5-1.4-.7-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.6-.4Z" />
    </svg>
  )
}

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.7.1.3 0 .7-.2 1l-2.3 2.1Z" />
    </svg>
  )
}

export function CamIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h8A2.5 2.5 0 0 1 16 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 3 17.5v-11Zm15 3.2 4.4-2.6a1 1 0 0 1 1.6.9v8a1 1 0 0 1-1.6.9L18 14.3V9.7Z" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link href="/" aria-label="Mayowa home" className="flex items-center gap-0.5 font-display text-xl tracking-wide text-white">
      MAY
      <span className="mx-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand">
        <CamIcon className="h-3.5 w-3.5 text-white" />
      </span>
      WA
    </Link>
  )
}

export function Nav({ active }: { active?: "portfolio" | "images" }) {
  const [open, setOpen] = useState(false)

  const links = [
    { href: "/#services", label: "Services", current: false },
    { href: "/portfolio", label: "Portfolio", current: active === "portfolio" },
    { href: "/portfolio#images", label: "AI Images", current: false },
    { href: "/#how", label: "How it works", current: false },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        {/* Desktop links + CTA */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-sm font-medium transition hover:text-white ${l.current ? "text-white" : "text-white/60"}`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={waHref("Hi Mayowa, I'm interested in AI content for my brand")}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(255,43,43,0.4)]"
          >
            <WhatsAppIcon />
            WhatsApp us
          </a>
        </div>

        {/* Mobile: compact WhatsApp + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href={waHref("Hi Mayowa, I'm interested in AI content for my brand")}
            target="_blank"
            rel="noopener"
            aria-label="Chat on WhatsApp"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="border-t border-white/10 bg-black/95 px-4 pb-5 pt-2 backdrop-blur-md md:hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block border-b border-white/5 py-3.5 text-[15px] font-medium ${l.current ? "text-white" : "text-white/70"}`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={waHref("Hi Mayowa, I'm interested in AI content for my brand")}
            target="_blank"
            rel="noopener"
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-brand py-3 font-semibold text-white"
          >
            <WhatsAppIcon />
            WhatsApp us
          </a>
        </div>
      )}
    </nav>
  )
}

export function CtaBand({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section id="start" className="px-6 py-20">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white px-6 py-16 text-center text-neutral-950">
        <span className="mb-5 inline-block rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-semibold tracking-wide text-white">
          Start Today
        </span>
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-neutral-600">{subtitle}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={waHref("Hi Mayowa, here's my brief:")}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(255,43,43,0.4)]"
          >
            <WhatsAppIcon />
            Send your brief
          </a>
          <a
            href={`tel:${PHONE}`}
            className="flex items-center gap-2 rounded-full border border-neutral-950/30 px-7 py-3.5 font-semibold transition hover:border-neutral-950"
          >
            <PhoneIcon />
            Call us
          </a>
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          WhatsApp &amp; calls: <a href={`tel:${PHONE}`} className="font-semibold text-neutral-950 hover:text-brand">{PHONE_DISPLAY}</a>
        </p>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-11">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <Logo />
          <ul className="space-y-2 text-sm text-white/60">
            <li>
              <a href={WA_LINK} target="_blank" rel="noopener" className="hover:text-white">
                WhatsApp: {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`tel:${PHONE}`} className="hover:text-white">
                Call: {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="hover:text-white">
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>
        <p className="mt-9 text-xs text-white/40">© 2026 MAYOWA — AI UGC video · Image generation · Website design</p>
      </div>
    </footer>
  )
}

export function WaFloat() {
  return (
    <a
      href={waHref("Hi Mayowa!")}
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition hover:scale-110"
    >
      <WhatsAppIcon className="h-7 w-7 text-white" />
    </a>
  )
}

export function VideoCard({ src, tag }: { src: string; tag: string }) {
  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      <video
        src={src}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="h-full w-full cursor-pointer object-cover"
        onClick={(e) => {
          const v = e.currentTarget
          v.muted = !v.muted
        }}
      />
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-sm">
        {tag}
      </span>
    </div>
  )
}
