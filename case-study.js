/* MASSYNE — truthful, lightweight case study renderer. */
(() => {
  "use strict";
  const collection = Array.isArray(window.MASSYNE_PROJECTS) ? window.MASSYNE_PROJECTS : [];
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("work");
  const project = collection.find(item => item.slug === slug);
  const find = id => document.getElementById(id);
  const set = (id, text) => { const node = find(id); if (node) node.textContent = text; };

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
  }, { passive: true });

  if (!project) {
    set("case-title", "Project not found.");
    set("case-summary", "This project isn't in the current portfolio collection.");
    set("case-category", "Portfolio / Not found");
    document.title = "Project not found — MASSYNE";
    document.querySelector(".case-hero-visual")?.remove();
    document.querySelector(".case-details")?.remove();
    document.querySelector(".case-visuals")?.remove();
    document.querySelector(".case-next")?.remove();
    return;
  }
  const index = collection.indexOf(project);
  const previous = collection[(index - 1 + collection.length) % collection.length];
  const next = collection[(index + 1) % collection.length];
  const fallback = String(index + 1).padStart(2, "0");

  document.title = project.title + " — MASSYNE Portfolio";
  document.querySelector('meta[name="description"]')?.setAttribute("content", project.summary);
  set("case-number", project.number || fallback);
  set("case-detail-number", project.number || fallback);
  set("case-category", project.category + " / " + project.year);
  set("case-title", project.title);
  set("case-summary", project.summary);
  set("case-year", project.year);
  set("case-fact-project", project.title);
  set("case-fact-category", project.category);
  set("case-fact-year", project.year);
  set("case-fact-focus", project.focus);
  const artwork = find("case-artwork");
  if (artwork) {
    artwork.src = project.image;
    artwork.alt = project.title + " — original artwork by MASSYNE";
  }

  const gal = find("case-gallery");
  const gallery = Array.isArray(project.gallery) ? project.gallery : [project.image];
  if (gal) {
    gallery.forEach((src, i) => {
      const figure = document.createElement("figure");
      figure.className = "case-gallery-piece";
      const image = document.createElement("img");
      image.src = src;
      image.alt = project.title + (gallery.length > 1 ? " — original artwork " + (i + 1) : " — visual detail");
      image.loading = "lazy";
      image.decoding = "async";
      const caption = document.createElement("figcaption");
      caption.textContent = gallery.length > 1
        ? "Artwork " + String(i + 1).padStart(2, "0") + " / " + String(gallery.length).padStart(2, "0")
        : "Detail view / Original composition";
      figure.append(image, caption);
      gal.append(figure);
    });
  }
  set("case-prev-title", previous.title);
  set("case-next-title", next.title);
  find("case-prev-link")?.setAttribute("href", "project.html?work=" + encodeURIComponent(previous.slug));
  find("case-next-link")?.setAttribute("href", "project.html?work=" + encodeURIComponent(next.slug));

  const dialog = document.querySelector(".case-fullscreen");
  const dialogImage = dialog?.querySelector("img");
  const closeButton = dialog?.querySelector("button");
  find("case-zoom")?.addEventListener("click", () => {
    if (!dialog || !dialogImage || !artwork) return;
    dialogImage.src = artwork.src;
    dialogImage.alt = artwork.alt;
    dialog.showModal();
    closeButton?.focus();
  });
  closeButton?.addEventListener("click", () => dialog?.close());
  dialog?.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
})();