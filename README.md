This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## YouTube portfolio videos

Sign in at `/admin`, find **YouTube videos**, paste a video link, enter its portfolio title, and choose **Add to portfolio**. The video appears in the **Long-form videos** section of `/portfolio`. **Remove** takes it off the portfolio without deleting it from YouTube.

Use a public or unlisted video with embedding enabled. Standard watch links, `youtu.be` share links, mobile links, Shorts, live-video links, and embed links are accepted. No YouTube API key is needed.

Records use the existing `BLOB_READ_WRITE_TOKEN` storage when configured. On Vercel, `GITHUB_TOKEN` is the fallback (using `GITHUB_REPO` and `GITHUB_BRANCH`); records are read directly from GitHub so changes appear without waiting for a redeploy. Local development saves records in `data/youtube-videos/`. Saving on Vercel requires one of these persistent storage connections.

Run link-validation checks with Node 22.18+ or Node 24: `node --test scripts/test-youtube.mjs`.

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
