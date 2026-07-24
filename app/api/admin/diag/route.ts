import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"
import { hasZoho } from "@/lib/email"
import { hasGithub } from "@/lib/github"

// Admin-only configuration check. Reports which integrations are set up —
// booleans only, never secret values.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  return NextResponse.json({
    runningOnVercel: !!process.env.VERCEL,
    subscriberStorageConnected: !!process.env.BLOB_READ_WRITE_TOKEN,
    zohoEmailConfigured: hasZoho(),
    githubUploadsConfigured: hasGithub(),
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "(not set — using built-in default)",
    gaConfigured: !!process.env.NEXT_PUBLIC_GA_ID,
  })
}
