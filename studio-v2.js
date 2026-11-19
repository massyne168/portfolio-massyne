(function () {
  function initStudioV2() {
    const contentEl = document.getElementById("studio-content");
    const topbarActions = document.querySelector(".topbar-actions");
    if (!contentEl || !topbarActions || document.getElementById("studio-live-preview")) return;

    // 0. Add MASSYNE monogram & Upload Budget card
    const studioBrand = document.querySelector(".studio-brand");
    if (studioBrand && !studioBrand.querySelector(".v2-monogram")) {
      const monogram = document.createElement("span");
      monogram.className = "v2-monogram";
      monogram.textContent = "M";
      const brandCopy = studioBrand.querySelector(".brand-copy");
      if (brandCopy) {
        studioBrand.insertBefore(monogram, brandCopy);
      } else {
        studioBrand.prepend(monogram);
      }
    }

    const studioRail = document.querySelector(".studio-rail");
    if (studioRail && !studioRail.querySelector(".v2-budget-card")) {
      const budgetCard = document.createElement("div");
      budgetCard.className = "v2-budget-card";
      budgetCard.innerHTML = '<div class="v2-budget-row"><span>Upload Budget</span><strong>Auto-WebP · 3 MB max</strong></div><div class="v2-budget-track"><div class="v2-budget-fill"></div></div><div class="v2-budget-note">PNG/JPG &gt; 350 KB auto-compressed · Vercel safe</div>';
      const railStatus = studioRail.querySelector(".rail-status");
      if (railStatus) {
        studioRail.insertBefore(budgetCard, railStatus);
      } else {
        studioRail.appendChild(budgetCard);
      }
    }
    
    // 1. Wrap #studio-content in a split container + add Live Preview pane
    const splitWrap = document.createElement("div");
    splitWrap.className = "studio-workspace-split";
    contentEl.parentNode.insertBefore(splitWrap, contentEl);
    splitWrap.appendChild(contentEl);

    const previewPane = document.createElement("section");
    previewPane.id = "studio-live-preview";
    previewPane.className = "studio-preview-pane";
    previewPane.setAttribute("aria-label", "Live portfolio preview");
    previewPane.innerHTML =
      '<div class="studio-preview-bar">' +
        '<div class="studio-preview-title"><span class="studio-preview-dot"></span><span>Live Preview · index.html</span></div>' +
        '<div class="studio-preview-controls">' +
          '<button type="button" class="studio-preview-btn is-active" data-v2-mode="desktop">Desktop</button>' +
          '<button type="button" class="studio-preview-btn" data-v2-mode="mobile">Mobile</button>' +
          '<button type="button" class="studio-preview-btn" id="v2-reload-preview" title="Reload preview">↻</button>' +
          '<a class="studio-preview-btn" href="index.html" target="_blank" rel="noopener noreferrer" title="Open live site">↗</a>' +
        '</div>' +
      '</div>' +
      '<div class="studio-preview-stage">' +
        '<iframe id="studio-preview-iframe" class="studio-preview-iframe" src="index.html" title="MASSYNE Portfolio Live Preview"></iframe>' +
      '</div>';
    splitWrap.appendChild(previewPane);

    const iframe = document.getElementById("studio-preview-iframe");
    function reloadPreview() {
      if (iframe) iframe.src = "index.html?preview=" + Date.now();
    }

    previewPane.querySelectorAll("[data-v2-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const mode = btn.getAttribute("data-v2-mode");
        previewPane.querySelectorAll("[data-v2-mode]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        iframe.classList.toggle("is-mobile", mode === "mobile");
      });
    });

    document.getElementById("v2-reload-preview").addEventListener("click", reloadPreview);

    // 2. Add Command Palette (Ctrl+K) & Split Preview toggle to topbar
    const cmdBtn = document.createElement("button");
    cmdBtn.type = "button";
    cmdBtn.className = "v2-cmd-pill";
    cmdBtn.id = "v2-cmd-btn";
    cmdBtn.innerHTML = '<span>Search projects, actions...</span><kbd>Ctrl K</kbd>';

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "button button-quiet";
    toggleBtn.id = "v2-preview-toggle";
    toggleBtn.textContent = "Split Preview";
    toggleBtn.addEventListener("click", function () {
      previewPane.hidden = !previewPane.hidden;
    });

    const firstAction = topbarActions.firstElementChild;
    topbarActions.insertBefore(toggleBtn, firstAction ? firstAction.nextSibling : null);
    topbarActions.insertBefore(cmdBtn, toggleBtn);

    // 3. Auto-reload preview when save state updates to saved/published
    const saveState = document.getElementById("save-state");
    if (saveState && window.MutationObserver) {
      let lastText = "";
      new MutationObserver(function () {
        const text = (saveState.textContent || "").toLowerCase();
        if (text !== lastText && (text.includes("saved") || text.includes("published") || text.includes("synced"))) {
          lastText = text;
          setTimeout(reloadPreview, 600);
        }
      }).observe(saveState, { childList: true, subtree: true, characterData: true });
    }

    // 4. Command Palette (Ctrl+K)
    const overlay = document.createElement("div");
    overlay.id = "studio-cmd-overlay";
    overlay.className = "studio-cmd-overlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="studio-cmd-box">' +
        '<input id="studio-cmd-input" class="studio-cmd-input" type="text" placeholder="Jump to section or action... (ESC to close)">' +
        '<div id="studio-cmd-list" class="studio-cmd-list"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    const cmdInput = document.getElementById("studio-cmd-input");
    const cmdList = document.getElementById("studio-cmd-list");

    function getCommands() {
      const navBtns = Array.from(document.querySelectorAll(".studio-nav .nav-item"));
      const navCmds = navBtns.map(function (btn) {
        return {
          label: "Go to " + (btn.textContent || "").replace(/\s+/g, " ").trim(),
          hint: "Section",
          run: function () { btn.click(); }
        };
      });
      return navCmds.concat([
        { label: "Toggle Split-Screen Live Preview", hint: "Layout", run: function () { previewPane.hidden = !previewPane.hidden; } },
        { label: "Switch Preview to Mobile", hint: "Preview", run: function () { previewPane.hidden = false; iframe.classList.add("is-mobile"); } },
        { label: "Switch Preview to Desktop", hint: "Preview", run: function () { previewPane.hidden = false; iframe.classList.remove("is-mobile"); } },
        { label: "Reload Live Preview", hint: "Preview", run: reloadPreview }
      ]);
    }

    function renderCommands(filter) {
      const q = (filter || "").trim().toLowerCase();
      const cmds = getCommands().filter(function (c) {
        return c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q);
      });
      cmdList.innerHTML = "";
      cmds.forEach(function (c) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "studio-cmd-item";
        b.innerHTML = '<span>' + c.label + '</span><span class="studio-cmd-hint">' + c.hint + '</span>';
        b.addEventListener("click", function () {
          overlay.hidden = true;
          c.run();
        });
        cmdList.appendChild(b);
      });
    }

    function openCmd() {
      overlay.hidden = false;
      cmdInput.value = "";
      renderCommands("");
      setTimeout(function () { cmdInput.focus(); }, 20);
    }

    cmdBtn.addEventListener("click", openCmd);
    cmdInput.addEventListener("input", function () { renderCommands(cmdInput.value); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.hidden = true; });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCmd();
      } else if (e.key === "Escape" && !overlay.hidden) {
        overlay.hidden = true;
      }
    });
  }
