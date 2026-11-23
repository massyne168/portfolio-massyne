(function () {
  "use strict";

  function initFullAccess() {
    const nav = document.querySelector(".studio-nav");
    const contentEl = document.getElementById("studio-content");
    const pageTitle = document.getElementById("page-title");
    if (!contentEl) return;

    // Add navigation button if not already present
    let btn = document.querySelector('[data-page="full-access"]');
    if (!btn && nav) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-item";
      btn.setAttribute("data-page", "full-access");
      btn.innerHTML = '<span class="nav-icon" aria-hidden="true">⌘</span>Full Access<span class="nav-count">ALL</span>';
      nav.appendChild(btn);
    }

    let filesCache = [];
    let currentFile = { path: "index.html", sha: "", content: "", isNew: false, isDirty: false };
    let currentFilter = "all";
    let searchQuery = "";
    let collapsedFolders = new Set();
    let currentBranch = "main";

    function showToast(message, isError = false) {
      const toast = document.getElementById("studio-toast");
      if (!toast) return;
      toast.textContent = message;
      toast.className = "studio-toast is-visible" + (isError ? " is-error" : "");
      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(() => {
        toast.className = "studio-toast";
      }, 4000);
    }

    async function loadFileList() {
      const res = await fetch("/api/studio-files", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || data.error || "Failed to list files");
      currentBranch = data.branch || "main";
      filesCache = Array.isArray(data.files) ? data.files : [];
      return filesCache;
    }

    async function loadFile(filePath) {
      const statusEl = document.getElementById("fa-status");
      const editorEl = document.getElementById("fa-editor");
      const msgEl = document.getElementById("fa-commit-msg");
      const breadcrumbEl = document.getElementById("fa-file-breadcrumb");
      const metaEl = document.getElementById("fa-file-meta");
      const dirtyDot = document.getElementById("fa-dirty-dot");

      if (statusEl) statusEl.textContent = `Loading ${filePath}...`;
      try {
        const res = await fetch("/api/studio-files?path=" + encodeURIComponent(filePath), { credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || data.error || "Could not load file");

        currentFile = {
          path: data.path,
          sha: data.sha || "",
          content: data.content || "",
          isNew: false,
          isDirty: false
        };

        if (editorEl) {
          editorEl.value = currentFile.content;
          updateLineNumbers();
        }
        if (msgEl) msgEl.value = `Update ${currentFile.path} via MASSYNE Studio Console`;
        if (breadcrumbEl) breadcrumbEl.textContent = currentFile.path;
        if (dirtyDot) dirtyDot.hidden = true;
        if (metaEl) {
          const kb = (BufferByteLength(currentFile.content) / 1024).toFixed(1);
          metaEl.textContent = `${kb} KB · SHA ${currentFile.sha ? currentFile.sha.slice(0, 7) : "NEW"}`;
        }
        if (statusEl) statusEl.textContent = `Ready · ${currentFile.path}`;
        highlightActiveFileInList(currentFile.path);
      } catch (err) {
        if (statusEl) statusEl.textContent = `Error: ${err.message || err}`;
        showToast(err.message || "Failed to load file", true);
      }
    }

    function BufferByteLength(str) {
      return new Blob([str]).size;
    }

    function createNewFilePrompt() {
      const suggested = prompt("Enter new relative file path (e.g. notes.md, projects/new-study.html, scripts/util.mjs):", "");
      if (!suggested) return;
      const clean = suggested.trim().replace(/^\/+/, "");
      if (!clean) return;

      currentFile = {
        path: clean,
        sha: "",
        content: "",
        isNew: true,
        isDirty: true
      };

      const editorEl = document.getElementById("fa-editor");
      const msgEl = document.getElementById("fa-commit-msg");
      const breadcrumbEl = document.getElementById("fa-file-breadcrumb");
      const metaEl = document.getElementById("fa-file-meta");
      const dirtyDot = document.getElementById("fa-dirty-dot");
      const statusEl = document.getElementById("fa-status");

      if (editorEl) {
        editorEl.value = "";
        updateLineNumbers();
        editorEl.focus();
      }
      if (msgEl) msgEl.value = `Create ${currentFile.path} via MASSYNE Studio Console`;
      if (breadcrumbEl) breadcrumbEl.textContent = `${currentFile.path} (NEW FILE)`;
      if (dirtyDot) dirtyDot.hidden = false;
      if (metaEl) metaEl.textContent = "0.0 KB · DRAFT";
      if (statusEl) statusEl.textContent = `Drafting new file: ${currentFile.path}`;
      showToast(`Ready to create new file: ${clean}`);
    }

    async function saveCurrentFile() {
      const statusEl = document.getElementById("fa-status");
      const editorEl = document.getElementById("fa-editor");
      const msgEl = document.getElementById("fa-commit-msg");
      const saveBtn = document.getElementById("fa-save-btn");
      const dirtyDot = document.getElementById("fa-dirty-dot");
      const metaEl = document.getElementById("fa-file-meta");

      if (!currentFile.path || !editorEl) return;
      if (saveBtn) saveBtn.disabled = true;
      if (statusEl) statusEl.textContent = `Pushing ${currentFile.path} to ${currentBranch}...`;

      try {
        const payload = {
          path: currentFile.path,
          content: editorEl.value,
          message: (msgEl && msgEl.value.trim()) || `Update ${currentFile.path} via MASSYNE Studio Console`
        };
        if (currentFile.sha) {
          payload.sha = currentFile.sha;
        }

        const res = await fetch("/api/studio-files", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || data.error || "Save failed");

        currentFile.sha = data.sha || currentFile.sha;
        currentFile.content = editorEl.value;
        currentFile.isDirty = false;
        currentFile.isNew = false;

        if (dirtyDot) dirtyDot.hidden = true;
        if (statusEl) {
          const shortCommit = data.commitSha ? data.commitSha.slice(0, 7) : "OK";
          statusEl.textContent = `Saved to ${data.branch || currentBranch} (commit ${shortCommit}) · Deploying...`;
        }
        if (metaEl) {
          const kb = (BufferByteLength(currentFile.content) / 1024).toFixed(1);
          metaEl.textContent = `${kb} KB · SHA ${currentFile.sha ? currentFile.sha.slice(0, 7) : "OK"}`;
        }

        showToast(`Saved ${currentFile.path} to ${data.branch || currentBranch}!`);

        // Refresh file list if this was a newly created file
        loadFileList().then(renderTree).catch(() => {});
      } catch (err) {
        if (statusEl) statusEl.textContent = `Save failed: ${err.message || err}`;
        showToast(err.message || "Save failed", true);
      } finally {
        if (saveBtn) saveBtn.disabled = false;
      }
    }

    function updateLineNumbers() {
      const editorEl = document.getElementById("fa-editor");
      const gutterEl = document.getElementById("fa-line-numbers");
      if (!editorEl || !gutterEl) return;
      const count = editorEl.value.split("\n").length;
      let nums = "";
      for (let i = 1; i <= count; i++) {
        nums += i + "\n";
      }
      gutterEl.textContent = nums;
    }

    function highlightActiveFileInList(activePath) {
      document.querySelectorAll(".fa-tree-file").forEach(el => {
        el.classList.toggle("is-active", el.getAttribute("data-file-path") === activePath);
      });
    }

    function getFileIcon(filename) {
      const ext = filename.split(".").pop().toLowerCase();
      switch (ext) {
        case "html": return '<span class="fa-ext-badge ext-html">HTML</span>';
        case "css":  return '<span class="fa-ext-badge ext-css">CSS</span>';
        case "js":
        case "mjs":  return '<span class="fa-ext-badge ext-js">JS</span>';
        case "json": return '<span class="fa-ext-badge ext-json">JSON</span>';
        case "md":   return '<span class="fa-ext-badge ext-md">MD</span>';
        case "yml":
        case "yaml": return '<span class="fa-ext-badge ext-yml">YML</span>';
        case "svg":  return '<span class="fa-ext-badge ext-svg">SVG</span>';
        default:     return '<span class="fa-ext-badge ext-txt">TXT</span>';
      }
    }

    function renderTree() {
      const treeContainer = document.getElementById("fa-tree-container");
      if (!treeContainer) return;

      // Filter files by search and extension pill
      const filtered = filesCache.filter(item => {
        const p = item.path.toLowerCase();
        if (searchQuery && !p.includes(searchQuery.toLowerCase())) return false;
        if (currentFilter === "html" && !p.endsWith(".html")) return false;
        if (currentFilter === "css" && !p.endsWith(".css")) return false;
        if (currentFilter === "js" && !(p.endsWith(".js") || p.endsWith(".mjs"))) return false;
        if (currentFilter === "json" && !p.endsWith(".json")) return false;
        if (currentFilter === "api" && !p.startsWith("api/")) return false;
        return true;
      });

      // Group into folders
      const groups = {};
      for (const f of filtered) {
        const parts = f.path.split("/");
        let folder = "root";
        if (parts.length > 1) {
          folder = parts.slice(0, parts.length - 1).join("/");
        }
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(f);
      }

      const folderKeys = Object.keys(groups).sort((a, b) => {
        if (a === "root") return -1;
        if (b === "root") return 1;
        return a.localeCompare(b);
      });

      if (!folderKeys.length) {
        treeContainer.innerHTML = '<div class="fa-tree-empty">No matching files found.</div>';
        return;
      }

      let html = "";
      for (const folder of folderKeys) {
        const files = groups[folder];
        const isCollapsed = collapsedFolders.has(folder);
        const folderDisplayName = folder === "root" ? "root / repository root" : folder + "/";
        const folderIcon = isCollapsed ? "▸" : "▾";

        html += `
          <div class="fa-tree-group">
            <button type="button" class="fa-tree-folder-head" data-folder-toggle="${escapeHtml(folder)}">
              <span class="fa-folder-caret">${folderIcon}</span>
              <span class="fa-folder-title">${escapeHtml(folderDisplayName)}</span>
              <span class="fa-folder-count">${files.length}</span>
            </button>
            <div class="fa-tree-folder-list" ${isCollapsed ? 'style="display:none;"' : ""}>
              ${files.map(f => {
                const basename = f.path.split("/").pop();
                const kb = (f.size / 1024).toFixed(1);
                const isActive = f.path === currentFile.path;
                return `
                  <button type="button" class="fa-tree-file ${isActive ? "is-active" : ""}" data-file-path="${escapeHtml(f.path)}">
                    ${getFileIcon(basename)}
                    <span class="fa-file-name" title="${escapeHtml(f.path)}">${escapeHtml(basename)}</span>
                    <span class="fa-file-size">${kb}KB</span>
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }

      treeContainer.innerHTML = html;

      // Bind folder toggles
      treeContainer.querySelectorAll("[data-folder-toggle]").forEach(btn => {
        btn.addEventListener("click", () => {
          const folder = btn.getAttribute("data-folder-toggle");
          if (collapsedFolders.has(folder)) {
            collapsedFolders.delete(folder);
          } else {
            collapsedFolders.add(folder);
          }
          renderTree();
        });
      });

      // Bind file clicks
      treeContainer.querySelectorAll("[data-file-path]").forEach(btn => {
        btn.addEventListener("click", () => {
          const path = btn.getAttribute("data-file-path");
          if (path !== currentFile.path || currentFile.isNew) {
            loadFile(path);
          }
        });
      });
    }

    function escapeHtml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    async function openFullAccessView() {
      // Update active state in nav
      document.querySelectorAll(".studio-nav .nav-item").forEach(item => {
        item.classList.toggle("is-active", item === btn);
      });
      document.querySelectorAll("[data-console-tab]").forEach(tab => {
        tab.classList.toggle("is-active", tab.getAttribute("data-console-tab") === "full-access");
      });
      if (pageTitle) pageTitle.textContent = "Full Access — Pro Code Console";

      contentEl.innerHTML = `
        <div class="fa-workspace">
          <!-- Left Explorer Sidebar -->
          <aside class="fa-sidebar" aria-label="Code File Explorer">
            <div class="fa-sidebar-header">
              <div class="fa-sidebar-title">
                <span class="fa-sidebar-label">REPOSITORY TREE</span>
                <span class="fa-branch-pill" id="fa-branch-badge">${escapeHtml(currentBranch)}</span>
              </div>
              <button type="button" class="fa-btn fa-btn-new" id="fa-new-file-btn" title="Create a new file">+ New File</button>
            </div>

            <!-- Search input -->
            <div class="fa-search-bar">
              <input type="text" id="fa-search-input" class="fa-input" placeholder="Quick find file (e.g. index, api, css)..." autocomplete="off" spellcheck="false">
            </div>

            <!-- Extension Filter Pills -->
            <div class="fa-filter-bar" id="fa-filter-pills">
              <button type="button" class="fa-pill is-active" data-filter="all">All</button>
              <button type="button" class="fa-pill" data-filter="html">HTML</button>
              <button type="button" class="fa-pill" data-filter="css">CSS</button>
              <button type="button" class="fa-pill" data-filter="js">JS</button>
              <button type="button" class="fa-pill" data-filter="json">JSON</button>
              <button type="button" class="fa-pill" data-filter="api">API</button>
            </div>

            <!-- Tree container -->
            <div class="fa-tree-scroll" id="fa-tree-container">
              <div class="fa-tree-loading">Loading repository files...</div>
            </div>
          </aside>

          <!-- Main Code Editor Panel -->
          <section class="fa-editor-panel" aria-label="Code Editor">
            <div class="fa-editor-toolbar">
              <div class="fa-toolbar-left">
                <span class="fa-breadcrumb" id="fa-file-breadcrumb">${escapeHtml(currentFile.path)}</span>
                <span class="fa-dirty-dot" id="fa-dirty-dot" title="Unsaved changes" hidden>●</span>
              </div>
              <div class="fa-toolbar-right">
                <span class="fa-meta" id="fa-file-meta">Loading...</span>
                <span class="fa-kbd-hint">⌘S to save</span>
                <button type="button" id="fa-reload-btn" class="fa-btn fa-btn-ghost" title="Reload current file from repository">Reload</button>
              </div>
            </div>

            <!-- Find & Replace Sub-toolbar -->
            <div class="fa-replace-toolbar">
              <div class="fa-replace-group">
                <input type="text" id="fa-find" class="fa-input fa-input-sm" placeholder="Find text in file...">
                <input type="text" id="fa-replace" class="fa-input fa-input-sm" placeholder="Replace with...">
                <button type="button" id="fa-replace-btn" class="fa-btn fa-btn-sm">Replace All</button>
              </div>
              <div class="fa-editor-hint">Tab key inserts 2 spaces</div>
            </div>

            <!-- Editor Surface with Line Numbers -->
            <div class="fa-editor-container">
              <pre class="fa-line-numbers" id="fa-line-numbers" aria-hidden="true">1\n</pre>
              <textarea id="fa-editor" class="fa-textarea" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder="// Loading file content..."></textarea>
            </div>

            <!-- Bottom Commit & Action Bar -->
            <div class="fa-commit-bar">
              <div class="fa-commit-input-wrapper">
                <input type="text" id="fa-commit-msg" class="fa-input fa-commit-input" placeholder="Commit message for this change..." value="Update ${escapeHtml(currentFile.path)} via MASSYNE Studio Console">
              </div>
              <div class="fa-commit-actions">
                <span class="fa-status" id="fa-status">Ready</span>
                <button type="button" id="fa-save-btn" class="button button-primary fa-btn-save">
                  <span>Save &amp; Push</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      `;

      // Wire up editor elements
      const editorEl = document.getElementById("fa-editor");
      const lineGutter = document.getElementById("fa-line-numbers");
      const dirtyDot = document.getElementById("fa-dirty-dot");
      const searchInput = document.getElementById("fa-search-input");
      const saveBtn = document.getElementById("fa-save-btn");
      const reloadBtn = document.getElementById("fa-reload-btn");
      const replaceBtn = document.getElementById("fa-replace-btn");
      const newFileBtn = document.getElementById("fa-new-file-btn");

      // Sync scroll between editor and gutter
      editorEl.addEventListener("scroll", () => {
        lineGutter.scrollTop = editorEl.scrollTop;
      });

      // Update line numbers and dirty state on input
      editorEl.addEventListener("input", () => {
        updateLineNumbers();
        currentFile.isDirty = true;
        dirtyDot.hidden = false;
      });

      // Handle Tab key
      editorEl.addEventListener("keydown", e => {
        if (e.key === "Tab") {
          e.preventDefault();
          const start = editorEl.selectionStart;
          const end = editorEl.selectionEnd;
          editorEl.value = editorEl.value.substring(0, start) + "  " + editorEl.value.substring(end);
          editorEl.selectionStart = editorEl.selectionEnd = start + 2;
          updateLineNumbers();
          currentFile.isDirty = true;
          dirtyDot.hidden = false;
        } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          saveCurrentFile();
        }
      });

      // Filter pills
      document.querySelectorAll("#fa-filter-pills .fa-pill").forEach(pill => {
        pill.addEventListener("click", () => {
          document.querySelectorAll("#fa-filter-pills .fa-pill").forEach(p => p.classList.remove("is-active"));
          pill.classList.add("is-active");
          currentFilter = pill.getAttribute("data-filter");
          renderTree();
        });
      });

      // Realtime search
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim();
        renderTree();
      });

      // Replace All button
      replaceBtn.addEventListener("click", () => {
        const findVal = document.getElementById("fa-find").value;
        const repVal = document.getElementById("fa-replace").value;
        if (!findVal || !editorEl) return;
        const parts = editorEl.value.split(findVal);
        const occurrences = parts.length - 1;
        editorEl.value = parts.join(repVal);
        updateLineNumbers();
        currentFile.isDirty = true;
        dirtyDot.hidden = false;
        document.getElementById("fa-status").textContent = `Replaced ${occurrences} occurrence(s).`;
        showToast(`Replaced ${occurrences} occurrence(s) in editor.`);
      });

      // Save and reload buttons
      saveBtn.addEventListener("click", saveCurrentFile);
      reloadBtn.addEventListener("click", () => {
        if (currentFile.path) loadFile(currentFile.path);
      });
      newFileBtn.addEventListener("click", createNewFilePrompt);

      // Load files and initial file
      try {
        const list = await loadFileList();
        const branchBadge = document.getElementById("fa-branch-badge");
        if (branchBadge) branchBadge.textContent = currentBranch;
        renderTree();

        // Load index.html by default
        await loadFile(currentFile.path || (list[0] && list[0].path) || "index.html");
      } catch (err) {
        document.getElementById("fa-status").textContent = `Error: ${err.message || err}`;
        showToast(err.message || "Failed to load files", true);
      }
    }

    if (btn) {
      btn.addEventListener("click", e => {
        e.stopImmediatePropagation();
        openFullAccessView();
      });
    }

    // Export hook for topbar or external trigger
    window.MASSYNE_OPEN_FULL_ACCESS = openFullAccessView;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFullAccess);
  } else {
    initFullAccess();
  }
})();
