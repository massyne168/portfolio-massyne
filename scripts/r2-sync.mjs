#!/usr/bin/env node
import { createHash, createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

// Load .env.local or .env if present (without overriding existing env vars)
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(root, envFile);
  if (existsSync(envPath)) {
    try {
      const lines = readFileSync(envPath, "utf-8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
          let val = match[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[match[1]] = val;
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

const accountId = process.env.MASSYNE_R2_ACCOUNT_ID || "";
const accessKeyId = process.env.MASSYNE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.MASSYNE_R2_SECRET_ACCESS_KEY || "";
const bucket = process.env.MASSYNE_R2_BUCKET || "";
const publicUrl = (process.env.MASSYNE_R2_PUBLIC_URL || "").replace(/\/+$/, "");

const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");
const verifyUrls = process.argv.includes("--verify-urls");
const includePdfs = process.argv.includes("--include-pdfs");

const MULTIPART_THRESHOLD = 8 * 1024 * 1024; // 8 MiB
const PART_SIZE = 5 * 1024 * 1024; // 5 MiB
const MAX_RETRIES = 3;

const ALLOWED_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif",
  ".mp4", ".webm", ".mov",
  ".woff", ".woff2", ".ttf", ".otf",
  ".svg", ".mp3", ".wav"
]);
if (includePdfs) {
  ALLOWED_EXTS.add(".pdf");
}

const MIME_MAP = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf"
};

function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
function hash(val) { return createHash("sha256").update(val).digest("hex"); }
function hmac(key, val, enc) { return createHmac("sha256", key).update(val).digest(enc); }
function signingKey(secret, date) {
  return hmac(hmac(hmac(hmac("AWS4" + secret, date), "auto"), "s3"), "aws4_request");
}
function getMime(file) {
  return MIME_MAP[path.extname(file).toLowerCase()] || "application/octet-stream";
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function signRequest({ method, urlPath, queryParams = {}, headers = {}, payload = "" }) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStr = amzDate.slice(0, 8);
  const payloadHash = typeof payload === "string" ? hash(Buffer.from(payload)) : hash(payload);

  const allHeaders = {};
  for (const [k, v] of Object.entries(headers)) {
    allHeaders[k.toLowerCase()] = String(v).trim();
  }
  allHeaders["host"] = host;
  allHeaders["x-amz-date"] = amzDate;
  allHeaders["x-amz-content-sha256"] = payloadHash;

  const sortedParamKeys = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedParamKeys
    .map(k => encode(k) + "=" + encode(queryParams[k]))
    .join("&");

  const sortedHeaderKeys = Object.keys(allHeaders).sort();
  const canonicalHeaders = sortedHeaderKeys.map(k => k + ":" + allHeaders[k] + "\n").join("");
  const signedHeaders = sortedHeaderKeys.join(";");

  const canonicalRequest = [
    method,
    urlPath,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");

  const scope = `${dateStr}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, hash(canonicalRequest)].join("\n");
  const sKey = signingKey(secretAccessKey, dateStr);
  const signature = hmac(sKey, stringToSign, "hex");
  const auth = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    headers: { ...allHeaders, authorization: auth },
    fullUrl: `https://${host}${urlPath}${canonicalQueryString ? "?" + canonicalQueryString : ""}`
  };
}

async function retry(fn, desc) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const backoff = 500 * Math.pow(2, attempt - 1);
        console.warn(`[Retry ${attempt}/${MAX_RETRIES}] ${desc} failed (${err.message}). Retrying in ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }
  throw lastError;
}

const IGNORED_DIRS = new Set([
  "node_modules", ".git", ".agents", "backup", ".vercel",
  "scratch", "playwright-report", "test-results", ".codex-tmp", "chrome-cdp", "chrome-hero"
]);

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      output.push(...await walkDir(path.join(dir, entry.name)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === ".zip") continue;
      if (ALLOWED_EXTS.has(ext)) {
        const rel = path.relative(root, path.join(dir, entry.name)).split(path.sep).join("/");
        // Never sync favicons to R2 (must stay on Vercel host)
        if (rel.startsWith("images/favicon")) continue;
        output.push(path.join(dir, entry.name));
      }
    }
  }
  return output;
}

async function headObject(key) {
  const urlPath = `/${encode(bucket)}/${key.split("/").map(encode).join("/")}`;
  const req = signRequest({ method: "HEAD", urlPath });
  const res = await fetch(req.fullUrl, { method: "HEAD", headers: req.headers });
  if (res.status === 200) {
    return {
      exists: true,
      sha256: res.headers.get("x-amz-meta-sha256") || "",
      contentLength: parseInt(res.headers.get("content-length") || "0", 10),
      etag: res.headers.get("etag") || ""
    };
  }
  if (res.status === 404) return { exists: false };
  throw new Error(`HEAD failed with HTTP ${res.status}`);
}

async function putSingle(key, bytes, contentType, sha256) {
  const urlPath = `/${encode(bucket)}/${key.split("/").map(encode).join("/")}`;
  const cacheControl = "public, max-age=31536000, immutable";
  const req = signRequest({
    method: "PUT",
    urlPath,
    headers: {
      "cache-control": cacheControl,
      "content-type": contentType,
      "x-amz-meta-sha256": sha256
    },
    payload: bytes
  });

  const res = await fetch(req.fullUrl, { method: "PUT", headers: req.headers, body: bytes });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${key} failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
}

async function putMultipart(key, bytes, contentType, sha256) {
  const urlPath = `/${encode(bucket)}/${key.split("/").map(encode).join("/")}`;
  const cacheControl = "public, max-age=31536000, immutable";

  // 1. Initiate Multipart Upload
  const initReq = signRequest({
    method: "POST",
    urlPath,
    queryParams: { uploads: "" },
    headers: {
      "cache-control": cacheControl,
      "content-type": contentType,
      "x-amz-meta-sha256": sha256
    }
  });

  const initRes = await fetch(initReq.fullUrl, { method: "POST", headers: initReq.headers });
  if (!initRes.ok) {
    throw new Error(`Multipart initiate failed HTTP ${initRes.status}: ${(await initRes.text()).slice(0, 300)}`);
  }
  const initXml = await initRes.text();
  const match = initXml.match(/<UploadId>([^<]+)<\/UploadId>/);
  if (!match) throw new Error(`UploadId not found in XML response: ${initXml}`);
  const uploadId = match[1];

  try {
    // 2. Upload parts
    const parts = [];
    const totalParts = Math.ceil(bytes.length / PART_SIZE);

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, bytes.length);
      const partBytes = bytes.subarray(start, end);

      const partReq = signRequest({
        method: "PUT",
        urlPath,
        queryParams: { partNumber: String(partNumber), uploadId },
        payload: partBytes
      });

      const partRes = await retry(async () => {
        const res = await fetch(partReq.fullUrl, { method: "PUT", headers: partReq.headers, body: partBytes });
        if (!res.ok) throw new Error(`Part ${partNumber} failed HTTP ${res.status}`);
        return res;
      }, `Part ${partNumber}/${totalParts}`);

      const etag = partRes.headers.get("etag");
      if (!etag) throw new Error(`No ETag returned for part ${partNumber}`);
      parts.push({ partNumber, etag });
    }

    // 3. Complete Multipart Upload
    const completeXml = [
      "<CompleteMultipartUpload>",
      ...parts.map(p => `  <Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`),
      "</CompleteMultipartUpload>"
    ].join("\n");

    const completeReq = signRequest({
      method: "POST",
      urlPath,
      queryParams: { uploadId },
      headers: { "content-type": "application/xml" },
      payload: completeXml
    });

    const completeRes = await fetch(completeReq.fullUrl, {
      method: "POST",
      headers: completeReq.headers,
      body: completeXml
    });

    if (!completeRes.ok) {
      throw new Error(`Complete multipart failed HTTP ${completeRes.status}: ${(await completeRes.text()).slice(0, 300)}`);
    }
  } catch (err) {
    // Abort on error
    try {
      const abortReq = signRequest({
        method: "DELETE",
        urlPath,
        queryParams: { uploadId }
      });
      await fetch(abortReq.fullUrl, { method: "DELETE", headers: abortReq.headers });
      console.warn(`[Multipart Cleanup] Aborted upload for ${key}`);
    } catch {
      // Ignore abort errors
    }
    throw err;
  }
}

async function verifyPublicUrl(key, expectedMime) {
  if (!publicUrl) return { ok: false, error: "MASSYNE_R2_PUBLIC_URL not set" };
  const target = `${publicUrl}/${key.split("/").map(encode).join("/")}`;
  try {
    const res = await fetch(target, { method: "HEAD" });
    if (res.status !== 200) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const ctype = res.headers.get("content-type") || "";
    const mimeMatch = ctype.toLowerCase().includes(expectedMime.toLowerCase());
    return { ok: true, status: res.status, contentType: ctype, mimeMatch };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.error("Missing required credentials: MASSYNE_R2_ACCOUNT_ID, MASSYNE_R2_ACCESS_KEY_ID, MASSYNE_R2_SECRET_ACCESS_KEY, MASSYNE_R2_BUCKET.");
    process.exit(1);
  }

  console.log("==================================================");
  console.log(`Cloudflare R2 Media Sync — ${apply ? "LIVE APPLY MODE" : "DRY RUN MODE"}`);
  console.log(`Bucket:      ${bucket}`);
  console.log(`Account ID:  ${accountId}`);
  console.log(`Public URL:  ${publicUrl || "(not configured)"}`);
  console.log(`Include PDF: ${includePdfs ? "yes" : "no"}`);
  console.log("==================================================");

  // Discover media files
  const discoveredPaths = [];
  for (const dir of ["images", "assets"]) {
    const fullDir = path.join(root, dir);
    if (existsSync(fullDir)) {
      discoveredPaths.push(...await walkDir(fullDir));
    }
  }
  const uniquePaths = [...new Set(discoveredPaths)].sort();
  const fileStats = await Promise.all(uniquePaths.map(async file => ({
    file,
    relKey: path.relative(root, file).split(path.sep).join("/"),
    size: (await stat(file)).size
  })));

  const totalBytes = fileStats.reduce((sum, f) => sum + f.size, 0);
  console.log(`\nDiscovered ${fileStats.length} media files (${(totalBytes / 1024 / 1024).toFixed(2)} MiB total).\n`);

  if (!apply) {
    console.log("DRY RUN: No modifications made to R2.");
    console.log("Rerun with --apply to upload modified/missing assets.");
    if (verifyUrls && publicUrl) {
      console.log("\nProbing existing public URLs for discovered assets...");
      let verifiedCount = 0;
      let missingCount = 0;
      for (const item of fileStats) {
        const v = await verifyPublicUrl(item.relKey, getMime(item.file));
        if (v.ok) {
          verifiedCount++;
        } else {
          missingCount++;
        }
      }
      console.log(`Public URL check: ${verifiedCount} verified (HTTP 200), ${missingCount} missing/failed.`);
    }
    process.exit(0);
  }

  // Apply Mode
  let uploadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let verifiedCount = 0;
  let uploadedBytes = 0;

  for (const item of fileStats) {
    const { file, relKey, size } = item;
    const contentType = getMime(file);

    try {
      const bytes = await readFile(file);
      const sha256 = hash(bytes);

      // Check idempotency via HEAD (bypassed if --force)
      let shouldUpload = true;
      if (!force) {
        try {
          const headInfo = await headObject(relKey);
          if (headInfo.exists) {
            if (headInfo.sha256 === sha256 || headInfo.contentLength === size) {
              shouldUpload = false;
            }
          }
        } catch {
          shouldUpload = true;
        }
      }

      if (!shouldUpload) {
        skippedCount++;
        if (verifyUrls) {
          const v = await verifyPublicUrl(relKey, contentType);
          if (v.ok) verifiedCount++;
          else console.warn(`  [URL WARN] ${relKey} skipped but public check returned ${v.error}`);
        }
        continue;
      }

      // Upload file
      const isMultipart = size >= MULTIPART_THRESHOLD;
      const modeDesc = isMultipart ? `Multipart (${(size / 1024 / 1024).toFixed(2)} MiB)` : `Single (${(size / 1024).toFixed(1)} KiB)`;
      process.stdout.write(`Uploading [${uploadedCount + skippedCount + 1}/${fileStats.length}] ${relKey} [${modeDesc}]... `);

      await retry(async () => {
        if (isMultipart) {
          await putMultipart(relKey, bytes, contentType, sha256);
        } else {
          await putSingle(relKey, bytes, contentType, sha256);
        }
      }, relKey);

      uploadedCount++;
      uploadedBytes += size;
      process.stdout.write("DONE.\n");

      if (verifyUrls) {
        const v = await verifyPublicUrl(relKey, contentType);
        if (v.ok) verifiedCount++;
        else console.warn(`  [URL WARN] ${relKey} uploaded but public check returned ${v.error}`);
      }
    } catch (err) {
      failedCount++;
      console.error(`\n[ERROR] Failed to sync ${relKey}: ${err.message}`);
    }
  }

  console.log("\n==================================================");
  console.log("R2 Media Sync Summary:");
  console.log(`Discovered: ${fileStats.length} files (${(totalBytes / 1024 / 1024).toFixed(2)} MiB)`);
  console.log(`Uploaded:   ${uploadedCount} files (${(uploadedBytes / 1024 / 1024).toFixed(2)} MiB)`);
  console.log(`Skipped:    ${skippedCount} files (idempotent / up to date)`);
  console.log(`Verified:   ${verifyUrls ? verifiedCount + " URLs (HTTP 200)" : "N/A (run with --verify-urls)"}`);
  console.log(`Failed:     ${failedCount} files`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