function initStudioV2Extras() {
if (window.__studioV2Extras) return;
window.__studioV2Extras = true;
const PRESETS = [
["Neon Lime", "#c8ff2e"],
["Amber Forge", "#ff8a1f"],
["Chrome Silver", "#e4e8f0"],
["Cyber Violet", "#a78bfa"]
];
function enhanceStudioContent() {
const content = document.getElementById("studio-content");
if (!content) return;
const accentInput = content.querySelector('input[name="accent"], input[type="color"]');
if (accentInput && !accentInput.dataset.v2Presets) {
accentInput.dataset.v2Presets = "1";
const bar = document.createElement("div");
bar.className = "v2-color-presets";
bar.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;";
PRESETS.forEach(([label, hex]) => {
const btn = document.createElement("button");
btn.type = "button";
btn.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);color:inherit;font-size:12px;cursor:pointer;";
btn.innerHTML = '<span style="width:10px;height:10px;border-radius:999px;background:' + hex + ';display:inline-block;"></span>' + label + ' ' + hex;
btn.addEventListener("click", () => {
accentInput.value = hex;
accentInput.dispatchEvent(new Event("input", { bubbles: true }));
accentInput.dispatchEvent(new Event("change", { bubbles: true }));
});
bar.appendChild(btn);
});
accentInput.parentNode.insertBefore(bar, accentInput);
}
[
{ name: "portrait", accept: "image/*" },
{ name: "resume", accept: ".pdf" },
{ name: "portfolioPdf", accept: ".pdf" }
].forEach((cfg) => {
const inp = content.querySelector('input[name="' + cfg.name + '"]');
if (!inp || inp.dataset.v2Upload) return;
inp.dataset.v2Upload = "1";
const btn = document.createElement("button");
btn.type = "button";
btn.textContent = "Upload";
btn.style.cssText = "margin-left:8px;padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:inherit;font-size:12px;cursor:pointer;";
const fileInp = document.createElement("input");
fileInp.type = "file";
fileInp.accept = cfg.accept;
fileInp.hidden = true;
btn.addEventListener("click", () => fileInp.click());
fileInp.addEventListener("change", () => {
const file = fileInp.files && fileInp.files[0];
if (!file) return;
btn.disabled = true;
btn.textContent = "Uploading...";
const reader = new FileReader();
reader.onload = async () => {
try {
const base64 = String(reader.result || "").split(",")[1] || "";
const res = await fetch("/api/studio-media-upload", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ files: [{ name: file.name, type: file.type, data: base64 }] })
});
if (res.ok) {
const data = await res.json();
const p = data && data.files && data.files[0] && data.files[0].path;
if (p) {
inp.value = p;
inp.dispatchEvent(new Event("input", { bubbles: true }));
inp.dispatchEvent(new Event("change", { bubbles: true }));
}
}
} finally {
btn.disabled = false;
btn.textContent = "Upload";
fileInp.value = "";
}
};
reader.readAsDataURL(file);
});
inp.parentNode.insertBefore(btn, inp.nextSibling);
inp.parentNode.insertBefore(fileInp, btn.nextSibling);
});
}
function enhanceEditorDialog() {
const dialog = document.getElementById("editor-dialog");
if (!dialog) return;
const ta = dialog.querySelector('textarea[name="details"]');
if (!ta || ta.dataset.v2Obs) return;
ta.dataset.v2Obs = "1";
ta.hidden = true;
let rows = [];
try {
const parsed = JSON.parse(ta.value || "[]");
if (Array.isArray(parsed)) rows = parsed.map((r) => ({ title: (r && r.title) || "", text: (r && r.text) || "" }));
} catch (_) {}
const wrap = document.createElement("div");
wrap.className = "v2-obs-editor";
wrap.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:6px;";
const list = document.createElement("div");
list.style.cssText = "display:flex;flex-direction:column;gap:6px;";
function sync() {
ta.value = JSON.stringify(rows, null, 2);
ta.dispatchEvent(new Event("input", { bubbles: true }));
ta.dispatchEvent(new Event("change", { bubbles: true }));
}
function render() {
list.replaceChildren();
rows.forEach((row, idx) => {
const rEl = document.createElement("div");
rEl.style.cssText = "display:grid;grid-template-columns:1fr 1.5fr auto;gap:6px;align-items:center;";
const tInp = document.createElement("input");
tInp.type = "text";
tInp.placeholder = "Title";
tInp.value = row.title;
tInp.addEventListener("input", () => { rows[idx].title = tInp.value; sync(); });
const xInp = document.createElement("input");
xInp.type = "text";
xInp.placeholder = "Observation";
xInp.value = row.text;
xInp.addEventListener("input", () => { rows[idx].text = xInp.value; sync(); });
const del = document.createElement("button");
del.type = "button";
del.textContent = "Delete";
del.addEventListener("click", () => { rows.splice(idx, 1); sync(); render(); });
rEl.append(tInp, xInp, del);
list.appendChild(rEl);
});
}
const addBtn = document.createElement("button");
addBtn.type = "button";
addBtn.textContent = "+ Add observation";
addBtn.style.cssText = "align-self:flex-start;padding:6px 10px;border-radius:6px;cursor:pointer;";
addBtn.addEventListener("click", () => { rows.push({ title: "", text: "" }); sync(); render(); });
wrap.append(list, addBtn);
ta.parentNode.insertBefore(wrap, ta.nextSibling);
render();
}
const contentEl = document.getElementById("studio-content");
if (contentEl) {
new MutationObserver(enhanceStudioContent).observe(contentEl, { childList: true, subtree: true });
enhanceStudioContent();
}
const dialogEl = document.getElementById("editor-dialog");
if (dialogEl) {
new MutationObserver(enhanceEditorDialog).observe(dialogEl, { childList: true, subtree: true });
enhanceEditorDialog();
}
document.addEventListener("change", async (e) => {
const input = e.target;
if (!input || input.tagName !== "INPUT" || input.type !== "file" || input.dataset.v2WebpSkip) return;
const files = Array.from(input.files || []);
if (!files.some((f) => (f.type === "image/png" || f.type === "image/jpeg") && f.size > 350 * 1024)) return;
e.stopImmediatePropagation();
const dt = new DataTransfer();
for (const file of files) {
if ((file.type === "image/png" || file.type === "image/jpeg") && file.size > 350 * 1024) {
try {
const bmp = await createImageBitmap(file);
const scale = bmp.width > 1600 ? 1600 / bmp.width : 1;
const canvas = document.createElement("canvas");
canvas.width = Math.round(bmp.width * scale);
canvas.height = Math.round(bmp.height * scale);
canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.82));
if (blob) {
dt.items.add(new File([blob], file.name.replace(/\.(png|jpe?g)$/i, "") + ".webp", { type: "image/webp" }));
continue;
}
} catch (_) {}
}
dt.items.add(file);
}
input.files = dt.files;
input.dataset.v2WebpSkip = "1";
input.dispatchEvent(new Event("change", { bubbles: true }));
delete input.dataset.v2WebpSkip;
}, true);
}
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudioV2);
  } else {
    initStudioV2();
  }
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initStudioV2Extras);
} else {
initStudioV2Extras();
}
}(function () {
function injectFscStyles() {
if (document.getElementById("v2-fsc-styles")) return;
const st = document.createElement("style");
st.id = "v2-fsc-styles";
st.textContent = `
.v2-fsc-wrap{background:#0b0b0f;color:#f4f4f6;padding:24px;border-radius:18px;border:1px solid rgba(255,255,255,0.08);font-family:Inter,system-ui,sans-serif;max-width:1100px;margin:0 auto;}
.v2-fsc-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08);}
.v2-fsc-title{font-size:20px;font-weight:700;margin:0;letter-spacing:-0.02em;}
.v2-fsc-sub{font-size:13px;color:#9ca3af;margin:4px 0 0;}
.v2-fsc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;}
.v2-fsc-tab{background:#16161d;color:#a1a1aa;border:1px solid rgba(255,255,255,0.08);padding:10px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s;}
.v2-fsc-tab.active{background:#ff4d2e;color:#fff;border-color:#ff4d2e;}
.v2-fsc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;}
.v2-fsc-card{background:#14141b;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;}
.v2-fsc-card h4{margin:0;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;}
.v2-fsc-field{display:flex;flex-direction:column;gap:6px;}
.v2-fsc-field label{font-size:12px;color:#d4d4d8;font-weight:500;display:flex;justify-content:space-between;}
.v2-fsc-input,.v2-fsc-select,.v2-fsc-textarea{background:#0b0b0f;color:#f4f4f6;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:9px 12px;font-size:13px;width:100%;box-sizing:border-box;}
.v2-fsc-textarea{min-height:130px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.v2-fsc-btn{background:#ff4d2e;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:700;cursor:pointer;}
.v2-fsc-btn:disabled{opacity:0.6;cursor:not-allowed;}
.v2-fsc-btn-sec{background:#1f1f29;color:#e4e4e7;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;}
.v2-fsc-check{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0b0b0f;border:1px solid rgba(255,255,255,0.08);border-radius:10px;cursor:pointer;font-size:13px;}
.v2-fsc-exp-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:center;padding:10px;background:#0b0b0f;border-radius:10px;border:1px solid rgba(255,255,255,0.08);}
.v2-fsc-status{font-size:12px;color:#a1a1aa;}
`;
document.head.appendChild(st);
}
async function loadLatestContent() {
try {
const res = await fetch("/studio-content.json?t=" + Date.now());
if (res.ok) return await res.json();
} catch (_) {}
return window.MASSYNE_STUDIO_CONTENT || {};
}
function uploadMediaFile(file) {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = async () => {
try {
const base64 = String(reader.result || "").split(",")[1] || "";
const res = await fetch("/api/studio-media-upload", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ files: [{ name: file.name, type: file.type, data: base64 }] })
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || "Upload failed");
const url = (data.files && data.files[0] && (data.files[0].url || data.files[0].path)) || data.url || data.path || "";
resolve(url);
} catch (err) { reject(err); }
};
reader.onerror = () => reject(new Error("File read failed"));
reader.readAsDataURL(file);
});
}
function refreshPreviewIframe() {
const frame = document.getElementById("studio-live-preview") || document.querySelector("iframe");
if (frame && frame.src) {
const base = frame.src.split("?")[0];
frame.src = base + "?t=" + Date.now();
}
}
 async function renderFullSiteControl() {
injectFscStyles();
const host = document.getElementById("studio-content");
if (!host) return;
host.innerHTML = `<div class="v2-fsc-wrap"><p class="v2-fsc-status">Loading studio-content.json...</p></div>`;
const content = await loadLatestContent();
const bg = Object.assign({ type: "theme", color: "#0a0a0c", gradColor1: "#0b0b0f", gradColor2: "#1f1235", gradAngle: 135, url: "", fit: "cover", position: "center", overlay: 0, blur: 0, opacity: 100 }, content.background || (content.site && content.site.background) || {});
const extras = Object.assign({ heroBadge: "VISUAL THINKER.", heroRole: "", heroEyebrowLeft: "", heroEyebrowRight: "", heroPrimaryCta: "", heroSecondaryCta: "", skills: [], experience: [], sectionVisibility: { "#work": true, "#archive": true, "#motion": true, "#about": true, "#services": true, "#contact": true }, customCss: "" }, content.extras || {});
let expRows = Array.isArray(extras.experience) ? extras.experience.map(x => typeof x === "string" ? { role: x, company: "", period: "", description: "" } : Object.assign({ role: "", company: "", period: "", description: "" }, x)) : [];
let activeTab = "bg";

host.innerHTML = `
<div class="v2-fsc-wrap">
  <div class="v2-fsc-head">
    <div>
      <h2 class="v2-fsc-title">Full Site Control</h2>
      <p class="v2-fsc-sub">Background Studio, Hero & Badges, Skills & Experience, Sections & Custom CSS</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span id="fsc-status" class="v2-fsc-status">Ready</span>
      <button type="button" id="fsc-publish-btn" class="v2-fsc-btn">Save &amp; Publish to main</button>
    </div>
  </div>
  <div class="v2-fsc-tabs">
    <button type="button" class="v2-fsc-tab active" data-tab="bg">1. Background Studio</button>
    <button type="button" class="v2-fsc-tab" data-tab="hero">2. Hero &amp; Badges</button>
    <button type="button" class="v2-fsc-tab" data-tab="skills">3. Skills &amp; Experience</button>
    <button type="button" class="v2-fsc-tab" data-tab="sections">4. Sections &amp; Custom CSS</button>
  </div>
  <div id="fsc-panel-bg" class="v2-fsc-panel">
    <div class="v2-fsc-grid">
      <div class="v2-fsc-card">
        <h4>Type &amp; Colors</h4>
        <div class="v2-fsc-field"><label>Background Type</label><select id="fsc-bg-type" class="v2-fsc-select"><option value="theme">Theme (Default)</option><option value="color">Solid Color</option><option value="gradient">Gradient</option><option value="image">Image</option><option value="gif">GIF</option><option value="video">Video (MP4)</option></select></div>
        <div class="v2-fsc-field"><label>Solid Color</label><input type="color" id="fsc-bg-color" class="v2-fsc-input" style="height:40px;padding:4px;" value="${bg.color || "#0a0a0c"}"></div>
        <div class="v2-fsc-field"><label>Gradient Color 1</label><input type="color" id="fsc-bg-g1" class="v2-fsc-input" style="height:40px;padding:4px;" value="${bg.gradColor1 || "#0b0b0f"}"></div>
        <div class="v2-fsc-field"><label>Gradient Color 2</label><input type="color" id="fsc-bg-g2" class="v2-fsc-input" style="height:40px;padding:4px;" value="${bg.gradColor2 || "#1f1235"}"></div>
        <div class="v2-fsc-field"><label>Gradient Angle (deg)</label><input type="number" id="fsc-bg-gang" class="v2-fsc-input" min="0" max="360" value="${Number(bg.gradAngle ?? 135)}"></div>
      </div>
      <div class="v2-fsc-card">
        <h4>Media &amp; Upload</h4>
        <div class="v2-fsc-field"><label>Direct Upload (Image / GIF / MP4)</label><input type="file" id="fsc-bg-file" class="v2-fsc-input" accept="image/*,.gif,video/mp4,video/*"></div>
        <div class="v2-fsc-field"><label>Media Path / URL</label><input type="text" id="fsc-bg-url" class="v2-fsc-input" placeholder="/media/bg.mp4 or https://..." value="${bg.url || ""}"></div>
        <div class="v2-fsc-field"><label>Fit</label><select id="fsc-bg-fit" class="v2-fsc-select"><option value="cover">cover</option><option value="contain">contain</option></select></div>
        <div class="v2-fsc-field"><label>Position</label><input type="text" id="fsc-bg-pos" class="v2-fsc-input" placeholder="center" value="${bg.position || "center"}"></div>
      </div>
      <div class="v2-fsc-card">
        <h4>Effects</h4>
        <div class="v2-fsc-field"><label><span>Overlay Darken</span><span id="fsc-ov-val">${Number(bg.overlay || 0)}%</span></label><input type="range" id="fsc-bg-ov" min="0" max="85" value="${Number(bg.overlay || 0)}"></div>
        <div class="v2-fsc-field"><label><span>Blur</span><span id="fsc-bl-val">${Number(bg.blur || 0)}px</span></label><input type="range" id="fsc-bg-bl" min="0" max="24" value="${Number(bg.blur || 0)}"></div>
        <div class="v2-fsc-field"><label><span>Opacity</span><span id="fsc-op-val">${Number(bg.opacity ?? 100)}%</span></label><input type="range" id="fsc-bg-op" min="10" max="100" value="${Number(bg.opacity ?? 100)}"></div>
      </div>
    </div>
  </div>
  <div id="fsc-panel-hero" class="v2-fsc-panel" style="display:none;">
    <div class="v2-fsc-grid">
      <div class="v2-fsc-card">
        <h4>Hero &amp; Badges</h4>
        <div class="v2-fsc-field"><label>Hero Badge</label><input type="text" id="fsc-hero-badge" class="v2-fsc-input" placeholder="VISUAL THINKER." value="${extras.heroBadge || ""}"></div>
        <div class="v2-fsc-field"><label>Hero Role</label><input type="text" id="fsc-hero-role" class="v2-fsc-input" value="${extras.heroRole || ""}"></div>
        <div class="v2-fsc-field"><label>Eyebrow Left</label><input type="text" id="fsc-hero-el" class="v2-fsc-input" value="${extras.heroEyebrowLeft || ""}"></div>
        <div class="v2-fsc-field"><label>Eyebrow Right</label><input type="text" id="fsc-hero-er" class="v2-fsc-input" value="${extras.heroEyebrowRight || ""}"></div>
        <div class="v2-fsc-field"><label>Primary CTA</label><input type="text" id="fsc-hero-c1" class="v2-fsc-input" value="${extras.heroPrimaryCta || ""}"></div>
        <div class="v2-fsc-field"><label>Secondary CTA</label><input type="text" id="fsc-hero-c2" class="v2-fsc-input" value="${extras.heroSecondaryCta || ""}"></div>
      </div>
    </div>
  </div>
  <div id="fsc-panel-skills" class="v2-fsc-panel" style="display:none;">
    <div class="v2-fsc-grid">
      <div class="v2-fsc-card">
        <h4>Skills (Comma-Separated)</h4>
        <div class="v2-fsc-field"><label>Skills List</label><textarea id="fsc-skills" class="v2-fsc-textarea" style="min-height:90px;" placeholder="After Effects, Premiere Pro, Figma, Brand Strategy">${Array.isArray(extras.skills) ? extras.skills.join(", ") : ""}</textarea></div>
      </div>
      <div class="v2-fsc-card" style="grid-column:span 2;">
        <div style="display:flex;justify-content:space-between;align-items:center;"><h4>Experience Timeline</h4><button type="button" id="fsc-add-exp" class="v2-fsc-btn-sec">+ Add Row</button></div>
        <div id="fsc-exp-list" style="display:flex;flex-direction:column;gap:8px;"></div>
      </div>
    </div>
  </div>
  <div id="fsc-panel-sections" class="v2-fsc-panel" style="display:none;">
    <div class="v2-fsc-grid">
      <div class="v2-fsc-card">
        <h4>Section Visibility</h4>
        ${["#work", "#archive", "#motion", "#about", "#services", "#contact"].map(sec => {
          const checked = extras.sectionVisibility && extras.sectionVisibility[sec] === false ? "" : "checked";
          return `<label class="v2-fsc-check"><input type="checkbox" class="fsc-sec-chk" data-sec="${sec}" ${checked}><span>Show ${sec}</span></label>`;
        }).join("")}
      </div>
      <div class="v2-fsc-card">
        <h4>Custom CSS</h4>
        <textarea id="fsc-custom-css" class="v2-fsc-textarea" placeholder="/* Custom CSS injected into portfolio */">${extras.customCss || ""}</textarea>
      </div>
    </div>
  </div>
</div>`;

document.getElementById("fsc-bg-type").value = bg.type || "theme";
document.getElementById("fsc-bg-fit").value = bg.fit === "contain" ? "contain" : "cover";

const statusEl = document.getElementById("fsc-status");
const setStatus = msg => { if (statusEl) statusEl.textContent = msg; };

host.querySelectorAll(".v2-fsc-tab").forEach(tab => {
tab.addEventListener("click", () => {
activeTab = tab.dataset.tab;
host.querySelectorAll(".v2-fsc-tab").forEach(t => t.classList.toggle("active", t === tab));
host.querySelectorAll(".v2-fsc-panel").forEach(p => { p.style.display = p.id === "fsc-panel-" + activeTab ? "block" : "none"; });
});
});

const bindRange = (id, lblId, unit) => {
const el = document.getElementById(id);
const lbl = document.getElementById(lblId);
if (el && lbl) el.addEventListener("input", () => { lbl.textContent = el.value + unit; });
};
bindRange("fsc-bg-ov", "fsc-ov-val", "%");
bindRange("fsc-bg-bl", "fsc-bl-val", "px");
bindRange("fsc-bg-op", "fsc-op-val", "%");

const fileInput = document.getElementById("fsc-bg-file");
if (fileInput) {
fileInput.addEventListener("change", async () => {
const f = fileInput.files && fileInput.files[0];
if (!f) return;
setStatus("Uploading media...");
try {
const url = await uploadMediaFile(f);
document.getElementById("fsc-bg-url").value = url;
if (/video/i.test(f.type)) document.getElementById("fsc-bg-type").value = "video";
else if (/gif/i.test(f.type)) document.getElementById("fsc-bg-type").value = "gif";
else document.getElementById("fsc-bg-type").value = "image";
setStatus("Uploaded: " + url);
} catch (err) {
setStatus("Upload error: " + err.message);
}
});
}

function renderExpRows() {
const wrap = document.getElementById("fsc-exp-list");
if (!wrap) return;
wrap.innerHTML = "";
expRows.forEach((row, idx) => {
const div = document.createElement("div");
div.className = "v2-fsc-exp-row";
div.innerHTML = `<input class="v2-fsc-input" placeholder="Role" value="${row.role || ""}" data-k="role"><input class="v2-fsc-input" placeholder="Company" value="${row.company || ""}" data-k="company"><input class="v2-fsc-input" placeholder="Period" value="${row.period || ""}" data-k="period"><button type="button" class="v2-fsc-btn-sec">Remove</button>`;
div.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => { expRows[idx][inp.dataset.k] = inp.value; }));
div.querySelector("button").addEventListener("click", () => { expRows.splice(idx, 1); renderExpRows(); });
wrap.appendChild(div);
});
}
renderExpRows();
const addExpBtn = document.getElementById("fsc-add-exp");
if (addExpBtn) addExpBtn.addEventListener("click", () => { expRows.push({ role: "", company: "", period: "", description: "" }); renderExpRows(); });

