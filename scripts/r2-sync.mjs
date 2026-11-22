#!/usr/bin/env node
import { createHash, createHmac } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const accountId = process.env.MASSYNE_R2_ACCOUNT_ID || "";
const accessKeyId = process.env.MASSYNE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.MASSYNE_R2_SECRET_ACCESS_KEY || "";
const bucket = process.env.MASSYNE_R2_BUCKET || "";
const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".mp4", ".webm", ".mov", ".woff", ".woff2", ".ttf", ".otf", ".svg"]);
const apply = process.argv.includes("--apply");

function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, char => "%" + char.charCodeAt(0).toString(16).toUpperCase());
}
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function hmac(key, value, encoding) { return createHmac("sha256", key).update(value).digest(encoding); }
function signingKey(secret, date) {
  return hmac(hmac(hmac(hmac("AWS4" + secret, date), "auto"), "s3"), "aws4_request");
}
function mime(file) {
  return ({
    ".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",
    ".avif":"image/avif",".gif":"image/gif",".mp4":"video/mp4",".webm":"video/webm",
    ".mov":"video/quicktime",".woff":"font/woff",".woff2":"font/woff2",
    ".ttf":"font/ttf",".otf":"font/otf",".svg":"image/svg+xml"
  })[path.extname(file).toLowerCase()] || "application/octet-stream";
}
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolute));
    else if (entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase())) output.push(absolute);
  }
  return output;
}
async function upload(file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const bytes = await readFile(file);
  const contentType = mime(file);
  const cacheControl = "public, max-age=86400, stale-while-revalidate=604800";
  const host = accountId + ".r2.cloudflarestorage.com";
  const urlPath = "/" + encode(bucket) + "/" + relative.split("/").map(encode).join("/");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = hash(bytes);
  const canonicalHeaders = "cache-control:" + cacheControl + "\ncontent-type:" + contentType + "\nhost:" + host + "\nx-amz-content-sha256:" + payloadHash + "\nx-amz-date:" + amzDate + "\n";
  const signedHeaders = "cache-control;content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", urlPath, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = date + "/auto/s3/aws4_request";
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, hash(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(secretAccessKey, date), stringToSign, "hex");
  const authorization = "AWS4-HMAC-SHA256 Credential=" + accessKeyId + "/" + scope + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;
  const response = await fetch("https://" + host + urlPath, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Cache-Control": cacheControl,
      "Content-Type": contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate
    },
    body: bytes
  });
  if (!response.ok) throw new Error(relative + ": R2 returned HTTP " + response.status + " " + (await response.text()).slice(0, 300));
  return { path: relative, bytes: bytes.length, contentType };
}

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Set MASSYNE_R2_ACCOUNT_ID, MASSYNE_R2_ACCESS_KEY_ID, MASSYNE_R2_SECRET_ACCESS_KEY and MASSYNE_R2_BUCKET.");
  process.exit(1);
}
const files = [];
for (const directory of ["images", "assets"]) {
  try { files.push(...await walk(path.join(root, directory))); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
const unique = [...new Set(files)].sort();
const total = (await Promise.all(unique.map(file => stat(file)))).reduce((sum, item) => sum + item.size, 0);
console.log((apply ? "UPLOAD" : "DRY RUN") + ": " + unique.length + " media files, " + (total / 1024 / 1024).toFixed(2) + " MiB");
if (!apply) {
  console.log("No files uploaded. Review the list, then rerun with --apply.");
  for (const file of unique) console.log(path.relative(root, file));
  process.exit(0);
}
let completed = 0;
for (const file of unique) {
  const result = await upload(file);
  completed += result.bytes;
  console.log("Uploaded " + result.path + " (" + result.bytes + " bytes)");
}
console.log("Complete: " + unique.length + " objects, " + (completed / 1024 / 1024).toFixed(2) + " MiB.");
