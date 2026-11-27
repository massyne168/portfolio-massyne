const COOKIE_NAME = "massyne_maintenance_session";

export const config = {
  matcher: ["/", "/index.html", "/maintenance", "/maintenance.html", "/projects/:path*"]
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) cookies[key] = val;
  }
  return cookies;
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function isValidSession(cookieHeader, secret) {
  if (!secret || secret.length < 4) return false;
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return false;

  const parts = raw.split(".");
  if (parts.length !== 2) return false;

  const [expires, signature] = parts;
  if (!/^\d+$/.test(expires) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  if (Number(expires) * 1000 <= Date.now()) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(expires));
  const expectedHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqualHex(signature.toLowerCase(), expectedHex);
}

export default async function middleware(request) {
  const maintenanceEnabled =
    String(process.env.MAINTENANCE_MODE || "").trim().toLowerCase() === "true";

  if (!maintenanceEnabled) {
    return new Response(null, {
      headers: { "x-middleware-next": "1" }
    });
  }

  const secret = String(process.env.MASSYNE_MAINTENANCE_PASSWORD || "").trim();
  const cookieHeader = request.headers.get("cookie") || "";
  const authenticated = await isValidSession(cookieHeader, secret);

  if (authenticated) {
    return new Response(null, {
      headers: {
        "x-middleware-next": "1",
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  }

  const redirectUrl = new URL("/preview.html", request.url);
  return new Response(null, {
    status: 307,
    headers: {
      Location: redirectUrl.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}