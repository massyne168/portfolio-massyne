(function () {
  function initFullAccess() {
    const nav = document.querySelector(".studio-nav");
    const contentEl = document.getElementById("studio-content");
    const pageTitle = document.getElementById("page-title");
    if (!nav || !contentEl || document.querySelector('[data-page="full-access"]')) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-item";
    btn.setAttribute("data-page", "full-access");
    btn.innerHTML = '<span class="nav-icon" aria-hidden="true">⌘</span>Full Access<span class="nav-count">ALL</span>';
    nav.appendChild(btn);

    let filesCache = [];
    let currentFile = { path: "index.html", sha: "", content: "" };

    async function loadFileList() {
      const res = await fetch("/api/studio-files", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to list files");
      filesCache = Array.isArray(data.files) ? data.files : [];
      return filesCache;
    }

    async function loadFile(path) {
      const statusEl = document.getElementById("fa-status");
      const editorEl = document.getElementById("fa-editor");
      const msgEl = document.getElementById("fa-commit-msg");
      const selectEl = document.getElementById("fa-file-select");
      if (statusEl) statusEl.textContent = "Loading " + path + "...";
      try {
        const res = await fetch("/api/studio-files?path=" + encodeURIComponent(path), { credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Could not load file");
        currentFile = { path: data.path, sha: data.sha || "", content: data.content || "" };
        if (editorEl) editorEl.value = currentFile.content;
        if (msgEl) msgEl.value = "Update " + currentFile.path + " from MASSYNE Studio";
        if (selectEl) selectEl.value = currentFile.path;
        if (statusEl) statusEl.textContent = "Loaded " + currentFile.path + " (" + currentFile.content.length + " chars)";
      } catch (err) {
        if (statusEl) statusEl.textContent = "Error: " + (err.message || err);
      }
    }

    async function saveCurrentFile() {
      const statusEl = document.getElementById("fa-status");
      const editorEl = document.getElementById("fa-editor");
      const msgEl = document.getElementById("fa-commit-msg");
      const saveBtn = document.getElementById("fa-save-btn");
      if (!currentFile.path || !editorEl) return;
      if (saveBtn) saveBtn.disabled = true;
      if (statusEl) statusEl.textContent = "Publishing " + currentFile.path + " to main...";
      try {
        const res = await fetch("/api/studio-files", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: currentFile.path,
            sha: currentFile.sha,
            content: editorEl.value,
            message: (msgEl && msgEl.value.trim()) || ("Update " + currentFile.path + " from MASSYNE Studio")
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Save failed");
        currentFile.sha = data.sha || currentFile.sha;
        currentFile.content = editorEl.value;
        if (statusEl) statusEl.textContent = "Saved to main! Commit " + (data.commitSha ? data.commitSha.slice(0, 7) : "OK") + " — Vercel deploying...";
      } catch (err) {
        if (statusEl) statusEl.textContent = "Error: " + (err.message || err);
      } finally {
        if (saveBtn) saveBtn.disabled = false;
      }
    }

    async function openFullAccessView() {
      nav.querySelectorAll(".nav-item").forEach(function (item) {
        item.classList.toggle("is-active", item === btn);
      });
      if (pageTitle) pageTitle.textContent = "Full Access — All Portfolio Files";

      contentEl.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:14px;">' +
          '<div class="page-heading" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;">' +
            '<div><p class="eyebrow">FULL ACCESS / DIRECT TO MAIN</p><h1 style="margin:4px 0 0;">Edit Any Portfolio File</h1></div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              '<button type="button" id="fa-reload-btn" class="button button-quiet">Reload File</button>' +
              '<button type="button" id="fa-save-btn" class="button button-primary">Save &amp; Push to main</button>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;" id="fa-shortcuts">' +
            ["index.html", "style.css", "script.js", "studio-content.json", "site-theme.css", "project.html", "resume.html", "poster-lab.html"].map(function (f) {
              return '<button type="button" class="button button-quiet" data-fa-quick="' + f + '">' + f + '</button>';
            }).join("") +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">' +
            '<select id="fa-file-select" style="min-width:220px;padding:8px 10px;border-radius:8px;background:#0d0f14;color:#fff;border:1px solid rgba(255,255,255,0.16);"></select>' +
            '<input id="fa-find" type="text" placeholder="Find text..." style="padding:8px 10px;border-radius:8px;background:#0d0f14;color:#fff;border:1px solid rgba(255,255,255,0.16);min-width:150px;">' +
            '<input id="fa-replace" type="text" placeholder="Replace with..." style="padding:8px 10px;border-radius:8px;background:#0d0f14;color:#fff;border:1px solid rgba(255,255,255,0.16);min-width:150px;">' +
            '<button type="button" id="fa-replace-btn" class="button button-quiet">Replace All</button>' +
          '</div>' +
          '<input id="fa-commit-msg" type="text" placeholder="Commit message..." style="width:100%;padding:9px 12px;border-radius:8px;background:#0d0f14;color:#fff;border:1px solid rgba(255,255,255,0.16);font-size:12px;">' +
          '<p id="fa-status" style="margin:0;font-size:12px;color:#9ba3b4;">Loading file list...</p>' +
          '<textarea id="fa-editor" spellcheck="false" style="width:100%;min-height:520px;padding:14px;border-radius:12px;background:#07080b;color:#e6edf3;border:1px solid rgba(255,255,255,0.14);font-family:IBM Plex Mono,monospace;font-size:12px;line-height:1.55;resize:vertical;"></textarea>' +
        '</div>';

      const selectEl = document.getElementById("fa-file-select");
      document.getElementById("fa-save-btn").addEventListener("click", saveCurrentFile);
      document.getElementById("fa-reload-btn").addEventListener("click", function () { loadFile(currentFile.path); });
      document.getElementById("fa-replace-btn").addEventListener("click", function () {
        const findVal = document.getElementById("fa-find").value;
        const repVal = document.getElementById("fa-replace").value;
        const ed = document.getElementById("fa-editor");
        if (!findVal || !ed) return;
        const parts = ed.value.split(findVal);
        ed.value = parts.join(repVal);
        document.getElementById("fa-status").textContent = "Replaced " + (parts.length - 1) + " occurrence(s). Click Save & Push to main.";
      });
      contentEl.querySelectorAll("[data-fa-quick]").forEach(function (qb) {
        qb.addEventListener("click", function () { loadFile(qb.getAttribute("data-fa-quick")); });
      });
      selectEl.addEventListener("change", function () { loadFile(selectEl.value); });

      try {
        const list = await loadFileList();
        selectEl.innerHTML = list.map(function (f) {
          return '<option value="' + f.path + '">' + f.path + '</option>';
        }).join("");
        await loadFile(currentFile.path || (list[0] && list[0].path) || "index.html");
      } catch (err) {
        document.getElementById("fa-status").textContent = "Error: " + (err.message || err);
      }
    }

    btn.addEventListener("click", function (e) {
      e.stopImmediatePropagation();
      openFullAccessView();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFullAccess);
  } else {
    initFullAccess();
  }
})();
