import { randomUUID, createHash, createHmac } from "node:crypto";
import { isStudioSessionAuthenticated } from "./studio-access.mjs";

const MAX_FILES = 12;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB per image
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB per video
const MAX_BATCH_BYTES = 35 * 1024 * 1024; // 35 MB batch total

const IMAGE_TYPES = Object.freeze({
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif"
});

const VIDEO_TYPES = Object.freeze({
  "video/mp4": "mp4",
  "video/webm": "webm"
});

const ALL_MEDIA_TYPES = Object.freeze({
  ...IMAGE_TYPES,
  ...VIDEO_TYPES
});

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
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
  const origin = String(req.headers?.origin || "").trim();
  const host = String(req.headers?.host || "").trim();
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    const isLocal = host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host === "localhost";
    const isHttps = parsed.protocol === "https:" || (isLocal && parsed.protocol === "http:");
    return isHttps && parsed.host.toLowerCase() === host.toLowerCase();
  } catch (_) {
    return false;
  }
}

function awsEncode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, char =>
    "%" + char.charCodeAt(0).toString(16).toUpperCase()
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  return createHmac("sha256", key).update(value).digest(encoding);
}

function signingKey(secret, date) {
  const dateKey = hmac("AWS4" + secret, date);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
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

function validateFiles(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_FILES) {
    const error = new Error(`Choose between 1 and ${MAX_FILES} media files.`);
    error.status = 400;
    throw error;
  }
  let total = 0;
  return input.map(file => {
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      const error = new Error("One of the selected files is invalid.");
      error.status = 400;
      throw error;
    }
    const type = String(file.type || "").toLowerCase().trim();
    const isImage = Boolean(IMAGE_TYPES[type]);
    const isVideo = Boolean(VIDEO_TYPES[type]);
    const extension = ALL_MEDIA_TYPES[type];
    const size = Number(file.size);

    if (!extension || !Number.isSafeInteger(size) || size <= 0) {
      const error = new Error("Upload PNG, JPG, WEBP, AVIF, GIF images or MP4, WEBM videos.");
      error.status = 400;
      throw error;
    }

    if (isImage && size > MAX_IMAGE_BYTES) {
      const error = new Error(`Image "${file.name || 'file'}" exceeds 10 MB limit (${(size / (1024 * 1024)).toFixed(1)} MB).`);
      error.status = 400;
      throw error;
    }

    if (isVideo && size > MAX_VIDEO_BYTES) {
      const error = new Error(`Video "${file.name || 'file'}" exceeds 25 MB limit (${(size / (1024 * 1024)).toFixed(1)} MB).`);
      error.status = 400;
      throw error;
    }

    total += size;
    if (total > MAX_BATCH_BYTES) {
      const error = new Error(`Total media uploads exceed 35 MB batch limit (${(total / (1024 * 1024)).toFixed(1)} MB).`);
      error.status = 413;
      throw error;
    }

    const now = new Date();
    const prefix = now.getUTCFullYear() + "/" + String(now.getUTCMonth() + 1).padStart(2, "0");
    const key = "studio-uploads/" + prefix + "/" + randomUUID() + "-" + safeBaseName(file.name) + "." + extension;
    return { key, type, size };
  });
}

function createPresignedPut({ accountId, accessKeyId, secretAccessKey, bucket, key, contentType }) {
  const host = accountId + ".r2.cloudflarestorage.com";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = date + "/auto/s3/aws4_request";
  const credential = accessKeyId + "/" + scope;
  const expires = "300"; // 5 minutes
  const canonicalUri = "/" + awsEncode(bucket) + "/" + key.split("/").map(awsEncode).join("/");
  const query = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", expires],
    ["X-Amz-SignedHeaders", "content-type;host"]
  ].map(([name, value]) => [awsEncode(name), awsEncode(value)])
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => name + "=" + value)
    .join("&");
  const canonicalHeaders = "content-type:" + contentType.trim() + "\nhost:" + host + "\n";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    query,
    canonicalHeaders,
    "content-type;host",
    "UNSIGNED-PAYLOAD"
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest)
  ].join("\n");
  const signature = hmac(signingKey(secretAccessKey, date), stringToSign, "hex");
  return "https://" + host + canonicalUri + "?" + query + "&X-Amz-Signature=" + signature;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Method not allowed." });
  }
  if (!isStudioSessionAuthenticated(req)) {
    return send(res, 401, { message: "Open MASSYNE Studio again to continue." });
  }
  if (!originAllowed(req)) {
    return send(res, 403, { message: "Cross-origin request blocked." });
  }

  const accountId = String(process.env.MASSYNE_R2_ACCOUNT_ID || "").trim();
  const accessKeyId = String(process.env.MASSYNE_R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(process.env.MASSYNE_R2_SECRET_ACCESS_KEY || "").trim();
  const bucket = String(process.env.MASSYNE_R2_BUCKET || "").trim();
  const publicBase = String(process.env.MASSYNE_R2_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  const configured = Boolean(accountId && accessKeyId && secretAccessKey && bucket && publicBase);
  if (!configured) {
    return send(res, 200, { configured: false, message: "Cloudflare R2 is not configured; using the existing GitHub media uploader." });
  }
  let publicUrl;
  try {
    const parsed = new URL(publicBase);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("invalid");
    publicUrl = parsed.href.replace(/\/+$/, "");
  } catch (_) {
    return send(res, 503, { configured: false, message: "MASSYNE_R2_PUBLIC_URL must be a valid HTTPS media-domain URL." });
  }

  let files;
  try {
    files = validateFiles(readBody(req).files);
  } catch (error) {
    return send(res, error.status || 400, { message: error.message || "The selected media files are invalid." });
  }

  try {
    const uploads = files.map(file => ({
      key: file.key,
      path: publicUrl + "/" + file.key.split("/").map(awsEncode).join("/"),
      uploadUrl: createPresignedPut({
        accountId, accessKeyId, secretAccessKey, bucket,
        key: file.key, contentType: file.type
      }),
      contentType: file.type,
      size: file.size
    }));
    return send(res, 200, { configured: true, uploads });
  } catch (_) {
    return send(res, 500, { message: "Could not prepare secure R2 uploads." });
  }
}
