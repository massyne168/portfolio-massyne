(() => {
  "use strict";

  const STORAGE_KEY = "massyne-studio-content-v1";
  const DEFAULT_SITE_COLORS = Object.freeze({ accent: "#990011", light: "#FCF6F5" });
  const DEFAULT_SITE_BACKGROUND = Object.freeze({ type: "theme", color: "#FCF6F5", src: "", overlay: 0, fit: "cover", position: "center" });
  const safeHex = (value, fallback = null) => /^#[0-9a-f]{6}$/i.test(String(value || "").trim())
    ? String(value).trim().toUpperCase()
    : fallback;
  const safeBackgroundSource = value => {
    const source = String(value || "").trim();
    if (!source) return "";
    if (/^https:\/\//i.test(source)) {
      try { return new URL(source).protocol === "https:" ? new URL(source).href : ""; }
      catch (_) { return ""; }
    }
    const path = source.replace(/^\/+/, "");
    return /^(images|assets)\//i.test(path) && !/(?:^|\/)(?:\.{1,2}|%2e%2e)(?:\/|$)/i.test(path) && !/[<>"'\\\s]/.test(path)
      ? path
      : "";
  };
  let backgroundPreviewObjectUrl = "";
  let backgroundPreviewFile = null;
  const titles = {
    overview: "Overview",
    projects: "Selected work",
    archive: "Archive",
    motion: "Motion",
    services: "Services",
    profile: "Studio profile",
    appearance: "Site appearance"
  };
  const contentRoot = document.getElementById("studio-content");
  const dialog = document.getElementById("editor-dialog");
  const editorBody = document.getElementById("editor-body");
  const toast = document.getElementById("studio-toast");
  const saveState = document.getElementById("save-state");
  const pageTitle = document.getElementById("page-title");
  let activePage = "overview";
  let toastTimer = 0;
  let state;
  let githubConnected = false;
  let githubStatusMessage = "Checking the permanent GitHub connection…";
  let pendingPublish = false;
  let publishing = false;
  let contentRevision = 0;
  let draggedItem = null;
  const githubApi = "/api/studio-publish";
  const githubDialog = document.getElementById("github-dialog");
  const githubConnectButton = document.getElementById("github-connect-button");

  const clone = value => JSON.parse(JSON.stringify(value));
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const idFor = (prefix, value = "") => {
    const text = String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const slug = text.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54);
    return slug ? `${prefix}-${slug}` : `${prefix}-${Date.now()}`;
  };
  const safeArray = value => Array.isArray(value) ? value : [];
  const normalizeState = input => ({
    schemaVersion: 1,
    site: {
      ...(input.site || {}),
      colors: {
        accent: safeHex(input.site?.colors?.accent, DEFAULT_SITE_COLORS.accent),
        light: safeHex(input.site?.colors?.light, DEFAULT_SITE_COLORS.light)
      },
      background: (() => {
        const source = input.site?.background && typeof input.site.background === "object" ? input.site.background : {};
        const siteLight = safeHex(input.site?.colors?.light, DEFAULT_SITE_COLORS.light);
        const type = ["theme", "color", "image", "gif", "video"].includes(source.type) ? source.type : DEFAULT_SITE_BACKGROUND.type;
        const overlay = Number(source.overlay);
        return {
          type,
          color: safeHex(source.color, siteLight),
          src: safeBackgroundSource(source.src),
          overlay: Number.isFinite(overlay) ? Math.min(100, Math.max(0, Math.round(overlay))) : DEFAULT_SITE_BACKGROUND.overlay,
          fit: ["cover", "contain"].includes(source.fit) ? source.fit : DEFAULT_SITE_BACKGROUND.fit,
          position: ["center", "top", "bottom", "left", "right"].includes(source.position) ? source.position : DEFAULT_SITE_BACKGROUND.position
        };
      })()
    },
    services: safeArray(input.services).map(item => ({ ...item })),
    motion: safeArray(input.motion).map(item => ({ ...item })),
    archive: safeArray(input.archive).map(item => ({ ...item })),
    projects: safeArray(input.projects).map(item => ({ ...item })),
    removedProjects: [...new Set(safeArray(input.removedProjects).map(String))]
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function setSaveState(message = "Draft saved locally", unsaved = false) {
    saveState.querySelector("span").textContent = message;
    saveState.classList.toggle("is-unsaved", unsaved);
  }

  function storeLocally(message, pending) {
    pendingPublish = pending;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ content: state, pending: pendingPublish }));
      setSaveState(message, pendingPublish);
      return true;
    } catch (error) {
      saveState.querySelector("span").textContent = "Browser storage is full";
      saveState.classList.add("is-unsaved");
      showToast("This draft is too large for browser storage. Export a package to keep a copy.");
      return false;
    }
  }

  function persist(message = "Changes saved", pending = true) {
    const cached = storeLocally(message, pending);
    if (!pending) return true;
    contentRevision += 1;
    if (githubConnected) {
      void publishToGitHub();
    } else {
      showToast("Draft saved. Connect the permanent GitHub publishing secret in Vercel.");
      openGitHubDialog();
    }
    return cached;
  }

  async function loadState() {
    let source = {};
    let loadedFromGitHub = false;
    try {
      const response = await fetch(`https://raw.githubusercontent.com/massyne168/portfolio-massyne/main/studio-content.json?studio=${Date.now()}`, { cache: "no-store" });
      if (response.ok) {
        source = await response.json();
        loadedFromGitHub = true;
      }
      else throw new Error("GitHub content could not be read");
    } catch (error) {
      try {
        const response = await fetch("studio-content.json", { cache: "no-store" });
        if (response.ok) source = await response.json();
      } catch (_) {
        showToast("Studio content could not be loaded. Check your connection and refresh.");
      }
    }
    const fromProjectFile = safeArray(window.MASSYNE_PROJECTS).map(project => ({ ...project }));
    const base = normalizeState({ ...source, projects: safeArray(source.projects).length ? source.projects : fromProjectFile });
    try {
      const localDraft = localStorage.getItem(STORAGE_KEY);
      if (localDraft) {
        const parsed = JSON.parse(localDraft);
        if (parsed?.pending && Array.isArray(parsed.content?.projects)) {
          state = normalizeState(parsed.content);
          pendingPublish = true;
          setSaveState("Local draft waiting to publish", true);
          return;
        }
        if (!loadedFromGitHub && Array.isArray(parsed?.content?.projects)) {
          state = normalizeState(parsed.content);
          setSaveState("Last saved content · offline cache");
          return;
        }
      }
    } catch (error) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
    state = base;
    setSaveState("Content loaded");
  }

  function updateConnectionButton() {
    if (!githubConnectButton) return;
    githubConnectButton.innerHTML = githubConnected
      ? '<span aria-hidden="true">✓</span> GitHub connected'
      : '<span aria-hidden="true">⌘</span> Connect GitHub';
    githubConnectButton.classList.toggle("is-connected", githubConnected);
    githubConnectButton.setAttribute("aria-label", githubConnected ? "GitHub connected" : "Connect GitHub");
    githubConnectButton.title = githubConnected
      ? "Publishing is connected securely through Vercel."
      : "Configure the permanent GitHub token in Vercel.";
  }

  async function checkGitHubConnection() {
    try {
      const response = await fetch(githubApi, { cache: "no-store", credentials: "same-origin" });
      const result = await response.json().catch(() => ({}));
      githubConnected = response.ok && result.connected === true;
      githubStatusMessage = result.message || (githubConnected
        ? "GitHub is connected securely on the server."
        : "Add the fine-grained token to the Vercel Production environment, then redeploy.");
    } catch (error) {
      githubConnected = false;
      githubStatusMessage = "Could not check the GitHub connection. Refresh and try again.";
    }
    updateConnectionButton();
    const status = document.getElementById("github-status-message");
    if (status) status.textContent = githubStatusMessage;
  }

  function openGitHubDialog() {
    if (githubConnected) {
      showToast("GitHub publishing is connected securely through Vercel.");
      return;
    }
    if (!githubDialog.open) githubDialog.showModal();
    const status = document.getElementById("github-status-message");
    if (status) status.textContent = githubStatusMessage;
  }

  async function publishToGitHub() {
    if (!githubConnected) {
      openGitHubDialog();
      return false;
    }
    if (publishing) return false;
    publishing = true;
    try {
      let latestCommit = "";
      while (pendingPublish && githubConnected) {
        const revision = contentRevision;
        const snapshot = clone(state);
        setSaveState("Committing to main…", true);
        const response = await fetch(githubApi, {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: snapshot })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401 || response.status === 503) {
            githubConnected = false;
            githubStatusMessage = result.message || "Update the GitHub token in Vercel and redeploy.";
            updateConnectionButton();
            const status = document.getElementById("github-status-message");
            if (status) status.textContent = githubStatusMessage;
          }
          throw new Error(result.message || "GitHub could not publish these changes.");
        }
        latestCommit = String(result.commit || "");
        if (revision === contentRevision) {
          storeLocally("Committed to main", false);
        }
      }
      if (latestCommit) showToast("Saved to main · " + latestCommit.slice(0, 7) + ". The public site is deploying.");
      return true;
    } catch (error) {
      storeLocally("Changes waiting to publish", true);
      showToast("GitHub save failed: " + error.message);
      return false;
    } finally {
      publishing = false;
    }
  }

  const itemLabel = page => ({
    projects: "project", archive: "archive piece", motion: "motion project", services: "service"
  })[page];
  const collectionTitle = page => ({
    projects: "Selected work", archive: "Archive", motion: "Motion work", services: "Services"
  })[page];
  const collectionDescription = page => ({
    projects: "Edit the case study details, artwork and supporting notes for each portfolio project.",
    archive: "Manage the supporting artwork, category and accessible description shown in the archive.",
    motion: "Keep motion studies, source media and editorial labels organized in one place.",
    services: "Shape the four disciplines and their descriptions that introduce the studio."
  })[page];
  const listFor = page => page === "projects" ? state.projects : state[page];
  const titleFor = item => item.title || item.name || "Untitled";

  function imageMarkup(src, alt, kind = "") {
    const image = src
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || "")}" loading="lazy" decoding="async" onerror="this.remove()">`
      : `<span class="art-placeholder">${kind === "video" || kind === "gif" ? "MOTION / MEDIA SOURCE" : "NO ARTWORK PREVIEW"}</span>`;
    return `<div class="card-art">${image}${kind ? `<span class="kind-tag">${escapeHtml(kind)}</span>` : ""}</div>`;
  }

  function heading(eyebrow, title, description, action = "") {
    return `<div class="page-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ""}</div>`;
  }

  function renderOverview() {
    const counts = [
      ["Selected work", state.projects.length, "Case studies", "▧"],
      ["Archive pieces", state.archive.length, "Supporting artwork", "▤"],
      ["Motion projects", state.motion.length, "Video & animation", "▷"],
      ["Services", state.services.length, "Studio disciplines", "✳"]
    ];
    const recent = state.projects.slice(0, 5).map(project => `
      <div class="recent-row">
        <div class="recent-thumb">${project.image ? `<img src="${escapeHtml(project.image)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</div>
        <div class="recent-info"><strong>${escapeHtml(titleFor(project))}</strong><small>${escapeHtml(project.category || "Portfolio project")}</small></div>
        <span class="recent-year">${escapeHtml(project.year || "—")}</span>
      </div>`).join("");
    return `
      <section class="welcome-panel" aria-labelledby="welcome-title">
        <div class="welcome-copy"><p class="eyebrow">CONTENT CONTROL / 01</p><h1 id="welcome-title">Your work,<br><em>well kept.</em></h1>
          <p>A considered workspace for the projects, stories and details behind the MASSYNE portfolio.</p>
          <div class="welcome-meta"><b aria-hidden="true">●</b> ${escapeHtml(state.site.location || "Morocco — Worldwide")} <span>/</span> PRIVATE CONTENT DESK</div>
        </div><div class="welcome-art" aria-hidden="true">M<span>.</span></div>
      </section>
      <section class="metric-grid" aria-label="Portfolio content totals">${counts.map(([label, value, note, icon]) => `
        <article class="metric-card"><div class="metric-top"><span>${label}</span><span aria-hidden="true">${icon}</span></div><strong class="metric-value">${value}</strong><div class="metric-foot"><b>LIVE SET</b><span>/ ${note}</span></div></article>`).join("")}
      </section>
      <div class="dashboard-grid">
        <section class="dashboard-panel" aria-labelledby="recent-heading"><div class="panel-head"><h2 id="recent-heading">Recently updated content</h2><button class="text-link" type="button" data-page="projects">Browse work <span aria-hidden="true">↗</span></button></div><div class="recent-list">${recent || '<div class="empty-state"><div><strong>No selected work yet</strong><p>Import a content package to get started.</p></div></div>'}</div></section>
        <section class="dashboard-panel" aria-labelledby="quick-heading"><div class="panel-head"><h2 id="quick-heading">Quick actions</h2></div><div class="quick-actions">
          <button class="quick-action" type="button" data-action="new-project"><span class="quick-icon">＋</span><span><strong>Add a project</strong><small>Create a new case study draft</small></span></button>
          <button class="quick-action" type="button" data-action="go-page" data-page="archive"><span class="quick-icon">▤</span><span><strong>Review the archive</strong><small>Curate supporting artwork</small></span></button>
          <button class="quick-action" type="button" data-action="go-page" data-page="profile"><span class="quick-icon">◎</span><span><strong>Update studio details</strong><small>Profile, links and availability</small></span></button>
          <button class="quick-action" type="button" data-action="go-page" data-page="appearance"><span class="quick-icon">◉</span><span><strong>Manage site appearance</strong><small>Colors, background and media</small></span></button>
          <button class="quick-action" type="button" data-action="export"><span class="quick-icon">↓</span><span><strong>Export content package</strong><small>Keep a portable copy of your edits</small></span></button>
        </div><div class="overview-note"><span aria-hidden="true">ⓘ</span><span><b>Save to GitHub main.</b> Connect once in this tab, then every Save publishes your changes. Refresh loads the latest committed content.</span></div></section>
      </div>`;
  }

  function renderCollection(page) {
    const select = document.getElementById("collection-filter");
    const search = document.getElementById("collection-search");
    const results = document.getElementById("collection-results");
    const count = document.getElementById("collection-count");
    if (!results || !count) return;
    const query = (search?.value || "").trim().toLowerCase();
    const category = select?.value || "all";
    const items = listFor(page);
    const filtered = items.filter(item => {
      const haystack = [item.title, item.category, item.summary, item.focus, item.description, item.source, item.image, item.slug].join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (category === "all" || item.category === category);
    });
    count.innerHTML = `<b>${filtered.length}</b> of ${items.length} ${escapeHtml(collectionTitle(page).toLowerCase())}`;
    if (!filtered.length) {
      results.innerHTML = `<div class="empty-state"><div><strong>${query ? "No matching content" : "Nothing here yet"}</strong><p>${query ? "Try another search or category." : "Add an item to begin building this collection."}</p></div></div>`;
      return;
    }
    results.innerHTML = filtered.map((item, visibleIndex) => {
      const preview = page === "projects" || page === "archive" ? item.image : "";
      const kind = page === "motion" ? item.kind : "";
      const secondary = page === "projects" ? (item.focus || item.summary || "") : page === "archive" ? item.alt : page === "motion" ? item.source : item.description;
      const date = page === "projects" ? item.year || "PROJECT" : page === "motion" ? kind || "MOTION" : page.toUpperCase();
      const itemId = String(item.id || item.slug || "");
      const previousItem = filtered[visibleIndex - 1];
      const nextItem = filtered[visibleIndex + 1];
      const previousId = previousItem ? String(previousItem.id || previousItem.slug || "") : "";
      const nextId = nextItem ? String(nextItem.id || nextItem.slug || "") : "";
      return `<article class="content-card" data-card-id="${escapeHtml(itemId)}" data-collection="${page}">
        ${imageMarkup(preview, item.alt || item.title, kind)}
        <div class="card-body"><div class="card-overline"><span>${escapeHtml(item.category || "Uncategorized")}</span><span>${escapeHtml(date)}</span></div>
        <h2 class="card-title" title="${escapeHtml(titleFor(item))}">${escapeHtml(titleFor(item))}</h2><p class="card-summary">${escapeHtml(secondary)}</p>
        <div class="card-footer"><small>${escapeHtml(item.slug || item.source || item.link || "Content item")}</small><div class="card-actions">
          <button class="icon-button reorder-handle" type="button" draggable="true" aria-label="Drag ${escapeHtml(titleFor(item))} to reorder" title="Drag to reorder" data-drag-handle>⠿</button>
          <button class="icon-button reorder-button" type="button" aria-label="Move ${escapeHtml(titleFor(item))} up" title="Move up" data-action="move-item" data-direction="up" data-collection="${page}" data-id="${escapeHtml(itemId)}" data-target-id="${escapeHtml(previousId)}" ${previousId ? "" : "disabled"}>↑</button>
          <button class="icon-button reorder-button" type="button" aria-label="Move ${escapeHtml(titleFor(item))} down" title="Move down" data-action="move-item" data-direction="down" data-collection="${page}" data-id="${escapeHtml(itemId)}" data-target-id="${escapeHtml(nextId)}" ${nextId ? "" : "disabled"}>↓</button>
          <button class="icon-button" type="button" aria-label="Edit ${escapeHtml(titleFor(item))}" title="Edit" data-action="edit" data-collection="${page}" data-id="${escapeHtml(item.id || item.slug || "")}">✎</button>
          <button class="icon-button danger" type="button" aria-label="Delete ${escapeHtml(titleFor(item))}" title="Delete" data-action="delete" data-collection="${page}" data-id="${escapeHtml(item.id || item.slug || "")}">×</button>
        </div></div></div></article>`;
    }).join("");
  }

  function renderCollectionPage(page) {
    const action = page === "projects"
      ? '<button class="button button-quiet" type="button" data-action="export-projects">Export project source</button>'
      : "";
    const categories = [...new Set(listFor(page).map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const filters = categories.length > 1 ? `<select class="filter-select" id="collection-filter" aria-label="Filter by category"><option value="all">All categories</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select>` : "";
    const addLabel = page === "projects" ? "Add project" : page === "archive" ? "Add artwork" : page === "motion" ? "Add motion" : "Add service";
    contentRoot.innerHTML = `
      ${heading(`CONTENT / ${String(["projects", "archive", "motion", "services"].indexOf(page) + 1).padStart(2, "0")}`, collectionTitle(page), collectionDescription(page), `${action}<button class="button button-primary" type="button" data-action="new-item" data-collection="${page}">＋ ${addLabel}</button>`)}
      <div class="collection-toolbar"><div class="toolbar-left"><label class="search-box"><span aria-hidden="true">⌕</span><input id="collection-search" type="search" autocomplete="off" placeholder="Search ${escapeHtml(collectionTitle(page).toLowerCase())}…" aria-label="Search ${escapeHtml(collectionTitle(page).toLowerCase())}"></label>${filters}</div><div class="toolbar-right"><span class="collection-order-hint">Drag the grip or use the arrows to set website order.</span><span class="collection-meta" id="collection-count"></span></div></div>
      <div class="collection-grid" id="collection-results"></div>`;
    renderCollection(page);
  }

  function profileInput(key, label, value, help = "", type = "text") {
    return `<div class="field"><label for="profile-${key}">${escapeHtml(label)}</label><input id="profile-${key}" name="${key}" type="${type}" value="${escapeHtml(value)}" autocomplete="off">${help ? `<small class="field-help">${escapeHtml(help)}</small>` : ""}</div>`;
  }

  function renderProfile() {
    const site = state.site;
    contentRoot.innerHTML = `
      ${heading("STUDIO / 06", "Studio profile", "Keep the public-facing identity, availability and contact routes together.")}
      <div class="profile-layout">
        <form class="form-panel" id="profile-form"><h2>Portfolio identity</h2><p>Save commits these changes to GitHub main. Refresh the dashboard to load the latest version.</p>
          <div class="field-grid">
            ${profileInput("name", "Studio name", site.name || "")}
            ${profileInput("tagline", "Tagline", site.tagline || "")}
            ${profileInput("location", "Location line", site.location || "")}
            ${profileInput("availability", "Availability", site.availability || "inquiries", "Use inquiries, open, limited or closed.")}
            <div class="field wide"><label for="profile-headline">Hero introduction</label><textarea id="profile-headline" name="headline" class="large-field">${escapeHtml(site.headline || "")}</textarea></div>
            ${profileInput("aboutHeadline", "About heading", site.aboutHeadline || "")}
            ${profileInput("email", "Email", site.email || "", "", "email")}
            <div class="field wide"><label for="profile-aboutLead">About introduction</label><textarea id="profile-aboutLead" name="aboutLead">${escapeHtml(site.aboutLead || "")}</textarea></div>
            <div class="field wide"><label for="profile-aboutDescription">About description</label><textarea id="profile-aboutDescription" name="aboutDescription" class="large-field">${escapeHtml(site.aboutDescription || "")}</textarea></div>
            <div class="field wide"><label for="profile-availabilityDescription">Availability note</label><textarea id="profile-availabilityDescription" name="availabilityDescription">${escapeHtml(site.availabilityDescription || "")}</textarea></div>
            ${profileInput("whatsapp", "WhatsApp URL", site.whatsapp || "", "", "url")}
            ${profileInput("instagram", "Instagram URL", site.instagram || "", "", "url")}
            ${profileInput("behance", "Behance URL", site.behance || "", "", "url")}
            ${profileInput("portrait", "Portrait image path", site.portrait || "")}
            ${profileInput("resume", "Resume page", site.resume || "")}
            ${profileInput("portfolioPdf", "Portfolio PDF path", site.portfolioPdf || "")}
          </div>
          <div class="form-actions"><button class="button button-quiet" type="reset">Reset form</button><button class="button button-primary" type="submit">Save profile</button></div>
        </form>
        <aside class="profile-preview">
          <div class="profile-card"><div class="profile-avatar" aria-hidden="true">M<span>.</span></div><h3>${escapeHtml(site.name || "MASSYNE")}</h3><p>${escapeHtml(site.tagline || "")}</p><span class="profile-status">${escapeHtml(site.availability || "inquiries")}</span></div>
          <div class="publish-note"><strong>Publishing to main</strong>Connect GitHub in the top bar. Your fine-grained token stays in this tab’s memory; reconnect after a refresh to publish again.</div>
          <button class="button button-quiet" type="button" data-action="export">↓ Export current package</button>
        </aside>
      </div>
      <div class="dashboard-panel" style="margin-top:15px"><div class="panel-head"><h2>Service descriptions</h2><button class="text-link" type="button" data-page="services">Manage services ↗</button></div><p style="margin:0;color:#908c93;font-size:10px;line-height:1.7">Services, selected projects, archive artwork and motion projects are managed in their own sections. Export includes every section.</p></div>`;
    document.getElementById("profile-form").addEventListener("submit", saveProfile);
  }

  function renderAppearance() {
    if (backgroundPreviewObjectUrl) {
      URL.revokeObjectURL(backgroundPreviewObjectUrl);
      backgroundPreviewObjectUrl = "";
      backgroundPreviewFile = null;
    }
    const colors = state.site.colors || DEFAULT_SITE_COLORS;
    const background = state.site.background || { ...DEFAULT_SITE_BACKGROUND, color: colors.light };
    contentRoot.innerHTML = `
      ${heading("SITE / 07", "Site appearance", "Set the colors and background used across the public portfolio.")}
      <div class="appearance-layout">
        <form class="form-panel" id="appearance-form">
          <h2>Portfolio colors</h2>
          <p>These colors update the homepage, project pages, resume, navigation, buttons and site accents.</p>
          <div class="field-grid">
            <div class="field">
              <label for="appearance-accent">Primary accent</label>
              <div class="site-color-input-row">
                <input type="color" value="${escapeHtml(colors.accent)}" data-palette-picker="accent" aria-label="Choose primary accent">
                <input id="appearance-accent" name="accent" type="text" value="${escapeHtml(colors.accent)}" maxlength="7" pattern="#[0-9A-Fa-f]{6}" autocomplete="off" spellcheck="false" required data-palette-hex="accent">
              </div>
              <small class="field-help">Main accent for links, buttons, borders and highlights.</small>
            </div>
            <div class="field">
              <label for="appearance-light">Light color</label>
              <div class="site-color-input-row">
                <input type="color" value="${escapeHtml(colors.light)}" data-palette-picker="light" aria-label="Choose light color">
                <input id="appearance-light" name="light" type="text" value="${escapeHtml(colors.light)}" maxlength="7" pattern="#[0-9A-Fa-f]{6}" autocomplete="off" spellcheck="false" required data-palette-hex="light">
              </div>
              <small class="field-help">Main light background and light text color. Keep it bright for the dark theme.</small>
            </div>
          </div>
          <p class="palette-contrast-note" id="palette-contrast-note" role="status" aria-live="polite">Preview updates as you edit.</p>
          <section class="site-background-editor" aria-labelledby="site-background-heading">
            <div class="site-background-editor-head"><h2 id="site-background-heading">Site background</h2><p>Use the theme background, a solid color, an image, a GIF or an MP4 video.</p></div>
            <div class="field-grid">
              ${field("backgroundType", "Background type", background.type, { options: [
                { value: "theme", label: "Use light / dark theme" },
                { value: "color", label: "Solid color" },
                { value: "image", label: "Image" },
                { value: "gif", label: "Animated GIF" },
                { value: "video", label: "MP4 video" }
              ] })}
              <div class="field" id="background-color-control">
                <label for="appearance-background-color">Background color</label>
                <div class="site-color-input-row">
                  <input type="color" value="${escapeHtml(background.color || colors.light)}" data-background-color-picker aria-label="Choose site background color">
                  <input id="appearance-background-color" name="backgroundColor" type="text" value="${escapeHtml(background.color || colors.light)}" maxlength="7" pattern="#[0-9A-Fa-f]{6}" autocomplete="off" spellcheck="false" required data-background-color-hex>
                </div>
                <small class="field-help">Used for a solid background and behind media.</small>
              </div>
            </div>
            <div class="site-background-media-fields" id="background-media-fields">
              <div class="field-grid">
                ${field("backgroundPath", "Media path or HTTPS URL", background.src || "", { wide: true, help: "Upload a file here or enter an existing path such as images/studio-uploads/background.mp4." })}
                ${fileUploadField("backgroundUpload", "Upload background media", "PNG, JPG, WEBP, GIF or MP4. Keep the selected file under 3 MB.", { accept: "image/png,image/jpeg,image/webp,image/gif,video/mp4" })}
              </div>
              <div class="field-grid site-background-display-fields" id="background-display-fields">
                ${field("backgroundFit", "Media fit", background.fit || "cover", { options: [
                  { value: "cover", label: "Cover the screen" },
                  { value: "contain", label: "Show the whole file" }
                ] })}
                ${field("backgroundPosition", "Media position", background.position || "center", { options: [
                  { value: "center", label: "Center" },
                  { value: "top", label: "Top" },
                  { value: "bottom", label: "Bottom" },
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" }
                ] })}
                <div class="field wide">
                  <label for="field-backgroundOverlay">Dark overlay <output id="background-overlay-value">${Number(background.overlay || 0)}%</output></label>
                  <input id="field-backgroundOverlay" name="backgroundOverlay" type="range" min="0" max="100" step="5" value="${Number(background.overlay || 0)}">
                  <small class="field-help">Raise it if the background makes text harder to read.</small>
                </div>
              </div>
            </div>
          </section>
          <div class="form-actions"><button class="button button-quiet" type="reset">Reset form</button><button class="button button-primary" type="submit">Save appearance</button></div>
        </form>
        <aside class="appearance-preview-column" aria-label="Site appearance preview">
          <div class="dashboard-panel">
            <div class="panel-head"><h2>Color preview</h2><span class="collection-meta">SITE PALETTE</span></div>
            <div class="site-palette-preview" id="site-palette-preview">
              <div class="palette-preview-light"><span>LIGHT SURFACE</span><strong>MASSYNE</strong><small>Portfolio / Selected work</small></div>
              <div class="palette-preview-accent"><span>PRIMARY ACCENT</span><strong>VIEW PROJECT ↗</strong><small>Buttons / links / highlights</small></div>
            </div>
          </div>
          <div class="dashboard-panel">
            <div class="panel-head"><h2>Background preview</h2><span class="collection-meta">PUBLIC SITE</span></div>
            <div class="site-background-preview" id="site-background-preview"><span>LIVE SITE BACKGROUND</span></div>
          </div>
          <div class="publish-note"><strong>Publishes to the public site</strong>Saving sends colors and background media settings to GitHub main. Uploaded media is stored in the portfolio repository.</div>
        </aside>
      </div>`;
    const form = document.getElementById("appearance-form");
    const syncPreview = event => {
      const key = event.target.dataset.palettePicker || event.target.dataset.paletteHex;
      if (key === "accent" || key === "light") {
        const picker = form.querySelector(`[data-palette-picker="${key}"]`);
        const hex = form.querySelector(`[data-palette-hex="${key}"]`);
        if (event.target.dataset.palettePicker) hex.value = event.target.value.toUpperCase();
        else {
          const valid = safeHex(event.target.value);
          if (valid) picker.value = valid;
        }
      }
      if (event.target.hasAttribute("data-background-color-picker")) {
        form.querySelector("[data-background-color-hex]").value = event.target.value.toUpperCase();
      } else if (event.target.hasAttribute("data-background-color-hex")) {
        const valid = safeHex(event.target.value);
        if (valid) form.querySelector("[data-background-color-picker]").value = valid;
      }
      if (event.target.matches('input[type="file"][name="backgroundUpload"]')) updateUploadSelection(event.target);
      const overlay = form.querySelector('[name="backgroundOverlay"]');
      document.getElementById("background-overlay-value").textContent = `${overlay.value}%`;
      updatePalettePreview(form);
      updateBackgroundControls(form);
      updateBackgroundPreview(form);
    };
    form.addEventListener("input", syncPreview);
    form.addEventListener("change", syncPreview);
    form.addEventListener("reset", () => window.setTimeout(() => {
      updatePalettePreview(form);
      updateBackgroundControls(form);
      updateBackgroundPreview(form);
    }, 0));
    form.addEventListener("submit", saveAppearance);
    updatePalettePreview(form);
    updateBackgroundControls(form);
    updateBackgroundPreview(form);
  }

  function updateBackgroundControls(form) {
    const type = form.elements.backgroundType.value;
    form.querySelector("#background-color-control").hidden = type !== "color";
    form.elements.backgroundColor.required = type === "color";
    form.querySelector("#background-media-fields").hidden = !["image", "gif", "video"].includes(type);
  }

  function updateBackgroundPreview(form) {
    const preview = document.getElementById("site-background-preview");
    const type = form.elements.backgroundType.value;
    const color = safeHex(form.elements.backgroundColor.value, state.site.colors.light);
    const path = safeBackgroundSource(form.elements.backgroundPath.value);
    const file = form.querySelector('[name="backgroundUpload"]').files?.[0] || null;
    preview.style.backgroundColor = type === "theme" ? safeHex(form.elements.light.value, state.site.colors.light) : color;
    preview.replaceChildren();
    let source = "";
    if (file) {
      if (backgroundPreviewFile !== file) {
        if (backgroundPreviewObjectUrl) URL.revokeObjectURL(backgroundPreviewObjectUrl);
        backgroundPreviewObjectUrl = URL.createObjectURL(file);
        backgroundPreviewFile = file;
      }
      source = backgroundPreviewObjectUrl;
    } else {
      if (backgroundPreviewObjectUrl) URL.revokeObjectURL(backgroundPreviewObjectUrl);
      backgroundPreviewObjectUrl = "";
      backgroundPreviewFile = null;
      source = path ? (/^https:\/\//i.test(path) ? path : "/" + path) : "";
    }
    if (type === "image" || type === "gif" || type === "video") {
      if (source) {
        const media = document.createElement(type === "video" ? "video" : "img");
        media.className = "site-background-preview-media";
        media.style.objectFit = form.elements.backgroundFit.value;
        media.style.objectPosition = form.elements.backgroundPosition.value;
        if (type === "video") {
          media.muted = true;
          media.autoplay = true;
          media.loop = true;
          media.playsInline = true;
          media.preload = "metadata";
          media.src = source;
        } else {
          media.alt = "";
          media.src = source;
        }
        preview.append(media);
      }
      const overlay = document.createElement("div");
      overlay.className = "site-background-preview-overlay";
      overlay.style.opacity = String(Math.min(100, Math.max(0, Number(form.elements.backgroundOverlay.value) || 0)) / 100);
      preview.append(overlay);
    }
    const label = document.createElement("span");
    label.textContent = type === "theme" ? "LIGHT / DARK THEME" : type === "color" ? "SOLID COLOR" : source ? type.toUpperCase() : "CHOOSE OR UPLOAD MEDIA";
    preview.append(label);
  }

  function updatePalettePreview(form) {
    const accent = safeHex(form.querySelector('[data-palette-hex="accent"]').value);
    const light = safeHex(form.querySelector('[data-palette-hex="light"]').value);
    const preview = document.getElementById("site-palette-preview");
    const note = document.getElementById("palette-contrast-note");
    if (!accent || !light) {
      note.textContent = "Enter both colors as 6-digit HEX values, for example #990011.";
      note.classList.add("is-warning");
      return;
    }
    preview.style.setProperty("--preview-accent", accent);
    preview.style.setProperty("--preview-light", light);
    const luminance = hex => {
      const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
        .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const values = [luminance(accent), luminance(light)].sort((a, b) => b - a);
    const contrast = (values[0] + 0.05) / (values[1] + 0.05);
    note.textContent = contrast >= 4.5
      ? `Text contrast: ${contrast.toFixed(1)}:1 — readable for normal text.`
      : `Text contrast: ${contrast.toFixed(1)}:1 — consider adjusting the accent or light color for readable text.`;
    note.classList.toggle("is-warning", contrast < 4.5);
  }

  async function saveAppearance(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const accent = safeHex(form.elements.accent.value);
    const light = safeHex(form.elements.light.value);
    const backgroundType = form.elements.backgroundType.value;
    const selectedBackgroundColor = safeHex(form.elements.backgroundColor.value);
    const backgroundColor = selectedBackgroundColor || light;
    const fileInput = form.querySelector('[name="backgroundUpload"]');
    const file = fileInput.files?.[0] || null;
    let source = safeBackgroundSource(form.elements.backgroundPath.value);
    if (!accent || !light || (backgroundType === "color" && !selectedBackgroundColor)) {
      showToast("Enter valid 6-digit HEX colors before saving.");
      return;
    }
    if (file) {
      const permitted = backgroundType === "video" ? new Set(["video/mp4"])
        : backgroundType === "gif" ? new Set(["image/gif"])
          : backgroundType === "image" ? new Set(["image/png", "image/jpeg", "image/webp"])
            : new Set();
      if (!permitted.has(file.type)) {
        showToast("Choose a file that matches the selected background type.");
        return;
      }
    }
    if (["image", "gif", "video"].includes(backgroundType) && !file && !source) {
      showToast("Choose or upload a background file first.");
      return;
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = file ? "Uploading background…" : "Saving appearance…";
    }
    try {
      if (file) {
        if (!githubConnected) {
          openGitHubDialog();
          showToast("Connect GitHub to upload background media.");
          return;
        }
        const uploaded = await uploadStudioMedia([{ role: "background", file, input: fileInput }]);
        source = safeBackgroundSource(uploaded[0]?.path);
        if (!source) throw new Error("GitHub did not return a valid media path.");
        fileInput.value = "";
        updateUploadSelection(fileInput);
        form.elements.backgroundPath.value = source;
      }
      const background = {
        type: backgroundType,
        color: backgroundColor,
        src: ["image", "gif", "video"].includes(backgroundType) ? source : "",
        overlay: ["image", "gif", "video"].includes(backgroundType) ? (Number(form.elements.backgroundOverlay.value) || 0) : 0,
        fit: form.elements.backgroundFit.value,
        position: form.elements.backgroundPosition.value
      };
      const willPublish = githubConnected;
      state.site = { ...state.site, colors: { accent, light }, background };
      persist("Site appearance saved", true);
      renderAppearance();
      showToast(willPublish
        ? "Appearance saved. The public site is updating."
        : "Appearance saved as a draft. Connect GitHub to publish it.");
    } catch (error) {
      showToast(error?.message || "Could not save the site appearance.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Save appearance";
      }
    }
  }

  function render() {
    pageTitle.textContent = titles[activePage] || "Overview";
    document.querySelectorAll(".nav-item").forEach(button => {
      const active = button.dataset.page === activePage;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.querySelector('[data-count="projects"]').textContent = state.projects.length;
    document.querySelector('[data-count="archive"]').textContent = state.archive.length;
    document.querySelector('[data-count="motion"]').textContent = state.motion.length;
    document.querySelector('[data-count="services"]').textContent = state.services.length;
    if (activePage === "overview") contentRoot.innerHTML = renderOverview();
    else if (activePage === "profile") renderProfile();
    else if (activePage === "appearance") renderAppearance();
    else renderCollectionPage(activePage);
  }

  const field = (name, label, value, opts = {}) => {
    const { type = "text", wide = false, placeholder = "", help = "", options = null, rows = 3, cls = "" } = opts;
    let input;
    if (options) {
      input = `<select id="field-${name}" name="${name}">${options.map(option => `<option value="${escapeHtml(option.value)}" ${String(value) === String(option.value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>`;
    } else if (type === "textarea") {
      input = `<textarea id="field-${name}" name="${name}" rows="${rows}" class="${cls}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>`;
    } else {
      input = `<input id="field-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${name === "slug" ? 'pattern="[a-z0-9]+(?:-[a-z0-9]+)*"' : ""}>`;
    }
    return `<div class="field ${wide ? "wide" : ""}"><label for="field-${name}">${escapeHtml(label)}</label>${input}${help ? `<small class="field-help">${escapeHtml(help)}</small>` : ""}</div>`;
  };

  const MAX_STUDIO_MEDIA_UPLOAD_BYTES = 35 * 1024 * 1024;
  const MAX_GITHUB_FALLBACK_BYTES = 5 * 1024 * 1024;
  const MAX_STUDIO_IMAGE_BYTES = 10 * 1024 * 1024;
  const MAX_STUDIO_VIDEO_BYTES = 25 * 1024 * 1024;
  const STUDIO_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"]);
  const STUDIO_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
  const STUDIO_MEDIA_TYPES = new Set([...STUDIO_IMAGE_TYPES, ...STUDIO_VIDEO_TYPES]);

  const fileUploadField = (name, label, help, options = {}) => {
    const { multiple = false, accept = "image/png,image/jpeg,image/webp,image/gif" } = options;
    return `<div class="field wide media-upload-field">
      <label for="field-${name}">${escapeHtml(label)}</label>
      <input id="field-${name}" name="${name}" type="file" accept="${accept}" ${multiple ? "multiple" : ""} data-studio-media-upload>
      <small class="field-help">${escapeHtml(help)}</small>
      <span class="media-upload-selection" data-upload-selection aria-live="polite">No file selected</span>
    </div>`;
  };

  function updateUploadSelection(input) {
    const status = input.closest(".media-upload-field")?.querySelector("[data-upload-selection]");
    if (!status) return;
    const files = Array.from(input.files || []);
    if (!files.length) {
      status.textContent = "No file selected";
      return;
    }
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    const names = files.map(file => file.name).join(", ");
    status.textContent = `${names} · ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function encodeStudioMediaFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return { name: file.name, type: file.type, base64: btoa(binary) };
  }

  async function uploadStudioMedia(tasks) {
    if (!tasks.length) return [];
    if (tasks.length > 12) {
      throw new Error("Upload up to 12 media files at a time.");
    }
    const totalBytes = tasks.reduce((total, task) => total + task.file.size, 0);
    if (totalBytes > MAX_STUDIO_MEDIA_UPLOAD_BYTES) {
      throw new Error("Keep media uploads under 35 MB total per batch.");
    }
    for (const task of tasks) {
      const type = task.file.type;
      if (!STUDIO_MEDIA_TYPES.has(type)) {
        throw new Error("Upload PNG, JPG, WEBP, AVIF, GIF images or MP4, WEBM videos.");
      }
      if (!task.file.size) throw new Error("That media file is empty.");
      if (STUDIO_IMAGE_TYPES.has(type) && task.file.size > MAX_STUDIO_IMAGE_BYTES) {
        throw new Error(`Image "${task.file.name}" exceeds 10 MB limit (${(task.file.size / (1024 * 1024)).toFixed(1)} MB).`);
      }
      if (STUDIO_VIDEO_TYPES.has(type) && task.file.size > MAX_STUDIO_VIDEO_BYTES) {
        throw new Error(`Video "${task.file.name}" exceeds 25 MB limit (${(task.file.size / (1024 * 1024)).toFixed(1)} MB).`);
      }
    }

    const metadata = tasks.map(task => ({
      name: task.file.name,
      type: task.file.type,
      size: task.file.size
    }));
    const r2Response = await fetch("/api/studio-r2-upload", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: metadata })
    });
    const r2Result = await r2Response.json().catch(() => ({}));

    if (r2Response.ok && r2Result.configured === true
      && Array.isArray(r2Result.uploads) && r2Result.uploads.length === tasks.length) {
      await Promise.all(tasks.map(async (task, index) => {
        const target = r2Result.uploads[index];
        const response = await fetch(target.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": task.file.type,
            "Cache-Control": "public, max-age=31536000, immutable"
          },
          body: task.file
        });
        if (!response.ok) throw new Error("Cloudflare R2 could not upload " + task.file.name + ".");
      }));
      return r2Result.uploads.map(item => ({ path: item.path }));
    }
    if (!r2Response.ok) {
      throw new Error(r2Result.message || "Cloudflare R2 could not prepare this upload.");
    }

    // R2 is optional until the owner completes the Vercel setup; preserve the
    // existing GitHub upload path as a safe fallback during migration (5 MB max).
    if (totalBytes > MAX_GITHUB_FALLBACK_BYTES) {
      throw new Error("Cloudflare R2 is not configured, and the GitHub fallback limit is 5 MB total per upload.");
    }
    const files = await Promise.all(tasks.map(task => encodeStudioMediaFile(task.file)));
    const response = await fetch("/api/studio-media-upload", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.files) || result.files.length !== tasks.length) {
      throw new Error(result.message || "GitHub could not upload this media.");
    }
    return result.files;
  }

  function editorFields(page, item) {
    if (page === "projects") {
      const gallery = safeArray(item.gallery).join("\n");
      const details = JSON.stringify(safeArray(item.details), null, 2);
      return `
        <div class="field-grid">
          ${field("title", "Project title", item.title || "", { wide: true })}
          ${field("slug", "URL slug", item.slug || idFor("", item.title).replace(/^-/, ""), { help: "Use lowercase letters, numbers and hyphens." })}
          ${field("category", "Category", item.category || "")}
          ${field("year", "Year", item.year || "")}
          ${field("image", "Artwork path", item.image || "", { wide: true, help: "Paste an existing repository path or upload a new image below." })}
          ${fileUploadField("imageUpload", "Upload cover image", "Optional. Upload a PNG, JPG, WEBP or GIF. All selected images must total 3 MB or less.")}
          ${field("focus", "Creative focus", item.focus || "", { wide: true })}
          ${field("summary", "Summary", item.summary || "", { type: "textarea", wide: true, rows: 3 })}
          ${field("concept", "Concept", item.concept || "", { type: "textarea", wide: true, rows: 3 })}
          ${field("direction", "Visual direction", item.direction || "", { type: "textarea", wide: true, rows: 3 })}
          ${field("gallery", "Gallery artwork paths", gallery, { type: "textarea", wide: true, rows: 3, help: "One repository path per line. Use the controls below to change gallery order." })}
          <div class="field wide gallery-order-field"><label>Gallery order</label><div class="gallery-order-list" data-gallery-order></div></div>
          ${fileUploadField("galleryUploads", "Upload gallery images", "Optional. Select one or more images to add to this project.", { multiple: true })}
          ${field("details", "Design observations (JSON)", details, { type: "textarea", wide: true, rows: 6, cls: "extra-field", help: "Use an array of title and description pairs." })}
        </div>`;
    }
    if (page === "archive") return `<div class="field-grid">
      ${field("title", "Artwork title", item.title || "", { wide: true })}
      ${field("category", "Category", item.category || "")}
      ${field("image", "Artwork path", item.image || "", { wide: true, help: "Paste an existing repository path or upload an image below." })}
      ${fileUploadField("imageUpload", "Upload artwork", "Optional. Upload a PNG, JPG, WEBP or GIF. Files are added to the public portfolio repository.")}
      ${field("alt", "Accessible image description", item.alt || "", { type: "textarea", wide: true, rows: 3 })}
    </div>`;
    if (page === "motion") return `<div class="field-grid">
      ${field("title", "Motion project", item.title || "", { wide: true })}
      ${field("category", "Project label", item.category || "")}
      ${field("kind", "Media type", item.kind || "video", { options: [{ value: "video", label: "Video" }, { value: "gif", label: "Animated GIF" }] })}
      ${field("source", "Media source path", item.source || "", { wide: true, help: "Use a repository path for video, or upload an animated GIF below." })}
      ${fileUploadField("mediaUpload", "Upload animated GIF", "Optional. Animated GIF only; MP4 video still uses an existing repository path.", { accept: "image/gif,.gif" })}
    </div>`;
    return `<div class="field-grid">
      ${field("title", "Service title", item.title || "", { wide: true })}
      ${field("description", "Description", item.description || "", { type: "textarea", wide: true, rows: 4 })}
      ${field("link", "Related portfolio link", item.link || "", { wide: true })}
    </div>`;
  }

  function openEditor(page, item = null) {
    const draft = item ? clone(item) : page === "projects"
      ? { slug: "", title: "", category: "", year: "2026", image: "", focus: "", summary: "", concept: "", direction: "", details: [], gallery: [] }
      : page === "archive" ? { id: "", title: "", category: "posters", image: "", alt: "" }
        : page === "motion" ? { id: "", title: "", category: "MOTION / SELECTED WORK", source: "", kind: "video" }
          : { id: "", title: "", description: "", link: "#work" };
    const creating = !item;
    const label = creating ? "NEW CONTENT / DRAFT" : `EDIT / ${escapeHtml(collectionTitle(page).toUpperCase())}`;
    const deleteButton = creating ? "" : `<button class="button button-danger" type="button" data-action="delete-from-editor" data-collection="${page}" data-id="${escapeHtml(item.id || item.slug)}">Delete</button>`;
    editorBody.innerHTML = `
      <div class="editor-content"><p class="eyebrow">${label}</p><h2 id="editor-title">${creating ? `New ${escapeHtml(itemLabel(page))}` : escapeHtml(titleFor(item))}</h2><p class="editor-description">Add or edit content, then save it to the GitHub portfolio. Uploaded images are stored in the public repository.</p>
        <form id="content-form" data-collection="${page}" data-original-id="${escapeHtml(item?.id || item?.slug || "")}">
          ${editorFields(page, draft)}
          <div class="dialog-actions"><div>${deleteButton}</div><div><button class="button button-quiet" type="button" data-action="close-editor">Cancel</button><button class="button button-primary" type="submit">Save changes</button></div></div>
        </form>
      </div>`;
    renderGalleryOrder(draft.gallery);
    dialog.showModal();
    dialog.querySelector("input:not([type=hidden]),textarea,select")?.focus({ preventScroll: true });
  }

  function collectionAndIndex(page, id) {
    const items = listFor(page);
    const index = items.findIndex(item => (item.id || item.slug) === id);
    return { items, index, item: items[index] };
  }

  function renderGalleryOrder(paths) {
    const list = editorBody.querySelector("[data-gallery-order]");
    if (!list) return;
    const textarea = editorBody.querySelector('textarea[name="gallery"]');
    const items = Array.isArray(paths) ? paths : String(textarea?.value || "").split(/\r?\n/).map(path => path.trim()).filter(Boolean);
    if (!items.length) {
      list.innerHTML = '<p class="gallery-order-empty">No gallery images yet. Add paths above or upload gallery images below.</p>';
      return;
    }
    list.innerHTML = items.map((path, index) => `
      <div class="gallery-order-row">
        <span class="gallery-order-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="gallery-order-path" title="${escapeHtml(path)}">${escapeHtml(path)}</span>
        <div class="gallery-order-actions">
          <button class="icon-button reorder-button" type="button" data-gallery-order-action="up" data-gallery-index="${index}" aria-label="Move gallery image ${index + 1} up" title="Move up" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-button reorder-button" type="button" data-gallery-order-action="down" data-gallery-index="${index}" aria-label="Move gallery image ${index + 1} down" title="Move down" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
        </div>
      </div>`).join("");
  }

  function moveGalleryOrder(index, direction) {
    const textarea = editorBody.querySelector('textarea[name="gallery"]');
    if (!textarea) return;
    const items = String(textarea.value || "").split(/\r?\n/).map(path => path.trim()).filter(Boolean);
    const nextIndex = index + direction;
    if (index < 0 || index >= items.length || nextIndex < 0 || nextIndex >= items.length) return;
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
    textarea.value = items.join("\n");
    renderGalleryOrder(items);
  }

  function moveItem(page, id, targetId, after = false) {
    const items = listFor(page);
    const sourceIndex = items.findIndex(item => (item.id || item.slug) === id);
    if (sourceIndex < 0 || !targetId || id === targetId) return;
    const [item] = items.splice(sourceIndex, 1);
    const targetIndex = items.findIndex(entry => (entry.id || entry.slug) === targetId);
    if (targetIndex < 0) {
      items.splice(sourceIndex, 0, item);
      return;
    }
    items.splice(targetIndex + (after ? 1 : 0), 0, item);
    persist("Order updated", true);
    renderCollection(page);
  }

  async function editorSubmit(event) {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      showToast("The content form could not be read. Close it and try again.");
      return;
    }
    const page = form.dataset.collection;
    const originalId = form.dataset.originalId;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton?.disabled) return;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving changes…";
    }

    try {
      const formData = new FormData(form);
      const entries = [...formData.entries()].filter(([, value]) => !(typeof File !== "undefined" && value instanceof File));
      const values = Object.fromEntries(entries);
      let result = { ...values };
      const uploadTasks = [];
      const imageInput = form.querySelector('input[name="imageUpload"]');
      const galleryInput = form.querySelector('input[name="galleryUploads"]');
      const motionInput = form.querySelector('input[name="mediaUpload"]');

      if ((page === "projects" || page === "archive") && imageInput?.files?.[0]) {
        uploadTasks.push({ role: "cover", file: imageInput.files[0], input: imageInput });
      }
      if (page === "projects" && galleryInput?.files?.length) {
        for (const file of Array.from(galleryInput.files)) uploadTasks.push({ role: "gallery", file, input: galleryInput });
      }
      if (page === "motion" && motionInput?.files?.[0]) {
        const file = motionInput.files[0];
        if (file.type !== "image/gif") {
          showToast("Motion uploads currently support animated GIFs. Use a repository path for MP4 video.");
          return;
        }
        uploadTasks.push({ role: "motion", file, input: motionInput });
      }

      let existing = null;
      let previousImage = "";
      if (page === "projects") {
        result.slug = String(values.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
        if (!result.slug) result.slug = idFor("", values.title).replace(/^-/, "");
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug)) {
          showToast("Use a simple lowercase URL slug.");
          return;
        }
        result.gallery = String(values.gallery || "").split(/\r?\n/).map(path => path.trim()).filter(Boolean);
        try { result.details = JSON.parse(values.details || "[]"); }
        catch (_) {
          showToast("Design observations must be valid JSON.");
          return;
        }
        if (!Array.isArray(result.details)) {
          showToast("Design observations must be a JSON array.");
          return;
        }
        const collision = state.projects.some(project => project.slug === result.slug && project.slug !== originalId);
        if (collision) {
          showToast("Each project needs its own URL slug.");
          return;
        }
        existing = state.projects.find(project => project.slug === originalId) || null;
        previousImage = existing?.image || "";
        if (existing) {
          result = { ...existing, ...result };
        } else {
          const nextNumber = Math.max(0, ...state.projects.map(project => Number.parseInt(project.number, 10) || 0)) + 1;
          result = { ...result, number: String(nextNumber).padStart(2, "0"), preview: result.image, staticPage: false };
        }
      } else {
        existing = collectionAndIndex(page, originalId).item || null;
        result.id = existing?.id || idFor(page.slice(0, -1), values.title);
        if (existing) result = { ...existing, ...result };
      }

      const required = page === "projects" ? ["title", "slug", "category", "image", "summary"] : page === "archive" ? ["title", "category", "image"] : page === "motion" ? ["title", "source"] : ["title", "description"];
      const hasCoverUpload = uploadTasks.some(task => task.role === "cover");
      const hasMotionUpload = uploadTasks.some(task => task.role === "motion");
      const missingBeforeUpload = required.some(key => !String(result[key] || "").trim()
        && !(key === "image" && hasCoverUpload)
        && !(key === "source" && hasMotionUpload));
      if (missingBeforeUpload) {
        showToast("Complete the required content fields before saving.");
        return;
      }

      if (uploadTasks.length) {
        if (!githubConnected) {
          openGitHubDialog();
          showToast("Connect GitHub before uploading portfolio media.");
          return;
        }
        submitButton.textContent = "Uploading media…";
        const uploaded = await uploadStudioMedia(uploadTasks);
        let index = 0;
        for (const task of uploadTasks) {
          const media = uploaded[index++];
          if (!media?.path) throw new Error("GitHub did not return an image path.");
          if (task.role === "cover") result.image = media.path;
          if (task.role === "gallery") result.gallery.push(media.path);
          if (task.role === "motion") {
            result.source = media.path;
            result.kind = "gif";
          }
          task.input.value = "";
          updateUploadSelection(task.input);
        }
        const imagePathField = form.querySelector('[name="image"]');
        const galleryField = form.querySelector('[name="gallery"]');
        const motionPathField = form.querySelector('[name="source"]');
        if (imagePathField && result.image) imagePathField.value = result.image;
        if (galleryField && Array.isArray(result.gallery)) galleryField.value = result.gallery.join("\n");
        if (motionPathField && result.source) motionPathField.value = result.source;
        if (page === "projects") renderGalleryOrder(result.gallery);
      }

      if (page === "projects" && result.image !== previousImage && (!existing || existing.preview === previousImage)) {
        result.preview = result.image;
      }
      if (required.some(key => !String(result[key] || "").trim())) {
        showToast("Complete the required content fields before saving.");
        return;
      }

      const list = listFor(page);
      const index = list.findIndex(item => (item.id || item.slug) === originalId);
      if (index >= 0) list[index] = result;
      else list.unshift(result);
      persist();
      dialog.close();
      render();
      showToast(`${creatingLabel(index)} saved.`);
    } catch (error) {
      showToast(error?.message || "Could not upload or save this content.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Save changes";
      }
    }
  }

  function creatingLabel(index) {
    return index < 0 ? "New content" : "Changes";
  }

  function saveProfile(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    state.site = { ...state.site, ...values };
    persist();
    renderProfile();
    showToast("Studio profile saved.");
  }

  function removeItem(page, id) {
    const { items, index, item } = collectionAndIndex(page, id);
    if (index < 0) return showToast("This item could not be found.");
    if (!window.confirm(`Delete “${titleFor(item)}” from the portfolio?`)) return;
    items.splice(index, 1);
    persist();
    if (dialog.open) dialog.close();
    render();
    showToast("Content removed.");
  }

  function download(filename, text, mime = "application/json;charset=utf-8") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportPackage() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      source: "MASSYNE STUDIO",
      content: state
    };
    download("massyne-studio-content.json", JSON.stringify(payload, null, 2));
    showToast("Content package exported. It includes all portfolio sections.");
  }

  function exportProjects() {
    const source = `/* MASSYNE — exported from the Studio content manager. */\nwindow.MASSYNE_PROJECTS = ${JSON.stringify(state.projects, null, 2)};\n`;
    download("project-data.js", source, "text/javascript;charset=utf-8");
    showToast("Project source exported as project-data.js.");
  }

  async function importPackage(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const imported = normalizeState(payload.content || payload);
      if (!Array.isArray(payload.content?.projects || payload.projects)) throw new Error("Missing projects array");
      if (!Array.isArray(payload.content?.services || payload.services)) throw new Error("Missing services array");
      state = imported;
      persist("Imported draft saved");
      activePage = "overview";
      render();
      showToast("Content package imported into this browser.");
    } catch (error) {
      showToast("Could not import that package. Choose a MASSYNE Studio JSON export.");
    }
  }

  function handleAction(button) {
    const action = button.dataset.action;
    const page = button.dataset.collection;
    const id = button.dataset.id;
    if (action === "export") return exportPackage();
    if (action === "export-projects") return exportProjects();
    if (action === "close-editor") return dialog.close();
    if (action === "new-project") return openEditor("projects");
    if (action === "new-item") return openEditor(page);
    if (action === "move-item") return moveItem(page, id, button.dataset.targetId, button.dataset.direction === "down");
    if (action === "edit") {
      const { item } = collectionAndIndex(page, id);
      if (item) openEditor(page, item);
      return;
    }
    if (action === "delete" || action === "delete-from-editor") return removeItem(page, id);
    if (action === "go-page") {
      activePage = button.dataset.page || "overview";
      render();
      return;
    }
    if (action === "connect-github") {
      if (githubConnected) {
        showToast("GitHub publishing is connected securely through Vercel.");
      } else {
        openGitHubDialog();
      }
      return;
    }
    if (action === "close-github") return githubDialog.close();
  }

  document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => {
    activePage = button.dataset.page;
    render();
  }));
  document.addEventListener("click", event => {
    const pageButton = event.target.closest("[data-page]:not(.nav-item)");
    if (pageButton) {
      activePage = pageButton.dataset.page;
      render();
      return;
    }
    const button = event.target.closest("[data-action]");
    if (button) handleAction(button);
  });
  document.addEventListener("input", event => {
    if (event.target.id === "collection-search") renderCollection(activePage);
  });
  document.addEventListener("change", event => {
    if (event.target.id === "collection-filter") renderCollection(activePage);
  });
  contentRoot.addEventListener("dragstart", event => {
    const handle = event.target instanceof Element ? event.target.closest("[data-drag-handle]") : null;
    const card = handle?.closest(".content-card[data-card-id]");
    if (!card) return;
    draggedItem = { page: card.dataset.collection, id: card.dataset.cardId };
    card.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `${draggedItem.page}:${draggedItem.id}`);
    }
  });
  contentRoot.addEventListener("dragover", event => {
    const card = event.target instanceof Element ? event.target.closest(".content-card[data-card-id]") : null;
    if (!draggedItem || !card || card.dataset.cardId === draggedItem.id) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    contentRoot.querySelectorAll(".content-card.is-drop-target").forEach(target => target.classList.remove("is-drop-target"));
    card.classList.add("is-drop-target");
  });
  contentRoot.addEventListener("drop", event => {
    const card = event.target instanceof Element ? event.target.closest(".content-card[data-card-id]") : null;
    if (!draggedItem || !card) return;
    event.preventDefault();
    const source = draggedItem;
    draggedItem = null;
    const rect = card.getBoundingClientRect();
    const after = event.clientY >= rect.top + rect.height / 2;
    contentRoot.querySelectorAll(".content-card.is-dragging, .content-card.is-drop-target").forEach(target => {
      target.classList.remove("is-dragging", "is-drop-target");
    });
    if (source.page === card.dataset.collection) moveItem(source.page, source.id, card.dataset.cardId, after);
  });
  contentRoot.addEventListener("dragend", () => {
    draggedItem = null;
    contentRoot.querySelectorAll(".content-card.is-dragging, .content-card.is-drop-target").forEach(target => {
      target.classList.remove("is-dragging", "is-drop-target");
    });
  });
  editorBody.addEventListener("change", event => {
    if (event.target.matches("input[data-studio-media-upload]")) updateUploadSelection(event.target);
  });
  editorBody.addEventListener("input", event => {
    if (event.target.matches('textarea[name="gallery"]')) renderGalleryOrder();
  });
  editorBody.addEventListener("click", event => {
    const button = event.target instanceof Element ? event.target.closest("[data-gallery-order-action]") : null;
    if (!button) return;
    moveGalleryOrder(Number(button.dataset.galleryIndex), button.dataset.galleryOrderAction === "down" ? 1 : -1);
  });
  editorBody.addEventListener("submit", event => {
    if (event.target.id === "content-form") void editorSubmit(event);
  });
  document.getElementById("import-file").addEventListener("change", event => {
    importPackage(event.target.files?.[0]);
    event.target.value = "";
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  updateConnectionButton();

  Promise.all([loadState(), checkGitHubConnection()]).then(render).catch(error => {
    contentRoot.innerHTML = '<div class="empty-state"><div><strong>Studio could not load</strong><p>Refresh the page. If the issue continues, import a saved content package.</p></div></div>';
  });
})();