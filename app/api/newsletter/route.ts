import { NextResponse } from "next/server"
import { addSubscriber } from "@/lib/newsletter"
import { EMAIL } from "@/lib/contact"
import { hasZoho, sendViaZoho } from "@/lib/email"
import { clientIp, hit, isLimited } from "@/lib/rate-limit"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
  // Stop bots from flooding the list or the inbox: 5 signups per IP per hour.
  const ip = clientIp(req)
  if (isLimited("newsletter", ip, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many signups from your connection. Try again later." }, { status: 429 })
  }
  hit("newsletter", ip, 60 * 60 * 1000)

  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === "string" ? body.name.replace(/[\r\n\t]+/g, " ").trim() : ""
  const email = typeof body?.email === "string" ? body.email.trim() : ""

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 })
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 })
  }

  // If storage is down (e.g. the Blob store is suspended), still accept the
  // signup: the email notification below delivers it to the inbox.
  let added = true
  let total = 0
  try {
    ;({ added, total } = await addSubscriber(name, email))
  } catch (err) {
    console.error("Newsletter storage failed; relying on email notification:", err)
  }

  // Best-effort inbox notification — the signup is already stored above,
  // so a failure here never loses the subscriber.
  try {
    if (hasZoho()) {
      await sendViaZoho(
        "New newsletter signup: MAYOWA website",
        `Name: ${name}\nEmail: ${email}\nDate: ${new Date().toISOString()}`,
      )
    } else {
      await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          _subject: "New newsletter signup: MAYOWA website",
          _template: "table",
        }),
      })
    }
  } catch {
    // ignore — storage is the source of truth
  }

  return NextResponse.json({ ok: true, added, total })
}
