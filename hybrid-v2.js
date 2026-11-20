(function () {
  const MOODS = {
    crimson: { accent: "#e11d48", glow: "rgba(225, 29, 72, 0.12)" },
    lime:    { accent: "#c8ff2e", glow: "rgba(200, 255, 46, 0.11)" },
    silver:  { accent: "#e4e8f0", glow: "rgba(228, 232, 240, 0.10)" }
  };

  function applyMood(key) {
    const m = MOODS[key] || MOODS.crimson;
    document.documentElement.style.setProperty("--accent", m.accent);
    document.documentElement.style.setProperty("--accent-color", m.accent);
    document.documentElement.style.setProperty("--primary", m.accent);
    try { localStorage.setItem("massyne_hybrid_mood", key); } catch (e) {}
    document.querySelectorAll(".hybrid-mood-dot").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.hybridMood === key);
    });
  }

  function initHybridV2() {
    // 1. Add 3-Mood Accent Switcher safely inside header if theme toggle exists
    const themeToggle = document.querySelector(".theme-toggle, [data-theme-toggle], #theme-toggle");
    if (themeToggle && themeToggle.parentNode && !document.querySelector(".hybrid-mood-dock")) {
      const dock = document.createElement("div");
      dock.className = "hybrid-mood-dock";
      dock.setAttribute("aria-label", "Accent mood");
      [
        { key: "crimson", color: "#e11d48", label: "Crimson Noir" },
        { key: "lime", color: "#c8ff2e", label: "Neon Chrome" },
        { key: "silver", color: "#e4e8f0", label: "Obsidian Silver" }
      ].forEach(function (item) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hybrid-mood-dot";
        b.dataset.hybridMood = item.key;
        b.style.background = item.color;
        b.title = item.label;
        b.setAttribute("aria-label", item.label);
        b.addEventListener("click", function () { applyMood(item.key); });
        dock.appendChild(b);
      });
      themeToggle.parentNode.insertBefore(dock, themeToggle.nextSibling);
    }

    try {
      const saved = localStorage.getItem("massyne_hybrid_mood");
      if (saved && MOODS[saved]) applyMood(saved);
    } catch (e) {}

    // 2. Archive OS Floating Cursor Preview (only on desktop pointers)
    if (window.matchMedia && window.matchMedia("(pointer: fine)").matches && !document.getElementById("hybrid-float-preview")) {
      const floater = document.createElement("div");
      floater.id = "hybrid-float-preview";
      floater.innerHTML = '<img alt="Preview">';
      document.body.appendChild(floater);
      const floatImg = floater.querySelector("img");

      document.addEventListener("mouseover", function (e) {
        const row = e.target.closest("#archive .archive-item, #archive .archive-row, .archive-list-item");
        if (!row) return;
        const img = row.querySelector("img");
        const src = (img && img.getAttribute("src")) || row.getAttribute("data-preview");
        if (!src) return;
        floatImg.src = src;
        floater.classList.add("is-visible");
      });

      document.addEventListener("mousemove", function (e) {
        if (!floater.classList.contains("is-visible")) return;
        const x = Math.min(window.innerWidth - 260, e.clientX + 22);
        const y = Math.min(window.innerHeight - 200, Math.max(72, e.clientY - 85));
        floater.style.left = x + "px";
        floater.style.top = y + "px";
      });

      document.addEventListener("mouseout", function (e) {
        const row = e.target.closest("#archive .archive-item, #archive .archive-row, .archive-list-item");
        if (row && (!e.relatedTarget || !row.contains(e.relatedTarget))) {
          floater.classList.remove("is-visible");
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHybridV2);
  } else {
    initHybridV2();
  }
})();
