// Defense-in-depth cleaning for blog post HTML (admin-written or AI-generated)
// before it is injected into the page. Removes anything that can run code.

const DANGEROUS_BLOCKS = ["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "textarea", "select", "form"]
const DANGEROUS_SINGLE = ["script", "iframe", "object", "embed", "link", "meta", "base", "input", "button", "frame", "frameset", "applet", "svg", "math", "form", "style"]

export function sanitizeHtml(html: string): string {
  let out = html
  // Drop HTML comments (can hide conditional tricks).
  out = out.replace(/<!--[\s\S]*?-->/g, "")
  // Remove dangerous elements together with their content.
  for (const tag of DANGEROUS_BLOCKS) {
    out = out.replace(new RegExp(`<\\s*${tag}\\b[\\s\\S]*?<\\s*/\\s*${tag}\\s*>`, "gi"), "")
  }
  // Remove any leftover opening/closing/self-closing dangerous tags.
  for (const tag of DANGEROUS_SINGLE) {
    out = out.replace(new RegExp(`<\\s*/?\\s*${tag}\\b[^>]*>`, "gi"), "")
  }
  // Strip event handlers (onclick=, onerror=, ...) and inline styles.
  out = out.replace(/\s(?:on[a-z]+|style|srcdoc|formaction)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  // Neutralise script-capable URLs in links and media.
  out = out.replace(
    /\s(href|src|xlink:href|action|poster|background)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attr: string, _q, dq?: string, sq?: string, bare?: string) => {
      const value = (dq ?? sq ?? bare ?? "").replace(/[\u0000-\u0020]|&#0*9;|&#0*10;|&#0*13;|&Tab;|&NewLine;/gi, "").toLowerCase()
      if (/^(javascript|vbscript|data):/.test(value) || /^&#/.test(value)) return ` ${attr}="#"`
      return match
    },
  )
  return out
}

/** JSON for a <script type="application/ld+json"> tag, safe against "</script>" breakouts. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
}
