import { isAdmin } from "@/lib/admin"
import { listVideos, loadProducts } from "@/lib/media"
import { listPosts, listTrashedPosts } from "@/lib/blog"
import { AdminLogin } from "@/components/admin-login"
import { AdminPanel } from "@/components/admin-panel"
import { listYouTubeVideos } from "@/lib/youtube-videos"
import { portfolioYouTubeVideos } from "@/lib/portfolio-youtube"
import { hasGithub } from "@/lib/github"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin | MAYOWA",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const authed = await isAdmin()

  if (!authed) {
    return <AdminLogin />
  }

  const [videos, products, posts, trashedPosts, youtubeVideos] = await Promise.all([
    listVideos(),
    loadProducts(),
    listPosts(),
    listTrashedPosts(),
    listYouTubeVideos().then((videos) => ({ videos, available: true })).catch(() => ({ videos: [], available: false })),
  ])
  return (
    <AdminPanel
      videos={videos}
      products={products}
      posts={posts}
      trashedPosts={trashedPosts}
      blobEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
      githubConnected={hasGithub()}
      youtubeVideos={[...new Map([...portfolioYouTubeVideos, ...youtubeVideos.videos].map((video) => [video.id, video])).values()]}
      publishing={{ available: youtubeVideos.available, repo: process.env.GITHUB_REPO || "J1212-pro/mayowa", branch: process.env.GITHUB_BRANCH || "master" }}
    />
  )
}
