import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin"

// Called by the admin panel after direct-to-storage uploads so the cached
// public pages rebuild immediately instead of waiting out the revalidate window.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }
  revalidatePath("/", "layout")
  return NextResponse.json({ ok: true })
}
