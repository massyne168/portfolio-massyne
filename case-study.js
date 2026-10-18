/* MASSYNE — semantic case study pages + source-grounded project data. */
(() => {
  "use strict";
  const collection = Array.isArray(window.MASSYNE_PROJECTS) ? window.MASSYNE_PROJECTS : [];
  const params = new URLSearchParams(window.location.search);
  const slugFromPath = window.location.pathname.match(/\/projects\/([a-z0-9-]+)\.html$/)?.[1];
  const slug = slugFromPath || params.get("work");
  const project = collection.find(item => item.slug === slug);
  const find = id => document.getElementById(id);
  const set = (id, value) => {
    const element = find(id);
    if (element) element.textContent = value || "";
  };
  const projectHref = item => new URL("projects/" + encodeURIComponent(item.slug) + ".html", document.baseURI).href;

  // The same menu behaviour works for both the legacy query page and static project routes.
  const menu = document.querySelector(".menu");
  const nav = document.getElementById("nav");
  menu?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open") || false;
    menu.setAttribute("aria-expanded", String(open));
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menu?.setAttribute("aria-expanded", "false");
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      nav?.classList.remove("is-open");
      menu?.setAttribute("aria-expanded", "false");
    }
  });
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  }, {passive:true});

  if (!project) {
    set("case-title", "Project not found.");
    set("case-summary", "This project isn't in the current portfolio collection.");
    set("case-category", "Portfolio / Not found");
    document.title = "Project not found — MASSYNE";
    [".case-hero-visual",".case-details",".case-story",".case-design",".case-mockup",".case-visuals",".case-next"]
      .forEach(selector => document.querySelector(selector)?.remove());
    return;
  }
  const index = collection.indexOf(project);
  const previous = collection[(index - 1 + collection.length) % collection.length];
  const next = collection[(index + 1) % collection.length];
  const number = project.number || String(index + 1).padStart(2, "0");

  document.title = project.title + " — MASSYNE | Selected Work";
  document.querySelector('meta[name="description"]')?.setAttribute("content", project.summary);
  set("case-number", number);
  set("case-detail-number", number);
  set("case-category", project.category + " / " + project.year);
  set("case-title", project.title);
  set("case-summary", project.summary);
  set("case-year", project.year);
  set("case-fact-project", project.title);
  set("case-fact-category", project.category);
  set("case-fact-year", project.year);
  set("case-fact-focus", project.focus);
  set("case-concept", project.concept);
  set("case-direction", project.direction);

  const artwork = find("case-artwork");
  if (artwork) {
    artwork.src = project.image;
    artwork.alt = project.title + " — original artwork by MASSYNE";
  }
  const shirtSlugs = new Set(["envy","nocturne-dark-veil","power-speaks","legends","silver-throne","mssn-chrome","gurzil-team"]);
  const garment = document.querySelector(".real-scene--wear");
  if (garment) garment.dataset.garment = shirtSlugs.has(project.slug) ? "tee" : "hoodie";
  document.querySelectorAll("[data-mockup-art]").forEach(image => {
    image.src = project.image;
    image.alt = ""; // Decorative presentation of the already captioned original artwork.
  });
  const cropped = find("case-detail-art");
  if (cropped) {
    cropped.src = project.image;
    cropped.alt = "Closer crop from " + project.title + ", original artwork";
  }

  const insights = find("case-insights");
  if (insights) {
    insights.replaceChildren();
    (project.details || []).forEach((detail, i) => {
      const article = document.createElement("article");
      article.className = "case-insight";
      const numberLabel = document.createElement("span");
      numberLabel.textContent = String(i + 1).padStart(2, "0");
      const content = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = detail.title;
      const description = document.createElement("p");
      description.textContent = detail.description;
      content.append(title, description);
      article.append(numberLabel,content);
      insights.append(article);
    });
  }

  const gal = find("case-gallery");
  const gallery = Array.isArray(project.gallery) ? project.gallery : [project.image];
  if (gal) {
    gal.replaceChildren();
    gallery.forEach((src, i) => {
      const figure = document.createElement("figure");
      figure.className = "case-gallery-piece";
      const image = document.createElement("img");
      image.src = src;
      image.alt = project.title + (gallery.length > 1 ? " — original artwork " + (i + 1) : " — full composition");
      image.loading = "lazy";
      image.decoding = "async";
      const caption = document.createElement("figcaption");
      caption.textContent = gallery.length > 1
        ? "Artwork " + String(i + 1).padStart(2, "0") + " / " + String(gallery.length).padStart(2, "0")
        : "Original artwork / Full composition";
      figure.append(image,caption);
      gal.append(figure);
    });
  }
  set("case-prev-title", previous.title);
  set("case-next-title", next.title);
  find("case-prev-link")?.setAttribute("href", projectHref(previous));
  find("case-next-link")?.setAttribute("href", projectHref(next));
  // Preserve the 3.45s loader on F5 while allowing seamless intentional project-to-project transitions.
  ["case-prev-link","case-next-link"].forEach(id => {
    find(id)?.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      try { window.sessionStorage.setItem("massyne:skip-intro-once","yes"); } catch (_) {}
    });
  });

  // The full artwork viewer is a native accessible dialog, not another page load.
  const dialog = document.querySelector(".case-fullscreen");
  const dialogImage = dialog?.querySelector("img");
  const closeButton = dialog?.querySelector("button");
  find("case-zoom")?.addEventListener("click", () => {
    if (!dialog || !dialogImage || !artwork || typeof dialog.showModal !== "function") return;
    dialogImage.src = artwork.src;
    dialogImage.alt = artwork.alt;
    dialog.showModal();
    closeButton?.focus();
  });
  closeButton?.addEventListener("click", () => dialog?.close());
  dialog?.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
})();
