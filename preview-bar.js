(() => {
  const API_ENDPOINT = "/api/maintenance-auth";

  async function initPreviewBar() {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.maintenance || !data.authenticated) return;

      renderBar();
    } catch (_) {}
  }

  function renderBar() {
    if (document.getElementById("massyne-preview-bar")) return;

    const bar = document.createElement("div");
    bar.id = "massyne-preview-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Private Preview Controls");

    Object.assign(bar.style, {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      zIndex: "99999",
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "rgba(12, 12, 16, 0.72)",
      backdropFilter: "blur(10px) saturate(180%)",
      WebkitBackdropFilter: "blur(10px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.55), 0 0 24px rgba(127, 1, 31, 0.35)",
      color: "#f5ebd0",
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.14em",
      textTransform: "uppercase"
    });

    const dot = document.createElement("span");
    Object.assign(dot.style, {
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: "#e84d5a",
      boxShadow: "0 0 10px #e84d5a",
      flexShrink: "0"
    });

    const label = document.createElement("span");
    label.textContent = "PRIVATE PREVIEW";

    const sep = document.createElement("span");
    sep.textContent = "·";
    sep.style.opacity = "0.45";

    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.textContent = "EXIT";
    Object.assign(exitBtn.style, {
      background: "rgba(200, 16, 36, 0.32)",
      border: "1px solid rgba(232, 77, 90, 0.45)",
      borderRadius: "999px",
      color: "#f5ebd0",
      fontFamily: "inherit",
      fontSize: "10px",
      fontWeight: "700",
      letterSpacing: "0.14em",
      padding: "4px 10px",
      cursor: "pointer",
      transition: "background 0.2s ease, border-color 0.2s ease"
    });

    exitBtn.addEventListener("mouseenter", () => {
      exitBtn.style.background = "rgba(200, 16, 36, 0.65)";
      exitBtn.style.borderColor = "rgba(255, 255, 255, 0.4)";
    });
    exitBtn.addEventListener("mouseleave", () => {
      exitBtn.style.background = "rgba(200, 16, 36, 0.32)";
      exitBtn.style.borderColor = "rgba(232, 77, 90, 0.45)";
    });

    exitBtn.addEventListener("click", async () => {
      exitBtn.disabled = true;
      exitBtn.textContent = "...";
      try {
        await fetch(API_ENDPOINT, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" })
        });
      } finally {
        window.location.replace("/");
      }
    });

    bar.append(dot, label, sep, exitBtn);
    document.body.appendChild(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPreviewBar, { once: true });
  } else {
    initPreviewBar();
  }
})();