import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the heavy media folders out of the serverless function bundles
  // (Vercel caps a function at 250 MB; the videos alone exceed that).
  // They are still served normally from the CDN as static files.
  outputFileTracingExcludes: {
    "*": ["./public/portfolio/**", "./public/images/**"],
  },
  async redirects() {
    return [
      {
        // Old truncated slug -> clean slug (permanent, for SEO)
        source: "/blog/the-next-wave-of-ai-video-4-game-changing-trends-dominating-",
        destination: "/blog/ai-video-trends-2026",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
