import { isAdmin } from "@/lib/admin"
import { listVideos, loadProducts } from "@/lib/media"
import { listPosts } from "@/lib/blog"
import { AdminLogin } from "@/components/admin-login"
import { AdminPanel } from "@/components/admin-panel"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin — MAYOWA",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const authed = await isAdmin()

  if (!authed) {
    return <AdminLogin />
  }

  const [videos, products, posts] = await Promise.all([listVideos(), loadProducts(), listPosts()])
  return (
    <AdminPanel
      videos={videos}
      products={products}
      posts={posts}
      blobEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
    />
  )
}
