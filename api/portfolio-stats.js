const { randomUUID } = require("crypto");

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const COOKIE_NAME = "massyne_visitor";
const ACTIVE_WINDOW_SECONDS = 60;

const keys = {
  visitors: "portfolio:visitors",
  countries: "portfolio:countries",
  active: "portfolio:active"
};

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join("=") || "");
    return cookies;
  }, {});
}

function getCountry(req) {
  const country = req.headers["x-vercel-ip-country"] || req.headers["x-geo-country"] || "";
  return String(country).trim().toUpperCase().slice(0, 2);
}

function getRequestEvent(req) {
  if (!req.body) {
    return "presence";
  }

  if (typeof req.body === "object") {
    return req.body.event || "presence";
  }

  try {
    return JSON.parse(req.body).event || "presence";
  } catch (error) {
    return "presence";
  }
}

async function kv(command, ...args) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error("KV is not configured");
  }

  const path = [command, ...args].map(part => encodeURIComponent(String(part))).join("/");
  const response = await fetch(`${KV_URL.replace(/\/$/, "")}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`KV command failed: ${command}`);
  }

  const payload = await response.json();
  return payload.result;
}

function toCount(value) {
  return Math.max(0, Number(value) || 0);
}

module.exports = async function portfolioStats(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!KV_URL || !KV_TOKEN) {
    res.status(503).json({
      error: "Portfolio stats backend is not configured",
      setup: "Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel."
    });
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const visitorId = cookies[COOKIE_NAME] || randomUUID();
  const isNewVisitor = !cookies[COOKIE_NAME];
  const requestEvent = getRequestEvent(req);
  const country = getCountry(req);
  const now = Math.floor(Date.now() / 1000);
  const activeCutoff = now - ACTIVE_WINDOW_SECONDS;

  try {
    if (requestEvent === "close" && cookies[COOKIE_NAME]) {
      await kv("ZREM", keys.active, visitorId);
      await kv("ZREMRANGEBYSCORE", keys.active, 0, activeCutoff);

      const [visitors, countries, online] = await Promise.all([
        kv("GET", keys.visitors),
        kv("SCARD", keys.countries),
        kv("ZCARD", keys.active)
      ]);

      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({
        visitors: toCount(visitors),
        countries: toCount(countries),
        online: toCount(online)
      });
      return;
    }

    if (isNewVisitor) {
      await kv("INCR", keys.visitors);
    }

    if (country && country !== "XX") {
      await kv("SADD", keys.countries, country);
    }

    await kv("ZADD", keys.active, now, visitorId);
    await kv("ZREMRANGEBYSCORE", keys.active, 0, activeCutoff);

    const [visitors, countries, online] = await Promise.all([
      kv("GET", keys.visitors),
      kv("SCARD", keys.countries),
      kv("ZCARD", keys.active)
    ]);

    if (isNewVisitor) {
      const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
      res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax${secure}`
      );
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      visitors: toCount(visitors),
      countries: toCount(countries),
      online: toCount(online)
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to update portfolio stats" });
  }
};
