"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/site"

export function AdminLogin() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    const password = new FormData(e.currentTarget).get("password")
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Login failed.")
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Logo />
      <form onSubmit={submit} className="mt-8 w-full max-w-sm rounded-3xl bg-white p-8 text-neutral-950">
        <h1 className="text-xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your portfolio videos and product images.</p>
        <input
          name="password"
          type="password"
          required
          autoFocus
          placeholder="Admin password"
          className="mt-5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:shadow-[0_8px_24px_rgba(255,43,43,0.4)] disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  )
}
