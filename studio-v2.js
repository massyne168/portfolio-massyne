(function () {
  function initStudioV2() {
    const contentEl = document.getElementById("studio-content");
    const topbarActions = document.querySelector(".topbar-actions");
    if (!contentEl || !topbarActions || document.getElementById("studio-live-preview")) return;

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
    cmdBtn.className = "button button-quiet";
    cmdBtn.id = "v2-cmd-btn";
    cmdBtn.textContent = "⌘K Search";

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
})();
