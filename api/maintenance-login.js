const crypto = require("crypto");

const COOKIE_NAME = "massyne_owner_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function safeEqual(value, expected) {
  const left = crypto.createHash("sha256").update(String(value || "")).digest();
  const right = crypto.createHash("sha256").update(String(expected || "")).digest();
  return crypto.timingSafeEqual(left, right);
}

function getPassword(req) {
  if (req.body && typeof req.body === "object") {
    return req.body.password || "";
  }

  try {
    return JSON.parse(req.body || "{}").password || "";
  } catch (error) {
    return "";
  }
}

module.exports = function maintenanceLogin(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const password = process.env.MAINTENANCE_PASSWORD;
  const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN;

  if (!password || !bypassToken) {
    res.status(503).json({ error: "Owner access is not configured." });
    return;
  }

  if (!safeEqual(getPassword(req), password)) {
    res.setHeader("Cache-Control", "no-store");
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(bypassToken)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Strict${secure}`);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true });
};
