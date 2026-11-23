import { isStudioSessionAuthenticated } from "./studio-access.mjs";
import { getStudioBranch, assertStudioWriteAllowed } from "./_studio-branch.mjs";

const REPOSITORY = "massyne168/portfolio-massyne";
const GITHUB_API = "https://api.github.com";
const ALLOWED_EXTENSIONS = new Set([
  "html", "css", "js", "mjs", "json", "md", "txt", "xml", "yml", "yaml", "svg"
]);
const BLOCKED_DIRS = new Set([
  ".git", "node_modules", ".codex", ".gemini", ".agents", "backup"
]);

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function originAllowed(req) {
  const origin = String(req.headers.origin || "").trim();
  const host = String(req.headers.host || "").trim();
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch (_) {
    return false;
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return {}; }
}

function sanitizePath(rawPath) {
  const cleaned = String(rawPath || "").trim().replace(/^\/+/, "");
  if (!cleaned) return null;
  if (cleaned.includes("..") || cleaned.includes("\\") || cleaned.includes("\0")) return null;
  const segments = cleaned.split("/");
  for (const seg of segments) {
    const lower = seg.toLowerCase();
    if (!seg || seg === "." || seg === "..") return null;
    if (lower.startsWith(".env")) return null;
    if (BLOCKED_DIRS.has(lower)) return null;
  }
  return cleaned;
}

function isAllowedTextFile(filePath) {
  const sanitized = sanitizePath(filePath);
  if (!sanitized) return false;
  const name = sanitized.split("/").pop() || "";
  if (name.toLowerCase().startsWith(".env")) return false;
  const dot = name.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = name.slice(dot + 1).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

function encodeGitHubPath(filePath) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

async function githubRequest(token, apiPath, options = {}) {
  const response = await fetch(GITHUB_API + apiPath, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "GitHub returned " + response.status + ".");
    error.status = response.status;
    throw error;
  }
  return body;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, message: "Method not allowed." });
  }

  if (!isStudioSessionAuthenticated(req)) {
    return send(res, 401, { ok: false, connected: false, message: "Open MASSYNE Studio again to continue." });
  }

  if (!originAllowed(req)) {
    return send(res, 403, { ok: false, message: "Cross-origin request blocked." });
  }

  const token = String(process.env.MASSYNE_STUDIO_GITHUB_TOKEN || "").trim();
  if (!token) {
    return send(res, 503, { ok: false, message: "GitHub token is not configured in Vercel yet." });
  }

  try {
    const targetBranch = getStudioBranch();

    if (req.method === "GET") {
      const url = new URL(req.url || "/", "http://localhost");
      const rawPath = url.searchParams.get("path");

      // 1. Recursive Tree Listing across entire repository
      if (!rawPath) {
        const treeData = await githubRequest(
          token,
          `/repos/${REPOSITORY}/git/trees/${encodeURIComponent(targetBranch)}?recursive=1`
        );

        const tree = Array.isArray(treeData.tree) ? treeData.tree : [];
        const files = tree
          .filter(item => item && item.type === "blob" && isAllowedTextFile(item.path))
          .map(item => ({
            path: item.path,
            name: item.path.split("/").pop() || item.path,
            sha: item.sha,
            size: item.size || 0
          }))
          .sort((a, b) => a.path.localeCompare(b.path));

        return send(res, 200, {
          ok: true,
          branch: targetBranch,
          truncated: !!treeData.truncated,
          count: files.length,
          files
        });
      }

      // 2. Single File Content Request
      const filePath = sanitizePath(rawPath);
      if (!filePath || !isAllowedTextFile(filePath)) {
        return send(res, 400, { ok: false, message: "Invalid or blocked file path." });
      }

      const data = await githubRequest(
        token,
        `/repos/${REPOSITORY}/contents/${encodeGitHubPath(filePath)}?ref=${encodeURIComponent(targetBranch)}`
      );
      if (Array.isArray(data) || data.type !== "file") {
        return send(res, 400, { ok: false, message: "Requested path is not a file." });
      }

      const content = Buffer.from(String(data.content || "").replace(/\n/g, ""), "base64").toString("utf8");
      return send(res, 200, {
        ok: true,
        branch: targetBranch,
        path: data.path,
        sha: data.sha,
        size: data.size,
        content
      });
    }

    // POST: Create or Update File
    assertStudioWriteAllowed(targetBranch);

    const body = await readBody(req);
    const filePath = sanitizePath(body.path);
    if (!filePath || !isAllowedTextFile(filePath)) {
      return send(res, 400, { ok: false, message: "Invalid or blocked file path." });
    }
    if (typeof body.content !== "string") {
      return send(res, 400, { ok: false, message: "File content must be a string." });
    }
    if (Buffer.byteLength(body.content, "utf8") > 1_000_000) {
      return send(res, 413, { ok: false, message: "This file is too large to edit through Studio (1MB max)." });
    }

    const message = String(body.message || `Update ${filePath} via MASSYNE Studio Console`).trim();
    const encodedContent = Buffer.from(body.content, "utf8").toString("base64");
    const payload = {
      message,
      content: encodedContent,
      branch: targetBranch
    };

    // If sha is provided and non-empty: update existing file. If omitted: create new file.
    if (typeof body.sha === "string" && body.sha.trim()) {
      payload.sha = body.sha.trim();
    }

    const result = await githubRequest(
      token,
      `/repos/${REPOSITORY}/contents/${encodeGitHubPath(filePath)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload)
      }
    );

    return send(res, 200, {
      ok: true,
      branch: targetBranch,
      path: result.content?.path || filePath,
      sha: result.content?.sha || null,
      commitSha: result.commit?.sha || null
    });
  } catch (error) {
    return send(res, error.status || 500, {
      ok: false,
      message: error.message || "Studio files request failed."
    });
  }
}
