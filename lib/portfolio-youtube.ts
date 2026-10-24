import type { YouTubeVideo } from "./youtube"

export type PortfolioYouTubeVideo = YouTubeVideo & { format?: "short" }

// These links ship with the website and do not need an admin storage connection.
export const portfolioYouTubeVideos: PortfolioYouTubeVideo[] = [
  {
    id: "ojQerxLItg8",
    title: "Botanical Balance",
    addedAt: "2026-10-24T00:00:00.000Z",
    format: "short",
  },
  {
    id: "1Pfsa3fi2ro",
    title: "All Natural Fibre product",
    addedAt: "2026-10-24T00:00:00.000Z",
    format: "short",
  },
]
