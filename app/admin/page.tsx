import { isAdmin } from "@/lib/admin"
import { listVideos, loadProducts } from "@/lib/media"
import { listPosts, listTrashedPosts } from "@/lib/blog"
import { AdminLogin } from "@/components/admin-login"
import { AdminPanel } from "@/components/admin-panel"
import { listYouTubeVideos } from "@/lib/youtube-videos"

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
    listYouTubeVideos(),
  ])
  return (
    <AdminPanel
      videos={videos}
      products={products}
      posts={posts}
      trashedPosts={trashedPosts}
      blobEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
      youtubeVideos={youtubeVideos}
    />
  )
}
