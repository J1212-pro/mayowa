import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { createRequire } from "node:module"
import { test } from "node:test"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const { zipSync } = require("fflate")
const root = process.cwd()
const cache = new Map()
let signedIn = true
let githubFetch = async () => { throw new Error("Unexpected GitHub request") }
const environment = { ADMIN_PASSWORD: "test-only-password", GITHUB_TOKEN: "test-only-token" }

// Load the real TypeScript modules with only network and framework boundaries replaced.
function load(relative) {
  const file = path.resolve(root, relative)
  if (cache.has(file)) return cache.get(file).exports
  const loadedModule = { exports: {} }
  cache.set(file, loadedModule)
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  vm.runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports, Buffer, File, Blob, FormData, Request, Response, Uint8Array, AbortSignal, crypto, console,
    process: { env: environment },
    fetch: (...args) => githubFetch(...args),
    require: (name) => {
      if (name === "next/server") return { NextResponse: { json: (data, init) => Response.json(data, init) } }
      if (name === "@/lib/admin") return { isAdmin: async () => signedIn }
      if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`)
      if (name.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(file), `${name}.ts`)))
      return require(name)
    },
  }, { filename: file })
  return loadedModule.exports
}

const names = load("lib/portfolio-images.ts")
const { extractPhotos } = load("lib/prepare-portfolio-images.ts")
const tickets = load("lib/portfolio-photo-ticket.ts")
const github = load("lib/github.ts")
const route = load("app/api/admin/portfolio-images/route.ts")
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const sha = "a".repeat(40)
const request = (body) => new Request("https://example.test/api/admin/portfolio-images", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })

test("portfolio names preserve existing punctuation and reject traversal and reserved names", () => {
  assert.equal(names.portfolioName("  FYNE [BODY]  "), "FYNE [BODY]")
  assert.equal(names.portfolioName("Été campaign"), "Été campaign")
  for (const name of ["../outside", "..", ".hidden", "a/b", "a\\b", "CON", "campaign.", "", "a".repeat(81)]) assert.throws(() => names.portfolioName(name))
})

test("ZIP extracts nested photos and skips hidden files, traversal and non-images", async () => {
  const zip = zipSync({ "campaign/one.png": png, "campaign/two.JPG": png, "__MACOSX/._one.png": png, "../outside.png": png, "campaign/readme.txt": png })
  const result = await extractPhotos([new File([zip], "campaign.zip")])
  assert.equal(result.photos.map((file) => file.name).join(","), "one.png,two.JPG")
  assert.equal(result.skipped, 3)
})

test("multiple photos and ZIP files combine in one selection", async () => {
  const zip = zipSync({ "two.png": png })
  const result = await extractPhotos([new File([png], "one.png"), new File([zip], "photos.zip")])
  assert.equal(result.photos.length, 2)
})

test("empty or corrupt ZIP and too many photos are rejected", async () => {
  await assert.rejects(extractPhotos([new File([zipSync({})], "empty.zip")]), /No supported photos/)
  await assert.rejects(extractPhotos([new File(["not a zip"], "broken.zip")]), /could not be opened/)
  const entries = Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`${index}.png`, png]))
  await assert.rejects(extractPhotos([new File([zipSync(entries)], "many.zip")]), /up to 100/)
})

test("oversized ZIP entries are rejected before decompression", async () => {
  const archive = zipSync({ "large.png": png })
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength)
  for (let offset = 0; offset + 28 < archive.length; offset++) {
    if (view.getUint32(offset, true) === 0x02014b50) {
      view.setUint32(offset + 24, names.MAX_EXTRACTED_BYTES + 1, true)
      break
    }
  }
  await assert.rejects(extractPhotos([new File([archive], "large.zip")]), /250 MB/)
})

test("upload receipts cannot be moved to a different name, folder or Git blob", () => {
  const photo = { name: "one.png", sha, ticket: tickets.photoTicket("Campaign", "one.png", sha) }
  assert.equal(tickets.verifyPhotoTicket("Campaign", photo), true)
  assert.equal(tickets.verifyPhotoTicket("Other campaign", photo), false)
  assert.equal(tickets.verifyPhotoTicket("Campaign", { ...photo, name: "other.png" }), false)
  assert.equal(tickets.verifyPhotoTicket("Campaign", { ...photo, sha: "b".repeat(40) }), false)
  assert.equal(tickets.verifyPhotoTicket("Campaign", { ...photo, ticket: tickets.photoTicket("Campaign", "one.png", sha, Date.now() - 1) }), false)
})

test("signed-out upload attempts are denied before any GitHub request", async () => {
  signedIn = false
  assert.equal((await route.POST(request({}))).status, 401)
  signedIn = true
})

test("an invalid publishing connection gives a useful error without writing to disk", async () => {
  delete environment.GITHUB_TOKEN
  assert.equal((await route.POST(request({}))).status, 503)
  environment.GITHUB_TOKEN = "test-only-token"
})

test("photo content is validated before it reaches GitHub", async () => {
  const form = new FormData()
  form.set("name", "Campaign")
  form.set("file", new File(["not a photo"], "photo.png"))
  const result = await route.POST(new Request("https://example.test", { method: "POST", body: form }))
  assert.equal(result.status, 400)
})

test("upload stages a file without publishing, then the whole set publishes in one commit", async () => {
  const calls = []
  githubFetch = async (url, init) => {
    const endpoint = new URL(url).pathname.split("/mayowa/")[1]
    const body = init?.body ? JSON.parse(init.body) : null
    calls.push({ endpoint, body })
    const replies = {
      "git/blobs": { sha },
      "git/ref/heads/master": { object: { sha: "base" } },
      "git/commits/base": { tree: { sha: "base-tree" } },
      "git/trees": { sha: "new-tree" },
      "git/commits": { sha: "new-commit" },
      "git/refs/heads/master": {},
    }
    assert.ok(endpoint in replies, endpoint)
    return Response.json(replies[endpoint])
  }
  const form = new FormData()
  form.set("name", "FYNE [BODY]")
  form.set("file", new File([png], "one.png"))
  const staged = await route.POST(new Request("https://example.test", { method: "POST", body: form }))
  assert.equal(staged.status, 200)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].endpoint, "git/blobs")
  const photo = await staged.json()
  const second = { name: "two.png", sha, ticket: tickets.photoTicket("FYNE [BODY]", "two.png", sha) }
  const result = await route.POST(request({ name: "FYNE [BODY]", photos: [photo, second] }))
  assert.equal(result.status, 200)
  assert.equal((await result.json()).count, 2)
  assert.equal(calls.filter((call) => call.endpoint === "git/commits").length, 1)
  const tree = calls.find((call) => call.endpoint === "git/trees").body
  assert.equal(tree.base_tree, "base-tree")
  assert.equal(tree.tree[0].path, "public/images/FYNE [BODY]/one.png")
  assert.equal(tree.tree.length, 2)
  assert.equal(calls.at(-1).body.force, false)
})

test("duplicate files and forged upload receipts cannot publish", async () => {
  const photo = { name: "one.png", sha, ticket: "forged" }
  assert.equal((await route.POST(request({ name: "Campaign", photos: [photo, photo] }))).status, 400)
  assert.equal((await route.POST(request({ name: "Campaign", photos: [photo] }))).status, 400)
})

test("publishing retries branch races using the latest tree without force pushing", async () => {
  let attempt = 0
  const trees = []
  githubFetch = async (url, init) => {
    const endpoint = new URL(url).pathname.split("/mayowa/")[1]
    if (endpoint === "git/ref/heads/master") { attempt++; return Response.json({ object: { sha: `base-${attempt}` } }) }
    if (endpoint.startsWith("git/commits/base-")) return Response.json({ tree: { sha: `tree-${attempt}` } })
    if (endpoint === "git/trees") { trees.push(JSON.parse(init.body)); return Response.json({ sha: "new-tree" }) }
    if (endpoint === "git/commits") return Response.json({ sha: "commit" })
    if (endpoint === "git/refs/heads/master") {
      assert.equal(JSON.parse(init.body).force, false)
      return Response.json({}, { status: attempt === 1 ? 422 : 200 })
    }
    throw new Error(endpoint)
  }
  await github.githubCommitPhotos([{ path: "public/images/Campaign/one.png", sha }], "Publish")
  assert.equal(attempt, 2)
  assert.equal(trees[1].base_tree, "tree-2")
})

test("GitHub permission failures and rate limits report actionable errors", async () => {
  githubFetch = async () => Response.json({ message: "Bad credentials" }, { status: 401 })
  await assert.rejects(github.githubStagePhoto(Buffer.from(png)), /valid connection with Contents/)
  githubFetch = async () => Response.json({ message: "Secondary rate limit" }, { status: 403 })
  await assert.rejects(github.githubStagePhoto(Buffer.from(png)), /Wait a minute/)
})
