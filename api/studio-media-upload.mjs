import { randomUUID } from "node:crypto";
import { isStudioSessionAuthenticated } from "./studio-access.mjs";

const REPOSITORY = "massyne168/portfolio-massyne";
const GITHUB_API = "https://api.github.com";
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_FILES = 12;
const IMAGE_TYPES = {
  "image/png": { extension: "png" },
  "image/jpeg": { extension: "jpg" },
  "image/webp": { extension: "webp" },
  "image/gif": { extension: "gif" }
};

function send(res, status, body) {
  return res.status(status).json(body);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

function originAllowed(req) {
  const headers = req.headers || {};
  const origin = String(headers.origin || "");
  const host = String(headers.host || "");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch (_) {
    return false;
  }
}

function safeBaseName(name) {
  const basename = String(name || "artwork").replace(/\\/g, "/").split("/").pop();
  const withoutExtension = basename.replace(/\.[^.]*$/, "");
  const safe = withoutExtension.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return safe || "artwork";
}

function matchesImageType(bytes, mimeType) {
  if (mimeType === "image/png") {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/gif") {
    const signature = bytes.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12
      && bytes.subarray(0, 4).toString("ascii") === "RIFF"
      && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

function validateFiles(inputFiles) {
  if (!Array.isArray(inputFiles) || inputFiles.length < 1 || inputFiles.length > MAX_FILES) {
    const error = new Error("Choose between 1 and 12 images.");
    error.status = 400;
    throw error;
  }

  let totalBytes = 0;
  return inputFiles.map(file => {
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      const error = new Error("One of the selected files is invalid.");
      error.status = 400;
      throw error;
    }
    const mimeType = String(file.type || "").toLowerCase();
    const typeInfo = IMAGE_TYPES[mimeType];
    if (!typeInfo) {
      const error = new Error("Upload PNG, JPG, WEBP or GIF images only.");
      error.status = 400;
      throw error;
    }
    const base64 = String(file.base64 || "");
    if (!base64 || base64.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 8 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
      const error = new Error("One of the selected images could not be read.");
      error.status = 400;
      throw error;
    }
    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length || bytes.toString("base64") !== base64 || !matchesImageType(bytes, mimeType)) {
      const error = new Error("One of the selected files does not match its image type.");
      error.status = 400;
      throw error;
    }
    totalBytes += bytes.length;
    if (totalBytes > MAX_UPLOAD_BYTES) {
      const error = new Error("Keep image uploads under 3 MB total per save.");
      error.status = 413;
      throw error;
    }
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBaseName(file.name)}.${typeInfo.extension}`;
    return {
      path: `images/studio-uploads/${filename}`,
      base64
    };
  });
}

async function githubRequest(token, path, options = {}) {
  const response = await fetch(GITHUB_API + path, {
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

async function createMediaCommit(token, files) {
  const ref = await githubRequest(token, "/repos/" + REPOSITORY + "/git/ref/heads/main");
  const parent = ref.object?.sha;
  if (!parent) throw new Error("GitHub could not read the main branch.");
  const current = await githubRequest(token, "/repos/" + REPOSITORY + "/git/commits/" + parent);
  const blobs = await Promise.all(files.map(async file => {
    const blob = await githubRequest(token, "/repos/" + REPOSITORY + "/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: file.base64, encoding: "base64" })
    });
    return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
  }));
  const tree = await githubRequest(token, "/repos/" + REPOSITORY + "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: current.tree.sha, tree: blobs })
  });
  const commit = await githubRequest(token, "/repos/" + REPOSITORY + "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: "Upload portfolio images from MASSYNE Studio",
      tree: tree.sha,
      parents: [parent]
    })
  });
  await githubRequest(token, "/repos/" + REPOSITORY + "/git/refs/heads/main", {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false })
  });
  return commit.sha;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Method not allowed." });
  }
  if (!isStudioSessionAuthenticated(req)) {
    return send(res, 401, { message: "Open MASSYNE Studio again to continue." });
  }
  if (!originAllowed(req)) {
    return send(res, 403, { message: "Access denied." });
  }
  const token = String(process.env.MASSYNE_STUDIO_GITHUB_TOKEN || "").trim();
  if (!token) {
    return send(res, 503, { message: "GitHub publishing is not configured in Vercel yet." });
  }

  let files;
  try {
    files = validateFiles(readBody(req).files);
  } catch (error) {
    return send(res, error.status || 400, { message: error.message || "The selected images are invalid." });
  }

  try {
    const commit = await createMediaCommit(token, files);
    return send(res, 200, {
      ok: true,
      commit,
      files: files.map(file => ({ path: "/" + file.path }))
    });
  } catch (error) {
    if (error.status === 409 || error.status === 422) {
      return send(res, 409, { message: "The main branch changed while uploading. Refresh Studio and try again." });
    }
    if ([401, 403].includes(error.status)) {
      return send(res, 503, { message: "The Vercel GitHub token needs repository Contents: Read and write access." });
    }
    return send(res, 502, { message: "GitHub could not save these images. Try again." });
  }
}
