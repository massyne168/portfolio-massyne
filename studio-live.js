/* Apply the committed MASSYNE Studio content before the existing page scripts initialize. */
(() => {
  "use strict";
  const content = window.MASSYNE_STUDIO_CONTENT;
  if (!content) return;
  const site = content.site || {};
  const availability = ["inquiries", "open", "limited", "closed"].includes(site.availability) ? site.availability : "inquiries";
  window.MASSYNE_AVAILABILITY = Object.freeze({ status: availability, inquiryEmail: site.email || "aazizimassine@gmail.com" });
  const projects = Array.isArray(content.projects) ? content.projects : [];
  window.MASSYNE_PROJECTS = projects;
  const removed = new Set(Array.isArray(content.removedProjects) ? content.removedProjects : []);
  const setText = (selector, value, root = document) => {
    const node = root.querySelector(selector);
    if (node && value != null) node.textContent = String(value);
    return node;
  };
  const safeText = value => String(value ?? "");
  const setLink = (node, value) => {
    if (!node || !value) return;
    const url = String(value).trim();
    const absolute = /^(https?:\/\/|mailto:|tel:|#|\/(?!\/)|\.\/|\.\.\/)/i.test(url);
    const relative = /^[a-z0-9][a-z0-9_.-]*(?:\/[a-z0-9_.~-]*)*(?:\?[a-z0-9_.~%&=+-]*)?(?:#[a-z0-9_.~-]*)?$/i.test(url);
    if (absolute || relative) node.setAttribute("href", url);
    else node.removeAttribute("href");
  };
  const splitLast = value => {
    const words = safeText(value).trim().split(/\s+/).filter(Boolean);
    return { front: words.slice(0, -1).join(" "), last: words.at(-1) || "" };
  };

  const heroTitle = document.querySelector("#main-hero-title");
  if (heroTitle) {
    const parts = heroTitle.querySelectorAll(":scope > span, :scope > em");
    if (parts[0]) parts[0].textContent = site.name || "MASSYNE";
    const tagline = splitLast(site.tagline || "Design with purpose.");
    if (parts[1]) parts[1].textContent = tagline.front.toUpperCase();
    if (parts[2]) parts[2].textContent = tagline.last.toUpperCase();
  }
  setText(".hero-v2-description", site.headline);
  const location = safeText(site.location || "Morocco — Worldwide");
  const heroMeta = document.querySelector(".hero-meta");
  if (heroMeta?.lastElementChild) heroMeta.lastElementChild.textContent = location.toUpperCase();
  const aboutLabel = document.querySelector(".about-image-label");
  if (aboutLabel) aboutLabel.textContent = `${site.name || "MASSYNE"} / ${location.toUpperCase()}`;
  const aboutHeading = document.querySelector(".about-v2-content h2");
  if (aboutHeading && site.aboutHeadline) {
    const parts = splitLast(site.aboutHeadline);
    aboutHeading.replaceChildren(document.createTextNode(parts.front));
    if (parts.last) {
      aboutHeading.append(document.createElement("br"));
      const emphasis = document.createElement("em");
      emphasis.textContent = parts.last;
      aboutHeading.append(emphasis);
    }
  }
  setText(".about-v2-lead", site.aboutLead);
  setText(".about-v2-text", site.aboutDescription);
  document.querySelectorAll(".about-v2-image img").forEach(image => {
    if (site.portrait) image.src = site.portrait;
  });
  document.title = `${site.name || "MASSYNE"} — Graphic & Motion Designer`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", site.headline || "");
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${site.name || "MASSYNE"} — Graphic & Motion Designer`);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", site.headline || "");

  const emailLink = document.querySelector("#contact .email");
  if (emailLink && site.email) {
    emailLink.href = `mailto:${site.email}`;
    const label = emailLink.firstChild;
    if (label?.nodeType === Node.TEXT_NODE) label.textContent = `${site.email} `;
  }
  setLink(document.querySelector(".contact-v2-button"), site.whatsapp);
  document.querySelectorAll(".contact-links a").forEach(link => {
    const label = link.textContent.toLowerCase();
    if (label.includes("whatsapp")) setLink(link, site.whatsapp);
    else if (label.includes("instagram")) setLink(link, site.instagram);
    else if (label.includes("behance")) setLink(link, site.behance);
    else if (label.includes("portfolio pdf")) setLink(link, site.portfolioPdf);
    else if (label.includes("resume")) setLink(link, site.resume);
  });
  const availabilityLabels = {
    inquiries: "CREATIVE INQUIRIES WELCOME ↗",
    open: "OPEN FOR SELECT PROJECTS ↗",
    limited: "LIMITED AVAILABILITY ↗",
    closed: "NOT BOOKING PROJECTS ↗"
  };
  document.querySelectorAll("[data-availability-status]").forEach(node => node.dataset.state = availability);
  document.querySelectorAll("[data-availability-text]").forEach(node => node.textContent = availabilityLabels[availability]);
  setText("#availability-description", site.availabilityDescription);
  const resumeLink = document.querySelector(".about-resume");
  const resumeDownload = document.querySelector(".about-download");
  setLink(resumeLink, site.resume);
  setLink(resumeDownload, site.portfolioPdf);

  const portrait = site.portrait;
  if (portrait) {
    document.querySelectorAll(".about-v2-image img").forEach(image => {
      image.src = portrait;
    });
  }

  const serviceList = document.querySelector(".services-list");
  const serviceTemplate = serviceList?.firstElementChild?.cloneNode(true);
  if (serviceList && serviceTemplate && Array.isArray(content.services)) {
    const serviceNodes = content.services.map((service, index) => {
      const article = serviceTemplate.cloneNode(true);
      const indexLabel = article.querySelector(".service-index span:first-child");
      if (indexLabel) indexLabel.textContent = `${String(index + 1).padStart(2, "0")} / ${safeText(service.title).toUpperCase()}`;
      setText("h3", service.title, article);
      setText("p", service.description, article);
      const link = article.querySelector("a");
      if (link) {
        if (service.link) setLink(link, service.link);
        else { link.removeAttribute("href"); link.setAttribute("aria-disabled", "true"); }
      }
      if (link?.firstChild?.nodeType === Node.TEXT_NODE) link.firstChild.textContent = `EXPLORE ${safeText(service.title).toUpperCase()} `;
      return article;
    });
    serviceList.replaceChildren(...serviceNodes);
  }

  const archive = document.querySelector("#archive .archive-grid");
  const filters = document.querySelector("#archive .filters");
  const archiveCategories = new Set();
  (content.archive || []).forEach(item => String(item.category || "").split(/\s+/).filter(Boolean).forEach(category => archiveCategories.add(category)));
  if (filters && archiveCategories.size) {
    const categories = [...archiveCategories];
    const preferred = categories.includes("posters") ? "posters" : categories[0];
    const filterButtons = categories.map(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.filter = category;
      button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      button.classList.toggle("active", category === preferred);
      button.setAttribute("aria-pressed", String(category === preferred));
      return button;
    });
    filters.replaceChildren(...filterButtons);
  }
  if (archive) {
    const figures = (content.archive || []).map(item => {
      const figure = document.createElement("figure");
      figure.className = "archive-item image-open cinematic-card";
      figure.dataset.category = safeText(item.category || "posters");
      const image = document.createElement("img");
      image.src = item.image || "";
      image.alt = item.alt || item.title || "";
      image.loading = "lazy";
      image.decoding = "async";
      image.fetchPriority = "low";
      const caption = document.createElement("figcaption");
      caption.append(document.createTextNode(safeText(item.title)));
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      caption.append(arrow);
      figure.append(image, caption);
      return figure;
    });
    archive.replaceChildren(...figures);
  }

  const motionGrid = document.querySelector(".motion-project-grid");
  const motionTemplate = motionGrid?.querySelector("[data-motion-case]");
  if (motionGrid && motionTemplate) {
    const motionCards = (content.motion || []).map((item, index) => {
      const card = motionTemplate.cloneNode(true);
      card.dataset.projectName = safeText(item.title);
      card.dataset.projectLabel = safeText(item.category || "MOTION / SELECTED WORK");
      card.dataset.motionSource = safeText(item.source);
      card.dataset.motionKind = safeText(item.kind || "video");
      card.setAttribute("aria-label", `Open motion case study: ${safeText(item.title)}`);
      setText(".motion-project-index", `MOTION / ${String(index + 1).padStart(2, "0")}`, card);
      setText(".motion-project-meta small", item.category, card);
      setText(".motion-project-meta strong", item.title, card);
      const art = card.querySelector(".motion-project-art");
      if (art) {
        const currentPreview = art.querySelector(".motion-project-preview");
        if (currentPreview) currentPreview.remove();
        const preview = document.createElement(item.kind === "gif" ? "img" : "video");
        preview.className = "motion-project-preview";
        preview.setAttribute("aria-hidden", "true");
        preview.tabIndex = -1;
        if (item.kind === "gif") {
          preview.alt = "";
          preview.loading = "lazy";
          preview.decoding = "async";
        } else {
          preview.muted = true;
          preview.playsInline = true;
          preview.loop = true;
          preview.preload = "none";
        }
        art.prepend(preview);
      }
      return card;
    });
    motionGrid.replaceChildren(...motionCards);
  }
  if (Array.isArray(content.motion)) {
    setText("#motion .section-head .intro", `${content.motion.length} selected motion works. Open a project to view the full clip or animation.`);
    setText("#motion .motion-projects-head .eyebrow", `MOTION ARCHIVE / ${String(content.motion.length).padStart(2, "0")} STUDIES`);
  }

  const workGrid = document.querySelector(".project-grid");
  const workTemplate = workGrid?.querySelector(":scope > .project");
  if (workGrid && workTemplate) {
    const work = projects.filter(project => project.slug !== "gurzil-team" && !removed.has(project.slug));
    const cards = work.map((project, index) => {
      const card = workTemplate.cloneNode(true);
      card.dataset.caseStudy = project.slug;
      card.dataset.discoverCategories = project.discoverCategories || (
        /mockup|t-shirt|apparel/i.test(project.category) ? "mockups"
          : /identity|logo|brand/i.test(project.category) ? "identity logos"
            : "posters"
      );
      const image = card.querySelector("img");
      if (image) {
        image.src = project.preview || project.image || "";
        image.alt = project.title || "Selected artwork";
      }
      const label = card.querySelector(":scope > div > span");
      if (label) label.textContent = `${project.number || String(index + 1).padStart(2, "0")} / ${project.category || "Selected work"}`;
      const anchor = card.querySelector("h3 a") || (() => {
        const link = document.createElement("a");
        link.className = "project-card-anchor";
        card.querySelector("h3")?.append(link);
        return link;
      })();
      if (anchor) {
        anchor.textContent = project.title || "";
        anchor.setAttribute("aria-label", `Explore ${project.title || "project"} case study`);
        anchor.href = project.staticPage === false
          ? `project.html?work=${encodeURIComponent(project.slug)}`
          : `projects/${encodeURIComponent(project.slug)}.html`;
      }
      setText(":scope > div > b", project.year || "", card);
      return card;
    });
    workGrid.replaceChildren(...cards);
  }
  setText("#work .section-head .intro", `${projects.filter(project => project.slug !== "gurzil-team" && !removed.has(project.slug)).length} selected visual pieces spanning cinematic stories, typography, character art, and brand explorations.`);

  const spotlight = document.querySelector("#spotlight");
  if (spotlight) spotlight.querySelectorAll('a[href*="/projects/"]').forEach(link => {
    const match = link.href.match(/\/projects\/([^/]+)\.html$/);
    const project = match && projects.find(item => item.slug === decodeURIComponent(match[1]));
    if (!project) return;
    const image = link.querySelector("img");
    if (image) {
      image.src = project.preview || project.image || image.src;
      image.alt = project.title || image.alt;
    }
    const title = link.querySelector("h3,h2,strong");
    if (title) title.textContent = project.title || title.textContent;
  });
})();
function applyStudioAppearance(content) {
  if (!content) return;
const colors = content.colors || (content.appearance && content.appearance.colors) || {};
const root = document.documentElement.style;
if (colors.accent) {
root.setProperty("--accent", colors.accent);
root.setProperty("--accent-color", colors.accent);
root.setProperty("--studio-accent", colors.accent);
}
if (colors.light) {
root.setProperty("--light", colors.light);
root.setProperty("--text-light", colors.light);
}
  if (!document.body) return;
const bg = content.background || (content.appearance && content.appearance.background) || {};
const existing = document.getElementById("massyne-live-bg");
if (bg.type === "color" && (bg.color || bg.backgroundColor)) {
if (existing) existing.remove();
document.body.style.backgroundColor = bg.color || bg.backgroundColor;
return;
}
if (bg.type === "image" || bg.type === "gif" || bg.type === "video") {
const src = bg.path || bg.backgroundPath || bg.source;
if (!src) return;
const layer = existing || document.createElement("div");
layer.id = "massyne-live-bg";
layer.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;";
const fit = bg.fit || bg.backgroundFit || "cover";
const pos = bg.position || bg.backgroundPosition || "center";
const media = document.createElement(bg.type === "video" ? "video" : "img");
media.src = src;
if (bg.type === "video") {
media.autoplay = true;
media.muted = true;
media.loop = true;
media.playsInline = true;
}
media.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${pos};`;
const overlay = document.createElement("div");
const alpha = Math.max(0, Math.min(70, Number(bg.overlay || 0))) / 100;
overlay.style.cssText = `position:absolute;inset:0;background:rgba(0,0,0,${alpha});`;
layer.replaceChildren(media, overlay);
if (!existing) document.body.prepend(layer);
}
}
if (window.MASSYNE_STUDIO_CONTENT) applyStudioAppearance(window.MASSYNE_STUDIO_CONTENT);
document.addEventListener("DOMContentLoaded", () => {
if (window.MASSYNE_STUDIO_CONTENT) applyStudioAppearance(window.MASSYNE_STUDIO_CONTENT);
});
