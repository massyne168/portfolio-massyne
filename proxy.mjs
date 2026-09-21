import { next } from "@vercel/functions";

const COOKIE_NAME = "massyne_owner_access";
const PUBLIC_PATHS = new Set([
  "/maintenance.html",
  "/maintenance.css",
  "/maintenance.js",
  "/api/maintenance-login",
  "/api/maintenance-logout",
  "/images/favicon.png",
  "/images/favicon-32x32.png",
  "/images/favicon-16x16.png",
  "/favicon.ico"
]);

function readCookie(cookieHeader, name) {
  for (const part of (cookieHeader || "").split(";")) {
    const [cookieName, ...valueParts] = part.trim().split("=");
    if (cookieName === name) {
      try {
        return decodeURIComponent(valueParts.join("="));
      } catch (error) {
        return "";
      }
    }
  }

  return "";
}

export default function proxy(request) {
  const url = new URL(request.url);

  if (PUBLIC_PATHS.has(url.pathname) || url.pathname.startsWith("/_vercel/")) {
    return next();
  }

  const configuredToken = process.env.MAINTENANCE_BYPASS_TOKEN || "";
  const cookieToken = readCookie(request.headers.get("cookie"), COOKIE_NAME);

  if (configuredToken && cookieToken === configuredToken) {
    return next();
  }

  return Response.redirect(new URL("/maintenance.html", request.url), 307);
}
