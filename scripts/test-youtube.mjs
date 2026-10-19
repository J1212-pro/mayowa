import assert from "node:assert/strict"
import { test } from "node:test"
import { isYouTubeVideo, parseYouTubeId } from "../lib/youtube.ts"

const id = "M7lc1UVf-VE"

test("accepts YouTube watch, share, mobile, live, Shorts, and embed links", () => {
  const links = [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?feature=shared&v=${id}&t=42`,
    `https://youtu.be/${id}?si=example&t=42`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://music.youtube.com/watch?v=${id}`,
    `https://youtube.com/shorts/${id}`,
    `https://youtube.com/live/${id}`,
    `https://youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `  youtube.com/watch?v=${id}  `,
    `youtu.be/${id}`,
  ]
  for (const link of links) assert.equal(parseYouTubeId(link), id, link)
})

test("rejects unsafe hosts, non-video links, and invalid IDs", () => {
  const links = [
    "", null, 123, {}, id,
    `https://evil.example/watch?v=${id}`,
    `https://youtube.com.evil.example/watch?v=${id}`,
    `https://youtube.com@evil.example/watch?v=${id}`,
    `https://user@youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}/extra`,
    `https://youtube.com:8080/watch?v=${id}`,
    "https://youtube.com/playlist?list=PL123",
    "https://youtube.com/@channel",
    "https://youtube.com/watch?v=short",
    "https://youtube.com/watch?v=12345678901<script>",
    "javascript:alert(1)",
    "https://youtube.com/redirect?q=https://example.com",
    `ftp://youtube.com/watch?v=${id}`,
    "x".repeat(2049),
  ]
  for (const link of links) assert.equal(parseYouTubeId(link), null, String(link))
})

test("only valid stored video records can become portfolio embeds", () => {
  const video = { id, title: "Brand story", addedAt: "2026-10-19T00:00:00.000Z" }
  assert.equal(isYouTubeVideo(video), true)
  for (const invalid of [null, {}, { ...video, id: "../outside" }, { ...video, title: " " }, { ...video, title: "x".repeat(121) }, { ...video, addedAt: "invalid" }]) {
    assert.equal(isYouTubeVideo(invalid), false)
  }
})
