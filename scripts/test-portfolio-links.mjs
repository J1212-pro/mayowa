import assert from "node:assert/strict"
import { test } from "node:test"
import { isDirectVideoUrl, isYouTubeVideo } from "../lib/youtube.ts"
import { githubPublishUrl } from "../lib/github-publish.ts"

const record = { id: "123456789ab", title: "Brand film", addedAt: "2026-10-25T00:00:00.000Z", source: "file", videoUrl: "https://media.example.com/film.mp4", format: "video" }

test("direct playback only accepts HTTPS MP4 and WebM files", () => {
  assert.equal(isDirectVideoUrl(record.videoUrl), true)
  assert.equal(isDirectVideoUrl("https://media.example.com/film.webm?version=2"), true)
  for (const url of ["javascript:alert(1)", "http://media.example.com/film.mp4", "https://user:secret@media.example.com/film.mp4", "https://youtube.com/watch?v=123", "https://media.example.com/file.html", null]) {
    assert.equal(isDirectVideoUrl(url), false)
  }
})

test("published records validate the source, URL and chosen aspect ratio", () => {
  assert.equal(isYouTubeVideo(record), true)
  assert.equal(isYouTubeVideo({ ...record, format: "short" }), true)
  assert.equal(isYouTubeVideo({ ...record, videoUrl: undefined }), false)
  assert.equal(isYouTubeVideo({ ...record, source: "unknown" }), false)
  assert.equal(isYouTubeVideo({ ...record, format: "unknown" }), false)
})

test("GitHub fallback preserves the complete record without claiming it is saved", () => {
  const url = new URL(githubPublishUrl(record, "J1212-pro/mayowa", "master"))
  assert.equal(url.origin, "https://github.com")
  assert.equal(url.pathname, "/J1212-pro/mayowa/new/master")
  assert.equal(url.searchParams.get("filename"), `data/youtube-videos/${record.id}.json`)
  assert.deepEqual(JSON.parse(url.searchParams.get("value")), record)
})
