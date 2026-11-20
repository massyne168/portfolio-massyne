(function () {
  const THEME_COMBOS = [
    { name: "Crimson Noir",       bg: "#0D0B0E", c1: "#D84040", c2: "#F5EFE7", btn: "#BE3144" },
    { name: "Obsidian Gold",      bg: "#0D0D0D", c1: "#C9A84C", c2: "#FAFAFA", btn: "#C9A84C" },
    { name: "Neon Cyber Pulse",   bg: "#0D0D0D", c1: "#00FF85", c2: "#1E90FF", btn: "#00FF85" },
    { name: "Tech Violet & Cyan", bg: "#09090B", c1: "#8B5CF6", c2: "#06B6D4", btn: "#8B5CF6" },
    { name: "Amber Forge",        bg: "#1C1C1C", c1: "#FF6F61", c2: "#DAA520", btn: "#FF4500" },
    { name: "Deep Emerald",       bg: "#091413", c1: "#10B981", c2: "#B0E4CC", btn: "#10B981" },
    { name: "Midnight Electric",  bg: "#0B192C", c1: "#FF6500", c2: "#E4E4E7", btn: "#FF6500" },
    { name: "Contrasting Flame",  bg: "#181818", c1: "#FF5722", c2: "#673AB7", btn: "#FF5722" },
    { name: "Royal Plum & Rose",  bg: "#1A1A1D", c1: "#F7374F", c2: "#E8BCB9", btn: "#88304E" },
    { name: "Monochrome Studio",  bg: "#121212", c1: "#E4E4E7", c2: "#888888", btn: "#FFFFFF" }
  ];

  let selected = { name: "Crimson Noir", color1: "#D84040", color2: "#F5EFE7", background: "#0D0B0E", button: "#BE3144" };

  function injectThemeCombosPanel() {
    const contentEl = document.getElementById("studio-content");
    const activeNav = document.querySelector('.studio-nav .nav-item.is-active[data-page="appearance"]');
    if (!contentEl || !activeNav || document.getElementById("v2-theme-combos")) return;

    const panel = document.createElement("section");
    panel.id = "v2-theme-combos";
    panel.style.cssText = "margin-bottom:20px;padding:18px;border-radius:16px;background:rgba(16,18,24,0.92);border:1px solid rgba(255,255,255,0.12);";

    panel.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;">' +
        '<div><p class="eyebrow" style="margin:0;">10 CURATED COLOR COMBOS</p><h2 style="margin:4px 0 0;font-size:18px;">One-Click Portfolio Themes</h2></div>' +
        '<button type="button" id="tc-publish-btn" class="button button-primary">Save &amp; Publish Theme to main</button>' +
      '</div>' +
      '<div id="tc-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:16px;">' +
        THEME_COMBOS.map(function (t, i) {
          return '<button type="button" data-tc-idx="' + i + '" style="text-align:left;padding:12px;border-radius:12px;background:#0a0c10;border:1px solid rgba(255,255,255,0.1);color:#f3f5f8;cursor:pointer;">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:8px;">' + (i + 1) + '. ' + t.name + '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:6px;">' +
              '<span title="Background ' + t.bg + '" style="height:22px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:' + t.bg + ';"></span>' +
              '<span title="Color 1 ' + t.c1 + '" style="height:22px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:' + t.c1 + ';"></span>' +
              '<span title="Color 2 ' + t.c2 + '" style="height:22px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:' + t.c2 + ';"></span>' +
              '<span title="Buttons ' + t.btn + '" style="height:22px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:' + t.btn + ';"></span>' +
            '</div>' +
            '<div style="font-size:10px;color:#8e97a8;font-family:IBM Plex Mono,monospace;">BG · C1 · C2 · BTN</div>' +
          '</button>';
        }).join("") +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">' +
        '<label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#a5aec0;">Color 1 (Primary)<input id="tc-c1" type="color" value="' + selected.color1 + '" style="width:100%;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:transparent;"></label>' +
        '<label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#a5aec0;">Color 2 (Secondary)<input id="tc-c2" type="color" value="' + selected.color2 + '" style="width:100%;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:transparent;"></label>' +
        '<label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#a5aec0;">Background (All Sections)<input id="tc-bg" type="color" value="' + selected.background + '" style="width:100%;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:transparent;"></label>' +
        '<label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#a5aec0;">Buttons Color<input id="tc-btn" type="color" value="' + selected.button + '" style="width:100%;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:transparent;"></label>' +
      '</div>' +
      '<p id="tc-status" style="margin:10px 0 0;font-size:12px;color:#9ba3b4;">Pick a combo above or customize all 4 colors, then click Save &amp; Publish.</p>';

    contentEl.insertBefore(panel, contentEl.firstChild);

    const c1El = document.getElementById("tc-c1");
    const c2El = document.getElementById("tc-c2");
    const bgEl = document.getElementById("tc-bg");
    const btnEl = document.getElementById("tc-btn");
    const statusEl = document.getElementById("tc-status");

    function syncInputs() {
      c1El.value = selected.color1;
      c2El.value = selected.color2;
      bgEl.value = selected.background;
      btnEl.value = selected.button;
      const accentInp = contentEl.querySelector('input[name="accent"]');
      const lightInp = contentEl.querySelector('input[name="light"]');
      if (accentInp) { accentInp.value = selected.color1; accentInp.dispatchEvent(new Event("input", { bubbles: true })); }
      if (lightInp) { lightInp.value = selected.color2; lightInp.dispatchEvent(new Event("input", { bubbles: true })); }
    }

    panel.querySelectorAll("[data-tc-idx]").forEach(function (b) {
      b.addEventListener("click", function () {
        const t = THEME_COMBOS[Number(b.getAttribute("data-tc-idx"))];
        if (!t) return;
        selected = { name: t.name, color1: t.c1, color2: t.c2, background: t.bg, button: t.btn };
        syncInputs();
        statusEl.textContent = "Selected: " + t.name + " (BG " + t.bg + " · C1 " + t.c1 + " · C2 " + t.c2 + " · BTN " + t.btn + "). Click Save & Publish.";
      });
    });

    [c1El, c2El, bgEl, btnEl].forEach(function (inp) {
      inp.addEventListener("input", function () {
        selected = { name: "Custom", color1: c1El.value, color2: c2El.value, background: bgEl.value, button: btnEl.value };
      });
    });

    document.getElementById("tc-publish-btn").addEventListener("click", async function () {
      const pubBtn = document.getElementById("tc-publish-btn");
      pubBtn.disabled = true;
      statusEl.textContent = "Publishing theme combo to main...";
      try {
        const res = await fetch("/api/studio-files?path=studio-content.json", { credentials: "same-origin" });
        const fileData = await res.json();
        if (!res.ok || !fileData.ok) throw new Error(fileData.error || "Could not read studio-content.json");
        const content = JSON.parse(fileData.content);
        content.site = content.site || {};
        content.site.colors = Object.assign({}, content.site.colors || {}, { accent: selected.color1, light: selected.color2 });
        content.site.background = Object.assign({}, content.site.background || {}, { type: "color", color: selected.background });
        content.site.themeCombo = {
          name: selected.name,
          color1: selected.color1,
          color2: selected.color2,
          background: selected.background,
          button: selected.button
        };
        const pubRes = await fetch("/api/studio-publish", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content })
        });
        const pubData = await pubRes.json();
        if (!pubRes.ok || pubData.error) throw new Error(pubData.error || pubData.message || "Publish failed");
        statusEl.textContent = "Theme '" + selected.name + "' published to main! Vercel deploying...";
      } catch (err) {
        statusEl.textContent = "Error: " + (err.message || err);
      } finally {
        pubBtn.disabled = false;
      }
    });
  }

  function boot() {
    const contentEl = document.getElementById("studio-content");
    if (!contentEl) return;
    new MutationObserver(injectThemeCombosPanel).observe(contentEl, { childList: true });
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-page="appearance"]')) {
        setTimeout(injectThemeCombosPanel, 60);
      }
    });
    setTimeout(injectThemeCombosPanel, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
