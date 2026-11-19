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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudioV2);
  } else {
    initStudioV2();
  }
})();
