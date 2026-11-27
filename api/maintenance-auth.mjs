import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const COOKIE_NAME = "massyne_maintenance_session";
const SESSION_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes

// In-memory rate limiting (per IP) - for production consider Redis/KV
const rateLimitStore = new Map();

function send(res, status, body) {
  res.status(status).json(body);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function makeSignature(expires, code) {
  return createHmac("sha256", code).update(expires).digest("hex");
}

function validSession(req, code) {
  const rawCookie = String(req.headers.cookie || "");
  const cookie = rawCookie.split(";").map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  const value = cookie.slice(COOKIE_NAME.length + 1);
  const [expires, signature, extra] = value.split(".");
  if (extra || !/^\d+$/.test(expires || "") || !/^[a-f0-9]{64}$/i.test(signature || "")) return false;
  if (Number(expires) * 1000 <= Date.now()) return false;
  return secureEqual(signature.toLowerCase(), makeSignature(expires, code));
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    rateLimitStore.set(ip, { attempts: 1, firstAttempt: now, lockedUntil: 0 });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Clean up expired lockout
  if (record.lockedUntil && now >= record.lockedUntil) {
    record.lockedUntil = 0;
    record.attempts = 0;
  }

  // Check if locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, retryAfter, locked: true };
  }

  // Check attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_SECONDS * 1000;
    const retryAfter = LOCKOUT_SECONDS;
    return { allowed: false, retryAfter, locked: true };
  }

  record.attempts++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.attempts };
}

function clearRateLimit(ip) {
  rateLimitStore.delete(ip);
}

export function isMaintenanceSessionAuthenticated(req) {
  const code = String(process.env.MASSYNE_MAINTENANCE_PASSWORD || "").trim();
  return code.length >= 4 && validSession(req, code);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  const code = String(process.env.MASSYNE_MAINTENANCE_PASSWORD || "").trim();
  const maintenanceEnabled = String(process.env.MAINTENANCE_MODE || "").trim().toLowerCase() === "true";
  const configured = code.length >= 4;

  // If maintenance mode is disabled, allow all requests
  if (!maintenanceEnabled) {
    if (req.method === "GET") {
      return send(res, 200, { maintenance: false, authenticated: true, configured: true });
    }
    return send(res, 404, { message: "Maintenance mode is not active." });
  }

  // If not configured but maintenance enabled, return 503
  if (!configured) {
    return send(res, 503, { message: "Maintenance mode is active but not configured." });
  }

  const ip = getClientIp(req);

  if (req.method === "GET") {
    // Check if already authenticated
    const authenticated = validSession(req, code);
    return send(res, 200, {
      maintenance: true,
      authenticated,
      configured: true,
      requiresAuth: !authenticated
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { message: "Method not allowed." });
  }

  const body = readBody(req);

  // Handle logout
  if (body.action === "logout") {
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
    clearRateLimit(ip);
    return send(res, 200, { authenticated: false, maintenance: true });
  }

  // Check rate limit
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfter));
    return send(res, 429, {
      message: rateLimit.locked
        ? `Too many attempts. Please try again in ${rateLimit.retryAfter} seconds.`
        : "Too many requests.",
      retryAfter: rateLimit.retryAfter,
      locked: rateLimit.locked
    });
  }

  // Verify origin for CSRF protection
  const origin = String(req.headers.origin || "");
  const host = String(req.headers.host || "");
  if (origin && host) {
    try {
      if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
        return send(res, 403, { message: "Access denied." });
      }
    } catch (_) {
      return send(res, 403, { message: "Access denied." });
    }
  }

  const submitted = typeof body.password === "string" && Buffer.byteLength(body.password) <= 256
    ? body.password.trim()
    : "";

  if (!secureEqual(submitted, code)) {
    const remaining = rateLimit.remaining ?? (MAX_ATTEMPTS - 1);
    return send(res, 401, {
      message: remaining > 0
        ? `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        : "Too many failed attempts. Please wait before trying again.",
      remaining
    });
  }

  // Success - create session
  clearRateLimit(ip);
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const signature = makeSignature(expires, code);

  const isProduction = process.env.VERCEL_ENV === "production";
  const cookieOptions = [
    `${COOKIE_NAME}=${expires}.${signature}`,
    "Path=/",
    `Max-Age=${SESSION_SECONDS}`,
    "HttpOnly",
    isProduction ? "Secure" : "",
    "SameSite=Strict"
  ].filter(Boolean).join("; ");

  res.setHeader("Set-Cookie", cookieOptions);
  return send(res, 200, { authenticated: true, maintenance: true });
}