const pubBtn = document.getElementById("fsc-publish-btn");
if (pubBtn) {
pubBtn.addEventListener("click", async () => {
pubBtn.disabled = true;
setStatus("Publishing to main...");
try {
const latest = await loadLatestContent();
const newBg = {
type: document.getElementById("fsc-bg-type").value,
color: document.getElementById("fsc-bg-color").value,
gradColor1: document.getElementById("fsc-bg-g1").value,
gradColor2: document.getElementById("fsc-bg-g2").value,
gradAngle: Number(document.getElementById("fsc-bg-gang").value || 135),
url: document.getElementById("fsc-bg-url").value.trim(),
fit: document.getElementById("fsc-bg-fit").value,
position: document.getElementById("fsc-bg-pos").value.trim() || "center",
overlay: Number(document.getElementById("fsc-bg-ov").value || 0),
blur: Number(document.getElementById("fsc-bg-bl").value || 0),
opacity: Number(document.getElementById("fsc-bg-op").value || 100)
};
const secVis = {};
host.querySelectorAll(".fsc-sec-chk").forEach(c => { secVis[c.dataset.sec] = c.checked; });
const skillsArr = document.getElementById("fsc-skills").value.split(",").map(s => s.trim()).filter(Boolean);
const newExtras = {
heroBadge: document.getElementById("fsc-hero-badge").value.trim(),
heroRole: document.getElementById("fsc-hero-role").value.trim(),
heroEyebrowLeft: document.getElementById("fsc-hero-el").value.trim(),
heroEyebrowRight: document.getElementById("fsc-hero-er").value.trim(),
heroPrimaryCta: document.getElementById("fsc-hero-c1").value.trim(),
heroSecondaryCta: document.getElementById("fsc-hero-c2").value.trim(),
skills: skillsArr,
experience: expRows.filter(r => r.role || r.company || r.period),
sectionVisibility: secVis,
customCss: document.getElementById("fsc-custom-css").value
};
const merged = Object.assign({}, latest, { background: newBg, extras: newExtras });
const res = await fetch("/api/studio-publish", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ content: merged })
});
const out = await res.json();
if (!res.ok) throw new Error(out.error || "Publish failed");
setStatus("Published to main!");
refreshPreviewIframe();
} catch (err) {
setStatus("Error: " + err.message);
} finally {
pubBtn.disabled = false;
}
});
}
}

function initFullSiteControl() {
const nav = document.querySelector(".studio-nav");
if (!nav || nav.querySelector("[data-page='v2-control']")) return;
const sample = nav.querySelector("button");
const btn = document.createElement("button");
btn.type = "button";
btn.className = sample ? sample.className.replace(/\bactive\b/g, "").trim() : "nav-btn";
btn.setAttribute("data-page", "v2-control");
btn.textContent = "Full Site Control";
btn.addEventListener("click", () => {
nav.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === btn));
renderFullSiteControl();
});
nav.appendChild(btn);
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initFullSiteControl);
} else {
initFullSiteControl();
}
})();
)();
