(() => {
  "use strict";

  const main = document.querySelector("#top");
  if (!main) return;

  const menu = document.querySelector("#section-rail-menu");
  const sectionRail = document.querySelector("#section-rail");

  const labDescription = main.querySelector("#creative-lab .lab-entry-copy > p:not(.eyebrow)");
  if (labDescription) {
    labDescription.textContent = "Draw freely on a blank canvas, or build a poster with type, color and shapes. Save your design as a high-resolution PNG.";
  }

  const specs = [
    { key: "home", id: "home-panel", hash: "#top" },
    { key: "work", id: "work", hash: "#work" },
    { key: "process", id: "process", hash: "#process" },
    { key: "identity", id: "identity", hash: "#identity" },
    { key: "motion", id: "motion", hash: "#motion" },
    { key: "creative-lab", id: "creative-lab", hash: "#creative-lab" },
    { key: "archive", id: "archive", hash: "#archive" },
    { key: "services", id: "services", hash: "#services" },
    { key: "about", id: "about", hash: "#about" },
    { key: "contact", id: "contact", hash: "#contact" }
  ];

  const panels = specs
    .map(spec => ({ ...spec, element: document.getElementById(spec.id) }))
    .filter(panel => panel.element && (panel.element.parentElement === main || main.contains(panel.element)));

  if (!panels.length) return;

  const byKey = new Map(panels.map(panel => [panel.key, panel]));
  const byId = new Map(panels.map(panel => [panel.id, panel]));
  const buttons = menu ? [...menu.querySelectorAll("[data-section-target]")] : [];
  const railButtons = menu ? [...menu.querySelectorAll(".section-rail-button")] : [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const footer = document.querySelector(".footer-reveal-shell");

  const setInert = (element, value) => {
    if ("inert" in element) element.inert = value;
  };

  function resolveHash(hash) {
    if (!hash || hash === "#") return null;
    let id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (_) {}
    if (id === "top" || id === "home" || id === "home-panel") return { panel: byKey.get("home"), target: null };
    if (byId.has(id)) return { panel: byId.get(id), target: byId.get(id).element };
    const target = document.getElementById(id);
    if (!target) return null;
    const panel = panels.find(item => item.element === target || item.element.contains(target));
    return panel ? { panel, target } : null;
  }

  const initial = resolveHash(window.location.hash) || { panel: byKey.get("home") || panels[0], target: null };
  let active = initial.panel || panels[0];

  const applyPanelVisibility = () => {
    panels.forEach(panel => {
      panel.element.dataset.panelSection = panel.key;
      panel.element.tabIndex = -1;
      panel.element.hidden = false;
      panel.element.removeAttribute("hidden");
      panel.element.setAttribute("aria-hidden", "false");
      setInert(panel.element, false);
    });
    [...main.children].forEach(child => {
      child.hidden = false;
      child.removeAttribute("hidden");
    });
    if (footer) {
      footer.hidden = false;
      footer.removeAttribute("hidden");
    }
    document.body.classList.add("mobile-scroll-flow", "natural-scroll-flow");
  };

  applyPanelVisibility();

  function updateButtons(panel) {
    if (!buttons.length) return;
    const currentIndex = specs.findIndex(spec => spec.key === panel.key);
    const previousIndex = (currentIndex - 1 + specs.length) % specs.length;
    const nextIndex = (currentIndex + 1) % specs.length;
    buttons.forEach(button => {
      const buttonIndex = specs.findIndex(spec => spec.key === button.dataset.sectionTarget);
      const selected = buttonIndex === currentIndex;
      if (selected) {
        button.setAttribute("aria-current", "page");
        button.classList.add("is-current");
      } else {
        button.removeAttribute("aria-current");
        button.classList.remove("is-current");
      }
      button.classList.toggle("is-previous", buttonIndex === previousIndex);
      button.classList.toggle("is-next", buttonIndex === nextIndex);
    });
  }

  function updateHeaderLinks(panel) {
    document.querySelectorAll(".site-nav a[href^='#'], .zine-corner-nav a[href^='#'], .mobile-bottom-nav a[href^='#']").forEach(link => {
      const resolved = resolveHash(link.getAttribute("href"));
      if (resolved && resolved.panel === panel) {
        link.setAttribute("aria-current", "location");
        link.classList.add("active");
      } else {
        link.removeAttribute("aria-current");
        link.classList.remove("active");
      }
    });
  }

  function syncActivePanel() {
    document.body.classList.toggle("is-scrolled-past-hero", window.scrollY > 120);
    const threshold = Math.min(window.innerHeight * 0.38, 300);
    let next = panels[0];
    panels.forEach(panel => {
      if (panel.element.getBoundingClientRect().top <= threshold) next = panel;
    });
    if (!next || next === active) return;
    active = next;
    document.body.dataset.activePanel = active.key;
    updateButtons(active);
    updateHeaderLinks(active);
  }

  window.addEventListener("scroll", syncActivePanel, { passive: true });

  function refreshSectionWidgets(panel) {
    requestAnimationFrame(() => {
      if (panel.key === "work") {
        document.querySelector(".project-grid")?.dispatchEvent(new CustomEvent("discoverychange"));
      }
      if (panel.key === "archive") {
        document.querySelector("#archive .archive-grid")?.dispatchEvent(new CustomEvent("archivefilterchange"));
      }
    });
  }

  function activate(panel, options = {}) {
    if (!panel) return;
    active = panel;
    document.body.dataset.activePanel = panel.key;
    updateButtons(panel);
    updateHeaderLinks(panel);

    const anchorTarget = options.target && options.target !== panel.element ? options.target : null;
    const scrollTarget = anchorTarget || (panel.key === "home" ? main : panel.element);

    if (scrollTarget && options.scroll !== false) {
      if (panel.key === "home" && !anchorTarget) {
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
      } else {
        const headerOffset = 64;
        const targetTop = scrollTarget.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: reducedMotion.matches ? "auto" : "smooth"
        });
      }
    }

    if (options.updateHistory) {
      const nextHash = options.hash || panel.hash;
      if (window.location.hash !== nextHash) {
        window.history.pushState({ section: panel.key }, "", nextHash);
      }
    }

    if (options.focus && panel.element.focus) {
      panel.element.focus({ preventScroll: true });
    }

    refreshSectionWidgets(panel);
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const panel = byKey.get(button.dataset.sectionTarget);
      activate(panel, { updateHistory: true, focus: true });
    });
  });

  // Global smooth scroll intercept for section hash links
  document.addEventListener("click", event => {
    if (event.defaultPrevented) return;
    const link = event.target.closest?.("a[href^='#']");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const resolved = resolveHash(href);
    if (!resolved) return;
    event.preventDefault();
    activate(resolved.panel, { updateHistory: true, hash: href, target: resolved.target, focus: true });
  });

  const restoreFromLocation = () => {
    const resolved = resolveHash(window.location.hash) || { panel: byKey.get("home"), target: null };
    activate(resolved.panel, { scroll: true, target: resolved.target, focus: false });
  };

  window.addEventListener("popstate", restoreFromLocation);
  window.addEventListener("hashchange", restoreFromLocation);

  document.body.dataset.activePanel = active.key;
  updateButtons(active);
  updateHeaderLinks(active);
  document.documentElement.classList.add("section-view-ready");
  document.body.classList.add("section-view-ready");

  if (initial.target && initial.target !== active.element) {
    requestAnimationFrame(() => initial.target.scrollIntoView({ block: "start" }));
  }

  if (active.key === "work" || active.key === "archive") refreshSectionWidgets(active);
})();
