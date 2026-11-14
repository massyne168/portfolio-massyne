(() => {
  "use strict";

  const STORAGE_KEY = "massyne-studio-content-v1";
  const titles = {
    overview: "Overview",
    projects: "Selected work",
    archive: "Archive",
    motion: "Motion",
    services: "Services",
    profile: "Studio profile"
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
    site: { ...(input.site || {}) },
    services: safeArray(input.services).map(item => ({ ...item })),
    motion: safeArray(input.motion).map(item => ({ ...item })),
    archive: safeArray(input.archive).map(item => ({ ...item })),
    projects: safeArray(input.projects).map(item => ({ ...item }))
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function setSaveState(message = "Draft saved locally") {
    saveState.querySelector("span").textContent = message;
    saveState.classList.remove("is-unsaved");
  }

  function persist(message = "Draft saved locally") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveState(message);
      return true;
    } catch (error) {
      saveState.querySelector("span").textContent = "Browser storage is full";
      saveState.classList.add("is-unsaved");
      showToast("This draft is too large for browser storage. Export a package to keep a copy.");
      return false;
    }
  }

  async function loadState() {
    const fromProjectFile = safeArray(window.MASSYNE_PROJECTS).map(project => ({ ...project }));
    let source = {};
    try {
      const response = await fetch("studio-content.json", { cache: "no-store" });
      if (response.ok) source = await response.json();
    } catch (error) {
      showToast("Studio settings could not be loaded. You can still import a content package.");
    }
    const base = normalizeState({ ...source, projects: fromProjectFile });
    try {
      const localDraft = localStorage.getItem(STORAGE_KEY);
      if (localDraft) {
        const parsed = JSON.parse(localDraft);
        if (parsed && Array.isArray(parsed.projects)) {
          state = normalizeState(parsed);
          return;
        }
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
    state = base;
    setSaveState("Content loaded");
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
          <button class="quick-action" type="button" data-action="export"><span class="quick-icon">↓</span><span><strong>Export content package</strong><small>Keep a portable copy of your edits</small></span></button>
        </div><div class="overview-note"><span aria-hidden="true">ⓘ</span><span><b>Local draft workspace.</b> Changes stay in this browser. Export a package to move drafts between devices or keep a backup.</span></div></section>
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
    results.innerHTML = filtered.map(item => {
      const preview = page === "projects" || page === "archive" ? item.image : "";
      const kind = page === "motion" ? item.kind : "";
      const secondary = page === "projects" ? (item.focus || item.summary || "") : page === "archive" ? item.alt : page === "motion" ? item.source : item.description;
      const date = page === "projects" ? item.year || "PROJECT" : page === "motion" ? kind || "MOTION" : page.toUpperCase();
      return `<article class="content-card" data-card-id="${escapeHtml(item.id || item.slug || "")}">
        ${imageMarkup(preview, item.alt || item.title, kind)}
        <div class="card-body"><div class="card-overline"><span>${escapeHtml(item.category || "Uncategorized")}</span><span>${escapeHtml(date)}</span></div>
        <h2 class="card-title" title="${escapeHtml(titleFor(item))}">${escapeHtml(titleFor(item))}</h2><p class="card-summary">${escapeHtml(secondary)}</p>
        <div class="card-footer"><small>${escapeHtml(item.slug || item.source || item.link || "Content item")}</small><div class="card-actions">
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
      <div class="collection-toolbar"><div class="toolbar-left"><label class="search-box"><span aria-hidden="true">⌕</span><input id="collection-search" type="search" autocomplete="off" placeholder="Search ${escapeHtml(collectionTitle(page).toLowerCase())}…" aria-label="Search ${escapeHtml(collectionTitle(page).toLowerCase())}"></label>${filters}</div><div class="toolbar-right"><span class="collection-meta" id="collection-count"></span></div></div>
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
        <form class="form-panel" id="profile-form"><h2>Portfolio identity</h2><p>Changes are saved as a local draft. Export a content package when you are ready to keep or move them.</p>
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
          <div class="publish-note"><strong>How content moves</strong>This static portfolio does not connect to a publishing server. Profile edits stay in this browser until you export the content package and update the source files.</div>
          <button class="button button-quiet" type="button" data-action="export">↓ Export current package</button>
        </aside>
      </div>
      <div class="dashboard-panel" style="margin-top:15px"><div class="panel-head"><h2>Service descriptions</h2><button class="text-link" type="button" data-page="services">Manage services ↗</button></div><p style="margin:0;color:#908c93;font-size:10px;line-height:1.7">Services, selected projects, archive artwork and motion projects are managed in their own sections. Export includes every section.</p></div>`;
    document.getElementById("profile-form").addEventListener("submit", saveProfile);
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
          ${field("image", "Artwork path", item.image || "", { wide: true, help: "Use a path that exists in the portfolio repository." })}
          ${field("focus", "Creative focus", item.focus || "", { wide: true })}
          ${field("summary", "Summary", item.summary || "", { type: "textarea", wide: true, rows: 3 })}
          ${field("concept", "Concept", item.concept || "", { type: "textarea", wide: true, rows: 3 })}
          ${field("direction", "Visual direction", item.direction || "", { type: "textarea", wide: true, rows: 3 })}
          ${field("gallery", "Gallery artwork paths", gallery, { type: "textarea", wide: true, rows: 3, help: "One repository path per line." })}
          ${field("details", "Design observations (JSON)", details, { type: "textarea", wide: true, rows: 6, cls: "extra-field", help: "Use an array of title and description pairs." })}
        </div>`;
    }
    if (page === "archive") return `<div class="field-grid">
      ${field("title", "Artwork title", item.title || "", { wide: true })}
      ${field("category", "Category", item.category || "")}
      ${field("image", "Artwork path", item.image || "", { wide: true })}
      ${field("alt", "Accessible image description", item.alt || "", { type: "textarea", wide: true, rows: 3 })}
    </div>`;
    if (page === "motion") return `<div class="field-grid">
      ${field("title", "Motion project", item.title || "", { wide: true })}
      ${field("category", "Project label", item.category || "")}
      ${field("kind", "Media type", item.kind || "video", { options: [{ value: "video", label: "Video" }, { value: "gif", label: "Animated GIF" }] })}
      ${field("source", "Media source path", item.source || "", { wide: true, help: "Use a repository path that points to the video or GIF." })}
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
      <div class="editor-content"><p class="eyebrow">${label}</p><h2 id="editor-title">${creating ? `New ${escapeHtml(itemLabel(page))}` : escapeHtml(titleFor(item))}</h2><p class="editor-description">Update this content entry. Save it to your browser draft, then export the full content package when ready.</p>
        <form id="content-form" data-collection="${page}" data-original-id="${escapeHtml(item?.id || item?.slug || "")}">
          ${editorFields(page, draft)}
          <div class="dialog-actions"><div>${deleteButton}</div><div><button class="button button-quiet" type="button" data-action="close-editor">Cancel</button><button class="button button-primary" type="submit">Save draft</button></div></div>
        </form>
      </div>`;
    dialog.showModal();
    dialog.querySelector("input:not([type=hidden]),textarea,select")?.focus({ preventScroll: true });
  }

  function collectionAndIndex(page, id) {
    const items = listFor(page);
    const index = items.findIndex(item => (item.id || item.slug) === id);
    return { items, index, item: items[index] };
  }

  function editorSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const page = form.dataset.collection;
    const originalId = form.dataset.originalId;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    let result = { ...values };
    if (page === "projects") {
      result.slug = String(values.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
      if (!result.slug) result.slug = idFor("", values.title).replace(/^-/, "");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug)) return showToast("Use a simple lowercase URL slug.");
      result.gallery = String(values.gallery || "").split(/\r?\n/).map(path => path.trim()).filter(Boolean);
      try { result.details = JSON.parse(values.details || "[]"); }
      catch (error) { return showToast("Design observations must be valid JSON."); }
      if (!Array.isArray(result.details)) return showToast("Design observations must be a JSON array.");
      const collision = state.projects.some(project => project.slug === result.slug && project.slug !== originalId);
      if (collision) return showToast("Each project needs its own URL slug.");
      const existing = state.projects.find(project => project.slug === originalId);
      if (existing) result = { ...existing, ...result };
    } else {
      const { item: existing } = collectionAndIndex(page, originalId);
      result.id = existing?.id || idFor(page.slice(0, -1), values.title);
      if (existing) result = { ...existing, ...result };
    }
    const required = page === "projects" ? ["title", "slug", "category", "image", "summary"] : page === "archive" ? ["title", "category", "image"] : page === "motion" ? ["title", "source"] : ["title", "description"];
    if (required.some(key => !String(result[key] || "").trim())) return showToast("Complete the required content fields before saving.");
    const list = listFor(page);
    const index = list.findIndex(item => (item.id || item.slug) === originalId);
    if (index >= 0) list[index] = result;
    else list.unshift(result);
    persist();
    dialog.close();
    render();
    showToast(`${creatingLabel(index)} saved to your local draft.`);
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
    showToast("Studio profile saved to your local draft.");
  }

  function removeItem(page, id) {
    const { items, index, item } = collectionAndIndex(page, id);
    if (index < 0) return showToast("This item could not be found.");
    if (!window.confirm(`Delete “${titleFor(item)}” from this local draft?`)) return;
    items.splice(index, 1);
    persist();
    if (dialog.open) dialog.close();
    render();
    showToast("Content removed from your local draft.");
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
  editorBody.addEventListener("submit", event => {
    if (event.target.id === "content-form") editorSubmit(event);
  });
  document.getElementById("import-file").addEventListener("change", event => {
    importPackage(event.target.files?.[0]);
    event.target.value = "";
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  loadState().then(render).catch(error => {
    contentRoot.innerHTML = '<div class="empty-state"><div><strong>Studio could not load</strong><p>Refresh the page. If the issue continues, import a saved content package.</p></div></div>';
  });
})();

