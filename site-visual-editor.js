(function () {
  var state = { accent: "", bgColor: "", texts: {} };
  var editMode = false;
  var fileSha = "";

  function getSelector(el) {
    if (!el || el === document.body) return "";
    if (el.id) return "#" + CSS.escape(el.id);
    var parts = [];
    var cur = el;
    while (cur && cur !== document.body && parts.length < 6) {
      var tag = cur.tagName.toLowerCase();
      if (cur.id) {
        parts.unshift("#" + CSS.escape(cur.id));
        break;
      }
      var idx = 1;
      var sib = cur.previousElementSibling;
      while (sib) {
        if (sib.tagName === cur.tagName) idx++;
        sib = sib.previousElementSibling;
      }
      parts.unshift(tag + ":nth-of-type(" + idx + ")");
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }

  function applyOverrides(data) {
    if (!data || typeof data !== "object") return;
    if (data.accent) {
      document.documentElement.style.setProperty("--accent", data.accent);
      document.documentElement.style.setProperty("--accent-color", data.accent);
      document.documentElement.style.setProperty("--primary", data.accent);
    }
    if (data.bgColor) {
      document.body.style.backgroundColor = data.bgColor;
    }
    if (data.texts && typeof data.texts === "object") {
      Object.keys(data.texts).forEach(function (sel) {
        try {
          var target = document.querySelector(sel);
          if (target && !target.closest("#massyne-ve-bar")) {
            target.textContent = data.texts[sel];
          }
        } catch (e) {}
      });
    }
  }

  async function loadOverrides() {
    try {
      var res = await fetch("/site-overrides.json?v=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      var json = await res.json();
      state = {
        accent: json.accent || "",
        bgColor: json.bgColor || "",
        texts: json.texts && typeof json.texts === "object" ? json.texts : {}
      };
      applyOverrides(state);
    } catch (e) {}
  }

  function isEditableTextEl(el) {
    if (!el || el.closest("#massyne-ve-bar") || el.closest("#massyne-ve-fab")) return false;
    var tag = el.tagName;
    if (!/^(H1|H2|H3|H4|P|SPAN|A|BUTTON|LI|EM|STRONG)$/.test(tag)) return false;
    if (el.children.length > 0) return false;
    return (el.textContent || "").trim().length > 0;
  }

  function setEditMode(on) {
    editMode = on;
    document.body.classList.toggle("massyne-ve-active", on);
    var bar = document.getElementById("massyne-ve-bar");
    var fab = document.getElementById("massyne-ve-fab");
    if (bar) bar.hidden = !on;
    if (fab) fab.hidden = on;
    document.querySelectorAll("[data-ve-editing]").forEach(function (el) {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-ve-editing");
    });
  }

  async function saveOverrides(statusEl) {
    if (statusEl) statusEl.textContent = "Saving to main...";
    try {
      if (!fileSha) {
        var metaRes = await fetch("/api/studio-files?path=site-overrides.json", { credentials: "same-origin" });
        if (metaRes.ok) {
          var meta = await metaRes.json();
          if (meta && meta.sha) fileSha = meta.sha;
        }
      }
      var res = await fetch("/api/studio-files", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "site-overrides.json",
          sha: fileSha,
          content: JSON.stringify(state, null, 2) + "\n",
          message: "Update live visual edits from on-site editor"
        })
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Save failed");
      if (data.sha) fileSha = data.sha;
      if (statusEl) statusEl.textContent = "Saved to main! Deploying...";
    } catch (err) {
      if (statusEl) statusEl.textContent = "Error: " + (err.message || err);
    }
  }

  function mountEditorUI() {
    var style = document.createElement("style");
    style.textContent =
      "#massyne-ve-fab{position:fixed;bottom:20px;left:20px;z-index:99998;padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,0.2);background:#0d0f14;color:#c8ff2e;font:600 12px/1 Inter,sans-serif;cursor:pointer;box-shadow:0 12px 32px rgba(0,0,0,0.65);}" +
      "#massyne-ve-bar{position:fixed;bottom:20px;left:20px;z-index:99999;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 14px;border-radius:16px;border:1px solid rgba(255,255,255,0.18);background:rgba(11,13,18,0.95);backdrop-filter:blur(12px);color:#f3f5f8;font:500 12px/1.2 Inter,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,0.75);max-width:calc(100vw - 40px);}" +
      "#massyne-ve-bar[hidden],#massyne-ve-fab[hidden]{display:none!important;}" +
      "#massyne-ve-bar button{padding:7px 11px;border-radius:9px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font:600 11px/1 Inter,sans-serif;cursor:pointer;}" +
      "#massyne-ve-bar button.ve-save{background:#c8ff2e;color:#07080a;border-color:transparent;}" +
      "#massyne-ve-bar label{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#b4bccb;}" +
      "#massyne-ve-bar input[type=color]{width:24px;height:24px;border:0;background:transparent;cursor:pointer;padding:0;}" +
      "body.massyne-ve-active [data-ve-editing]{outline:2px solid #c8ff2e!important;outline-offset:3px;border-radius:4px;cursor:text!important;}" +
      "body.massyne-ve-active *:hover{outline:1px dashed rgba(200,255,46,0.45);outline-offset:2px;}";
    document.head.appendChild(style);

    var fab = document.createElement("button");
    fab.id = "massyne-ve-fab";
    fab.type = "button";
    fab.textContent = "✎ Edit Site Live";
    fab.addEventListener("click", function () { setEditMode(true); });
    document.body.appendChild(fab);

    var bar = document.createElement("div");
    bar.id = "massyne-ve-bar";
    bar.hidden = true;
    bar.innerHTML =
      '<span style="color:#c8ff2e;font-weight:700;">LIVE EDIT</span>' +
      '<label>Accent <input id="ve-accent" type="color" value="' + (state.accent || "#e11d48") + '"></label>' +
      '<label>BG <input id="ve-bg" type="color" value="' + (state.bgColor || "#0b0b0e") + '"></label>' +
      '<button type="button" class="ve-save" id="ve-save-btn">Save to main</button>' +
      '<button type="button" id="ve-reset-btn">Reset</button>' +
      '<button type="button" id="ve-exit-btn">Done</button>' +
      '<span id="ve-status" style="font-size:11px;color:#9ba3b4;">Click any text on page to edit</span>';
    document.body.appendChild(bar);

    var statusEl = document.getElementById("ve-status");
    document.getElementById("ve-accent").addEventListener("input", function (e) {
      state.accent = e.target.value;
      applyOverrides(state);
    });
    document.getElementById("ve-bg").addEventListener("input", function (e) {
      state.bgColor = e.target.value;
      applyOverrides(state);
    });
    document.getElementById("ve-save-btn").addEventListener("click", function () {
      saveOverrides(statusEl);
    });
    document.getElementById("ve-reset-btn").addEventListener("click", function () {
      state = { accent: "", bgColor: "", texts: {} };
      saveOverrides(statusEl).then(function () { window.location.reload(); });
    });
    document.getElementById("ve-exit-btn").addEventListener("click", function () {
      setEditMode(false);
    });

    document.addEventListener("click", function (e) {
      if (!editMode) return;
      var el = e.target;
      if (!isEditableTextEl(el)) return;
      e.preventDefault();
      e.stopPropagation();
      el.setAttribute("contenteditable", "true");
      el.setAttribute("data-ve-editing", "1");
      el.focus();
      var onBlur = function () {
        var sel = getSelector(el);
        if (sel) state.texts[sel] = el.textContent;
        el.removeAttribute("contenteditable");
        el.removeAttribute("data-ve-editing");
        if (statusEl) statusEl.textContent = "Text updated — click Save to main";
        el.removeEventListener("blur", onBlur);
      };
      el.addEventListener("blur", onBlur);
    }, true);
  }

  async function init() {
    await loadOverrides();
    try {
      var res = await fetch("/api/studio-access", { credentials: "same-origin" });
      if (res.ok) {
        var data = await res.json();
        if (data && data.authenticated) mountEditorUI();
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
