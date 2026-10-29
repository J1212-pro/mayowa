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
    signal: AbortSignal.timeout(8000),
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

/** Read small JSON records from the current branch, including recent admin edits. */
export async function githubReadJsonFiles(repoDir: string): Promise<unknown[]> {
  const ref = encodeURIComponent(BRANCH)
  const res = await gh(`contents/${encodePath(repoDir)}?ref=${ref}`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Could not load YouTube videos from GitHub (${res.status}).`)
  const entries = await res.json()
  if (!Array.isArray(entries)) throw new Error("Invalid YouTube video folder in GitHub.")
  return Promise.all(entries
    .filter((entry) => entry.type === "file" && typeof entry.path === "string" && entry.path.endsWith(".json"))
    .map(async (entry) => {
      const fileRes = await gh(`contents/${encodePath(entry.path)}?ref=${ref}`)
      if (!fileRes.ok) throw new Error(`Could not read a YouTube video from GitHub (${fileRes.status}).`)
      const file = await fileRes.json()
      if (file.encoding !== "base64" || typeof file.content !== "string") throw new Error("Invalid YouTube video record.")
      return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"))
    }))
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

async function githubJson(pathname: string, init?: RequestInit) {
  const response = await gh(pathname, { ...init, signal: AbortSignal.timeout(30000) })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    if (response.status === 429 || response.headers.get("retry-after") || /rate limit/i.test(String(detail?.message))) {
      throw new Error("GitHub is temporarily limiting uploads. Wait a minute, then try again; your selected photos are still ready.")
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("GitHub publishing needs a valid connection with Contents read and write access to this repository. Your photos have not been published.")
    }
    throw new Error(`GitHub could not save this portfolio (${response.status}). Try again shortly.`)
  }
  return response.json()
}

export async function githubStagePhoto(bytes: Buffer): Promise<string> {
  const blob = await githubJson("git/blobs", {
    method: "POST",
    body: JSON.stringify({ content: bytes.toString("base64"), encoding: "base64" }),
  })
  if (!/^[a-f0-9]{40}$/.test(blob.sha)) throw new Error("GitHub returned an invalid file receipt.")
  return blob.sha
}

/** Publish a whole gallery in one commit; retry branch races without overwriting other work. */
export async function githubCommitPhotos(files: { path: string; sha: string }[], message: string): Promise<{ sha: string; url: string }> {
  const branchPath = BRANCH.split("/").map(encodeURIComponent).join("/")
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await githubJson(`git/ref/heads/${branchPath}`)
    const parent = await githubJson(`git/commits/${ref.object.sha}`)
    const tree = await githubJson("git/trees", {
      method: "POST",
      body: JSON.stringify({ base_tree: parent.tree.sha, tree: files.map((file) => ({ ...file, mode: "100644", type: "blob" })) }),
    })
    const commit = await githubJson("git/commits", {
      method: "POST",
      body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }),
    })
    const updated = await gh(`git/refs/heads/${branchPath}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    })
    if (updated.ok) return { sha: commit.sha, url: `https://github.com/${REPO}/commit/${commit.sha}` }
    if (![409, 422].includes(updated.status)) throw new Error(`GitHub could not publish this portfolio (${updated.status}). Your site has not changed.`)
  }
  throw new Error("The repository changed while publishing. Try publishing again; your selected photos are still ready.")
}
