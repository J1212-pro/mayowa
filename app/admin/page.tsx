import { isAdmin } from "@/lib/admin"
import { listVideos, loadProducts } from "@/lib/media"
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

  return <AdminPanel videos={listVideos()} products={loadProducts()} />
}
