module.exports = function maintenanceLogout(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `massyne_owner_access=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${secure}`);
  res.setHeader("Cache-Control", "no-store");
  res.redirect(303, "/maintenance.html");
};
