This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Portfolio video links

In `/admin`, use **Portfolio video links**. Choose YouTube or a direct public HTTPS MP4/WebM URL, paste the link, and choose portrait (9:16) or landscape (16:9). A title is optional; YouTube titles are fetched automatically when available. Shorts links select portrait by default. Published videos share one masonry gallery, keeping their selected proportions.

The initial page uses small preview images. A player is only loaded when Play is pressed, and the portfolio allows one active player at a time. YouTube may display channel identity, Like/Share and other controls during playback; its supported settings cannot fully remove these. Use original video files or direct video URLs for playback without YouTube branding.

Use a public or unlisted video with embedding enabled. Standard watch links, `youtu.be` share links, mobile links, Shorts, live-video links, and embed links are accepted. No YouTube API key is needed.

With a working `GITHUB_TOKEN` or `BLOB_READ_WRITE_TOKEN`, **Add to portfolio** saves the small video record automatically. If both connections fail, the admin provides **Continue publishing on GitHub**. That link opens a prepared file: sign in to GitHub, choose **Commit changes**, and wait for Vercel's deployment. Preparing the link does not publish it. This fallback needs repository write access but no API token or Blob store. Nothing is uploaded to YouTube by this form.

Repository records live in `data/youtube-videos/`. The prebuild script generates `lib/youtube-manifest.json` so those links remain available even during a storage outage. Use **Edit on GitHub** for repository records; editing/deleting their file takes effect after redeployment. **Remove** handles records available only through the live connection. Videos themselves remain at their original host.

Local media previews are in `public/video-previews/`, with dimensions in `lib/video-previews.json`. Regenerate them after adding repository videos using `node scripts/generate-video-previews.mjs /path/to/ffmpeg`. Commit the generated files; production builds do not need FFmpeg. Video files are not downloaded until playback. Product and hero images use Next.js image optimization, and the homepage background uses CSS rather than WebGL.

Run validation and publishing-fallback checks with Node 22.18+ or Node 24: `node --test scripts/test-youtube.mjs scripts/test-youtube-storage.mjs scripts/test-portfolio-links.mjs`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
