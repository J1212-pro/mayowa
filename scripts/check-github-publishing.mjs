// Operator check: only status codes and fixed descriptions are logged, never secrets.
const token = process.env.GITHUB_TOKEN?.trim()
const repo = process.env.GITHUB_REPO?.trim() || "J1212-pro/mayowa"
const headers = { Authorization: `Bearer ${token || ""}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" }
const descriptions = { 200: "repository readable", 201: "image staging permitted", 401: "saved credential rejected", 403: "access denied or token requires approval", 404: "repository not accessible to this token" }

if (!token) {
  console.log("GitHub publishing check: token missing")
} else {
  console.log(`GitHub publishing check: standard token format ${/^(github_pat_|gh[pousr]_)[A-Za-z0-9_]+$/.test(token) ? "recognized" : "not recognized"}`)
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(10000) })
    console.log(`GitHub publishing check: repository HTTP ${response.status} (${descriptions[response.status] || "request failed"})`)
    if (response.ok && process.argv.includes("--check-write")) {
      // An empty, unreferenced Git object checks the exact staging permission.
      // No filename, commit, branch, portfolio or deployment is created.
      const write = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: "POST", headers, body: JSON.stringify({ content: "", encoding: "base64" }), signal: AbortSignal.timeout(10000),
      })
      console.log(`GitHub publishing check: image staging HTTP ${write.status} (${descriptions[write.status] || "request failed"})`)
    }
  } catch {
    console.log("GitHub publishing check: service could not be reached")
  }
}
