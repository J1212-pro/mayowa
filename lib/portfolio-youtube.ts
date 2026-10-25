import records from "./youtube-manifest.json"
import { isYouTubeVideo, type YouTubeVideo } from "./youtube"

export type PortfolioYouTubeVideo = YouTubeVideo

// Built from repository records so publishing does not depend on cloud storage.
export const portfolioYouTubeVideos = (records as unknown[]).filter(isYouTubeVideo)
