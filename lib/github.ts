// Store admin uploads as commits in the GitHub repo. On Vercel the disk is
// read-only, so files are committed via the GitHub Contents API instead —
// each upload/delete triggers a redeploy that ships the new media.

const REPO = process.env.GITHUB_REPO || "J1212-pro/mayowa"
const BRANCH = process.env.GITHUB_BRANCH || "master"

export function hasGithub(): boolean {
  return !!process.env.GITHUB_TOKEN
}

/** True when running on Vercel (read-only disk) with a token configured. */
export function useGithubStorage(): boolean {
  return !!process.env.VERCEL && hasGithub()
}

function encodePath(repoPath: string): string {
  return repoPath.split("/").map(encodeURIComponent).join("/")
}

async function gh(pathname: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com/repos/${REPO}/${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })
}

async function getFileSha(repoPath: string): Promise<string | null> {
  const res = await gh(`contents/${encodePath(repoPath)}?ref=${BRANCH}`)
  if (!res.ok) return null
  const data = await res.json()
  return typeof data?.sha === "string" ? data.sha : null
}

export async function githubPutFile(repoPath: string, bytes: Buffer, message: string): Promise<void> {
  const sha = await getFileSha(repoPath)
  const res = await gh(`contents/${encodePath(repoPath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: bytes.toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`GitHub save failed (${res.status}): ${data?.message || "unknown error"}`)
  }
}

export async function githubDeleteFile(repoPath: string, message: string): Promise<boolean> {
  const sha = await getFileSha(repoPath)
  if (!sha) return false
  const res = await gh(`contents/${encodePath(repoPath)}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  })
  return res.ok
}

/** Delete every file in a repo folder (GitHub has no folder delete). */
export async function githubDeleteDir(repoPath: string, message: string): Promise<boolean> {
  const res = await gh(`contents/${encodePath(repoPath)}?ref=${BRANCH}`)
  if (!res.ok) return false
  const entries = await res.json()
  if (!Array.isArray(entries)) return false
  let ok = true
  for (const entry of entries) {
    if (entry?.type === "file" && typeof entry?.path === "string") {
      const deleted = await githubDeleteFile(entry.path, message)
      ok = ok && deleted
    }
  }
  return ok
}
