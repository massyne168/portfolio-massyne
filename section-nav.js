(() => {
  "use strict";

  const main = document.querySelector("#top");
  const menu = document.querySelector("#section-rail-menu");
  if (!main || !menu) return;

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
  const panels = specs.map(spec => ({ ...spec, element: document.getElementById(spec.id) }));
  if (panels.some(panel => !panel.element || panel.element.parentElement !== main)) return;

  const byKey = new Map(panels.map(panel => [panel.key, panel]));
  const byId = new Map(panels.map(panel => [panel.id, panel]));
  const buttons = [...menu.querySelectorAll("[data-section-target]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const footer = document.querySelector(".footer-reveal-shell");
  const setInert = (element, value) => {
    if ("inert" in element) element.inert = value;
  };

  function resolveHash(hash) {
    if (!hash || hash === "#") return null;
    let id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (_) {}
    if (id === "top") return { panel: byKey.get("home"), target: null };
    if (byId.has(id)) return { panel: byId.get(id), target: byId.get(id).element };
    const target = document.getElementById(id);
    if (!target) return null;
    const panel = panels.find(item => item.element === target || item.element.contains(target));
    return panel ? { panel, target } : null;
  }

  const initial = resolveHash(window.location.hash) || { panel: byKey.get("home"), target: null };
  let active = initial.panel;
  let transitionSequence = 0;

  panels.forEach(panel => {
    panel.element.dataset.panelSection = panel.key;
    panel.element.tabIndex = -1;
    const selected = panel === active;
    panel.element.hidden = !selected;
    panel.element.setAttribute("aria-hidden", String(!selected));
    setInert(panel.element, !selected);
  });
  [...main.children].forEach(child => {
    if (!panels.some(panel => panel.element === child)) child.hidden = true;
  });
  if (footer) footer.hidden = active.key !== "contact";

  function updateButtons(panel) {
    buttons.forEach(button => {
      const selected = button.dataset.sectionTarget === panel.key;
      if (selected) {
        button.setAttribute("aria-current", "page");
        button.classList.add("is-current");
      } else {
        button.removeAttribute("aria-current");
        button.classList.remove("is-current");
      }
    });
  }

  function updateHeaderLinks(panel) {
    document.querySelectorAll(".site-nav a[href^='#']").forEach(link => {
      const resolved = resolveHash(link.getAttribute("href"));
      if (resolved && resolved.panel === panel) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

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
    const anchorTarget = options.target && options.target !== panel.element ? options.target : null;
    if (panel === active) {
      if (options.updateHistory && options.hash && window.location.hash !== options.hash) {
        window.history.pushState({ section: panel.key }, "", options.hash);
      }
      if (anchorTarget) {
        requestAnimationFrame(() => anchorTarget.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" }));
      } else if (options.scroll !== false) {
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
      }
      return;
    }

    transitionSequence += 1;
    const sequence = transitionSequence;
    panels.forEach(item => {
      if (item !== active && item !== panel && item.element.classList.contains("section-panel-leaving")) {
        item.element.classList.remove("section-panel-leaving");
        item.element.hidden = true;
      }
    });

    const previous = active;
    if (previous) {
      previous.element.classList.remove("section-panel-entering");
      previous.element.classList.add("section-panel-leaving");
      previous.element.setAttribute("aria-hidden", "true");
      setInert(previous.element, true);
      window.setTimeout(() => {
        if (sequence !== transitionSequence || active === previous) return;
        previous.element.hidden = true;
        previous.element.classList.remove("section-panel-leaving");
      }, reducedMotion.matches ? 0 : 260);
    }

    panel.element.hidden = false;
    panel.element.classList.remove("section-panel-leaving");
    panel.element.setAttribute("aria-hidden", "false");
    setInert(panel.element, false);
    panel.element.classList.add("section-panel-entering");
    active = panel;
    document.body.dataset.activePanel = panel.key;
    updateButtons(panel);
    updateHeaderLinks(panel);
    if (footer) footer.hidden = panel.key !== "contact";

    if (options.updateHistory) {
      const nextHash = options.hash || panel.hash;
      if (window.location.hash !== nextHash) window.history.pushState({ section: panel.key }, "", nextHash);
    }

    if (options.focus && panel.element.focus) panel.element.focus({ preventScroll: true });

    if (options.scroll !== false) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
        if (anchorTarget) {
          window.setTimeout(() => anchorTarget.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" }), reducedMotion.matches ? 0 : 240);
        }
      });
    }
    refreshSectionWidgets(panel);
  }

  panels.forEach(panel => {
    panel.element.addEventListener("animationend", event => {
      if (event.target === panel.element && event.animationName === "sectionPanelRise") {
        panel.element.classList.remove("section-panel-entering");
      }
    });
  });

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const panel = byKey.get(button.dataset.sectionTarget);
      activate(panel, { updateHistory: true, focus: true });
    });
  });

  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[href^='#']");
    if (!link) return;
    const resolved = resolveHash(link.getAttribute("href"));
    if (!resolved) return;
    event.preventDefault();
    activate(resolved.panel, { updateHistory: true, hash: link.getAttribute("href"), target: resolved.target, focus: true });
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
  document.body.classList.add("section-view-ready");

  if (initial.target && initial.target !== active.element) {
    requestAnimationFrame(() => initial.target.scrollIntoView({ block: "start" }));
  }
  if (active.key === "work" || active.key === "archive") refreshSectionWidgets(active);
})();