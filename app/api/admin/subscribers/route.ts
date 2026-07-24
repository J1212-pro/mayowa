import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"
import { listSubscribers, subscribersCsv } from "@/lib/newsletter"

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const subs = await listSubscribers()
  const format = new URL(req.url).searchParams.get("format")

  if (format === "csv") {
    return new NextResponse(subscribersCsv(subs), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mayowa-subscribers.csv"',
        "Cache-Control": "no-store",
      },
    })
  }

  return NextResponse.json({ total: subs.length, subscribers: subs })
}
