import nodemailer from "nodemailer"
import { EMAIL } from "@/lib/contact"

// Direct sending through the site's own Zoho mailbox. Configure in the host:
//   ZOHO_USER         — the full mailbox address (e.g. connect@mayowaai.online)
//   ZOHO_APP_PASSWORD — an app password generated in Zoho (not the login password)
//   ZOHO_SMTP_HOST    — optional, defaults to smtp.zoho.com (use smtp.zoho.eu etc. if your account is regional)
// When unset, callers fall back to FormSubmit.

export function hasZoho(): boolean {
  return !!process.env.ZOHO_USER && !!process.env.ZOHO_APP_PASSWORD
}

export async function sendViaZoho(subject: string, text: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_USER,
      pass: process.env.ZOHO_APP_PASSWORD,
    },
  })
  await transporter.sendMail({
    from: `"MAYOWA website" <${process.env.ZOHO_USER}>`,
    to: EMAIL,
    subject,
    text,
  })
}
