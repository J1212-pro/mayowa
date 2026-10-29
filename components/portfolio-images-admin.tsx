"use client"

import { useEffect, useRef, useState } from "react"
import { extractPhotos, preparePhoto } from "@/lib/prepare-portfolio-images"
import { MAX_PHOTOS, portfolioName } from "@/lib/portfolio-images"
import type { StagedPhoto } from "@/lib/portfolio-photo-ticket"
import type { Product } from "@/lib/media"

type SelectedPhoto = { file: File; preview: string }

export function PortfolioImagesAdmin({ products, connected }: { products: Product[]; connected: boolean }) {
  const [name, setName] = useState("")
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState(false)
  const [commitUrl, setCommitUrl] = useState("")
  const [progress, setProgress] = useState(0)
  const selected = useRef<SelectedPhoto[]>([])
  const staged = useRef(new Map<string, StagedPhoto>())
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => () => selected.current.forEach((photo) => URL.revokeObjectURL(photo.preview)), [])

  const clear = () => {
    selected.current.forEach((photo) => URL.revokeObjectURL(photo.preview))
    selected.current = []
    staged.current.clear()
    setPhotos([])
    setProgress(0)
    if (fileInput.current) fileInput.current.value = ""
  }

  const choose = async (files: File[]) => {
    if (!files.length) return
    setBusy(true)
    setError(false)
    setCommitUrl("")
    const prepared: SelectedPhoto[] = []
    try {
      setMessage("Opening your photos…")
      const { photos: originals, skipped } = await extractPhotos(files)
      if (originals.length + selected.current.length > MAX_PHOTOS) throw new Error("Choose up to 100 photos per upload. Publish these first, then add more to the same portfolio.")
      for (let index = 0; index < originals.length; index++) {
        setMessage(`Preparing photo ${index + 1} of ${originals.length}…`)
        const file = await preparePhoto(originals[index])
        prepared.push({ file, preview: URL.createObjectURL(file) })
      }
      selected.current = [...selected.current, ...prepared]
      setPhotos(selected.current)
      setMessage(`${selected.current.length} photos ready.${skipped ? ` Skipped ${skipped} unsupported or hidden files.` : ""} Review them below, then publish.`)
    } catch (err) {
      prepared.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setError(true)
      setMessage(err instanceof Error ? err.message : "Could not open these photos.")
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const publish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(false)
    setCommitUrl("")
    let folder: string
    try { folder = portfolioName(name) }
    catch (err) { setError(true); setMessage((err as Error).message); return }
    // Reuse the exact existing folder name, including its capitalization.
    folder = products.find((product) => product.name.toLowerCase() === folder.toLowerCase())?.name || folder
    if (!photos.length) { setError(true); setMessage("Choose photos or a ZIP first."); return }
    setBusy(true)
    try {
      const receipts: StagedPhoto[] = []
      for (let index = 0; index < photos.length; index++) {
        const { file } = photos[index]
        const key = `${folder}/${file.name}`
        setMessage(`Uploading photo ${index + 1} of ${photos.length}…`)
        let receipt = staged.current.get(key)
        if (!receipt) {
          const form = new FormData()
          form.set("name", folder)
          form.set("file", file)
          const response = await fetch("/api/admin/portfolio-images", { method: "POST", body: form })
          const data = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(data.error || `Photo ${index + 1} could not upload. Try again; your selection is saved here.`)
          receipt = data as StagedPhoto
          staged.current.set(key, receipt)
        }
        receipts.push(receipt)
        setProgress(index + 1)
      }
      setMessage("Publishing your portfolio…")
      const response = await fetch("/api/admin/portfolio-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folder, photos: receipts }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 400) staged.current.clear()
        throw new Error(data.error || "Could not publish. Try again; your photos are still selected.")
      }
      if (typeof data.commit?.url === "string" && data.commit.url.startsWith("https://github.com/")) setCommitUrl(data.commit.url)
      setMessage(`Published ${data.count} photos to “${data.name}”. They will appear on your portfolio when the site update finishes, usually in a couple of minutes.`)
      setName(folder)
      clear()
    } catch (err) {
      setError(true)
      setMessage(err instanceof Error ? err.message : "Could not publish. Try again.")
    } finally { setBusy(false) }
  }

  const inputClass = "w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
  return (
    <section className="rounded-3xl bg-white p-6 text-neutral-950 sm:p-8" aria-labelledby="photo-portfolios-heading">
      <h2 id="photo-portfolios-heading" className="text-lg font-semibold">Photo portfolios</h2>
      <p className="mt-1 text-sm text-neutral-500">Name a portfolio and add multiple photos or a ZIP. Your photos are saved in GitHub and appear on your site after publishing.</p>
      {!connected && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">GitHub publishing is not connected. Connect it in your hosting settings before publishing photos.</p>}
      <form onSubmit={publish} className="mt-5 space-y-4">
        <div>
          <label htmlFor="photo-portfolio-name" className="mb-1.5 block text-sm font-medium">Portfolio name</label>
          <input id="photo-portfolio-name" value={name} onChange={(event) => { setName(event.target.value); staged.current.clear() }} list="photo-portfolio-names" placeholder="e.g. Summer skincare campaign" maxLength={80} required disabled={busy} className={inputClass} aria-describedby="photo-name-help" />
          <datalist id="photo-portfolio-names">{products.map((product) => <option key={product.name} value={product.name} />)}</datalist>
          <p id="photo-name-help" className="mt-2 text-xs text-neutral-500">This is the title visitors see. Choose an existing name to add more photos to that portfolio.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
          <label htmlFor="portfolio-photo-files" className="mb-3 block text-sm font-medium">Choose photos or ZIP files</label>
          <input id="portfolio-photo-files" ref={fileInput} type="file" multiple accept=".zip,.jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif,application/zip" disabled={busy} onChange={(event) => void choose(Array.from(event.target.files || []))} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60" aria-describedby="photo-file-help" />
          <p id="photo-file-help" className="mt-3 text-xs leading-relaxed text-neutral-500">Up to 100 photos at a time. ZIP files up to 100 MB. Photos are resized for the web; animated GIFs must be under 3 MB.</p>
        </div>
        {photos.length > 0 && <div>
          <div className="mb-3 flex items-center justify-between gap-3 text-sm"><p className="font-medium">{photos.length} photos selected</p><button type="button" disabled={busy} onClick={clear} className="text-xs font-semibold underline disabled:opacity-60">Clear selection</button></div>
          <ul className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
            {photos.map((photo) => <li key={photo.file.name} className="min-w-0 overflow-hidden rounded-xl border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt={`Selected photo: ${photo.file.name}`} className="aspect-square w-full object-cover" />
              <div className="p-2"><p className="truncate text-xs" title={photo.file.name}>{photo.file.name}</p><button type="button" disabled={busy} aria-label={`Remove ${photo.file.name}`} onClick={() => { URL.revokeObjectURL(photo.preview); selected.current = selected.current.filter((item) => item !== photo); staged.current.clear(); setPhotos(selected.current) }} className="mt-1 text-xs font-semibold text-red-600 disabled:opacity-60">Remove</button></div>
            </li>)}
          </ul>
        </div>}
        {busy && progress > 0 && <progress aria-label="Photos uploaded" value={progress} max={photos.length || 1} className="h-2 w-full accent-brand" />}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy || !connected || !photos.length} className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Working…" : "Publish photo portfolio"}</button>
          <a href="/portfolio#images" target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 underline">View portfolio ↗</a>
        </div>
      </form>
      {message && <p role={error ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-700"}`}>{message}</p>}
      {commitUrl && <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold underline">View saved photos on GitHub ↗</a>}
      {products.length > 0 && <div className="mt-5 border-t border-neutral-200 pt-4"><p className="text-sm font-medium">Add to an existing portfolio</p><div className="mt-3 flex flex-wrap gap-2">{products.map((product) => <button key={product.name} type="button" disabled={busy} onClick={() => { setName(product.name); staged.current.clear() }} className="max-w-full truncate rounded-full border border-neutral-300 px-3 py-2 text-xs disabled:opacity-60">{product.name} · {product.images.length} photos</button>)}</div></div>}
    </section>
  )
}
