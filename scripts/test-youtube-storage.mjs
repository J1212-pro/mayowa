import assert from "node:assert/strict"
import { test } from "node:test"
import { createYouTubeStorage, YouTubeStorageError } from "../lib/youtube-storage.ts"

const video = { id: "ojQerxLItg8", title: "Portfolio video", addedAt: "2026-10-19T00:00:00.000Z" }
const other = { id: "M7lc1UVf-VE", title: "Another video", addedAt: "2026-10-18T00:00:00.000Z" }
const ignore = () => {}

function backend(name, initial = []) {
  const records = new Map(initial.map((record) => [record.id, record]))
  return {
    name,
    list: async () => [...records.values()],
    save: async (record) => { records.set(record.id, record) },
    remove: async (id) => { records.delete(id) },
  }
}

test("a failed Blob connection does not block publishing a link through GitHub", async () => {
  const github = backend("GitHub")
  const blob = backend("Blob")
  blob.list = async () => { throw new Error("Blob unavailable") }
  blob.save = async () => { throw new Error("Blob write unavailable") }
  const storage = createYouTubeStorage([github, blob], ignore)
  assert.deepEqual(await storage.list(), [])
  await storage.save(video)
  assert.deepEqual(await storage.list(), [video])
})

test("an expired GitHub connection falls back to Blob for both saving and reading", async () => {
  const github = backend("GitHub")
  github.list = async () => { throw new Error("Unauthorized") }
  github.save = async () => { throw new Error("Unauthorized") }
  const storage = createYouTubeStorage([github, backend("Blob")], ignore)
  await storage.save(video)
  assert.deepEqual(await storage.list(), [video])
})

test("existing Blob videos survive and duplicate copies appear only once", async () => {
  const storage = createYouTubeStorage([
    backend("GitHub", [video]),
    backend("Blob", [{ ...video, title: "Old title" }, other]),
  ], ignore)
  assert.deepEqual(await storage.list(), [video, other])
  await storage.remove(video.id)
  assert.deepEqual(await storage.list(), [other])
})

test("all failed writes report failure instead of pretending a link was published", async () => {
  const sources = [backend("GitHub"), backend("Blob")]
  for (const source of sources) source.save = async () => { throw new Error("Write failed") }
  const storage = createYouTubeStorage(sources, ignore)
  await assert.rejects(storage.save(video), YouTubeStorageError)
  assert.deepEqual(await storage.list(), [])
})

test("removal does not succeed while an unreadable copy could later reappear", async () => {
  const github = backend("GitHub", [video])
  const blob = backend("Blob", [video])
  blob.list = async () => { throw new Error("Temporarily unavailable") }
  const storage = createYouTubeStorage([github, blob], ignore)
  await assert.rejects(storage.remove(video.id), YouTubeStorageError)
  assert.deepEqual(await github.list(), [video])
})

test("a deployment without any persistent connection reports configuration failure", async () => {
  const storage = createYouTubeStorage([], ignore)
  await assert.rejects(storage.save(video), /Connect GitHub or Vercel Blob/)
  await assert.rejects(storage.list(), YouTubeStorageError)
})
