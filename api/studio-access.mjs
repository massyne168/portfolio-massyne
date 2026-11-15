import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "massyne_studio_session";
const SESSION_SECONDS = 12 * 60 * 60;

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

export function isStudioSessionAuthenticated(req) {
  const code = String(process.env.MASSYNE_STUDIO_ACCESS_CODE || "").trim();
  return code.length >= 12 && validSession(req, code);
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const code = String(process.env.MASSYNE_STUDIO_ACCESS_CODE || "").trim();
  const configured = code.length >= 12;

  if (req.method === "GET") {
    if (!configured) return send(res, 503, { authenticated: false, configured: false });
    return send(res, 200, { authenticated: validSession(req, code), configured: true });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { message: "Method not allowed." });
  }

  const body = readBody(req);
  if (body.action === "logout") {
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
    return send(res, 200, { authenticated: false });
  }
  if (!configured) return send(res, 503, { message: "Studio access is not configured yet." });

  const origin = String(req.headers.origin || "");
  const host = String(req.headers.host || "");
  if (origin && host) {
    try {
      if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) return send(res, 403, { message: "Access denied." });
    } catch (_) {
      return send(res, 403, { message: "Access denied." });
    }
  }

  const submitted = typeof body.code === "string" && Buffer.byteLength(body.code) <= 256 ? body.code.trim() : "";
  if (!secureEqual(submitted, code)) return send(res, 401, { message: "That code did not match. Try again." });

  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const signature = makeSignature(expires, code);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${expires}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`);
  return send(res, 200, { authenticated: true });
}
