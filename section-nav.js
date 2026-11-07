(() => {
  "use strict";

  const main = document.querySelector("#top");
  const menu = document.querySelector("#section-rail-menu");
  if (!main || !menu) return;

  // Combine the introduction and profile into one balanced Home composition.
  const heroPanel = main.querySelector("#home-panel");
  const aboutPanel = main.querySelector("#about");
  const profileContent = aboutPanel?.querySelector(".about-v2-content");
  if (heroPanel?.parentElement === main && aboutPanel?.parentElement === main && profileContent) {
    const aboutFlow = aboutPanel.previousElementSibling?.matches('.section-flow[data-flow-target="about"]')
      ? aboutPanel.previousElementSibling
      : null;
    const homePanel = document.createElement("div");
    homePanel.id = "home-panel";
    homePanel.className = "home-panel-shell";
    homePanel.setAttribute("role", "region");
    homePanel.setAttribute("aria-label", "Home and designer profile");

    const aboutEyebrow = aboutPanel.querySelector(":scope > .eyebrow");
    if (aboutEyebrow) {
      aboutEyebrow.textContent = "HOME / THE DESIGNER";
      aboutEyebrow.classList.add("home-profile-eyebrow");
      profileContent.prepend(aboutEyebrow);
    }
    profileContent.id = "about";
    profileContent.classList.add("home-profile-details");
    profileContent.setAttribute("role", "group");
    profileContent.setAttribute("aria-label", "About MASSYNE");

    heroPanel.removeAttribute("id");
    heroPanel.before(homePanel);
    homePanel.append(heroPanel, profileContent);
    aboutFlow?.remove();
    aboutPanel.remove();
  }

  const labDescription = main.querySelector("#creative-lab .lab-entry-copy > p:not(.eyebrow)");
  if (labDescription) {
    labDescription.textContent = "Draw freely on a blank canvas, or build a poster with type, color and shapes. Save your design as a high-resolution PNG.";
  }

  const contactSection = main.querySelector("#contact");
  const projectBrief = contactSection?.querySelector("#project-brief");
  if (contactSection && projectBrief) {
    const briefDialog = document.createElement("dialog");
    briefDialog.id = "project-brief-dialog";
    briefDialog.className = "brief-dialog";
    briefDialog.setAttribute("aria-labelledby", "brief-dialog-title");
    const dialogHeader = document.createElement("div");
    dialogHeader.className = "brief-dialog-header";
    dialogHeader.innerHTML = '<span id="brief-dialog-title">PROJECT BRIEF / 001</span><button type="button" class="brief-dialog-close" aria-label="Close project brief">CLOSE ×</button>';
    briefDialog.append(dialogHeader, projectBrief);
    contactSection.append(briefDialog);

    const briefButton = document.createElement("a");
    briefButton.className = "contact-v2-button contact-brief-open";
    briefButton.href = "#project-brief";
    briefButton.setAttribute("aria-haspopup", "dialog");
    briefButton.setAttribute("aria-controls", "project-brief-dialog");
    briefButton.innerHTML = 'WRITE A PROJECT BRIEF <span aria-hidden="true">↗</span>';
    const actions = contactSection.querySelector(".contact-v2-bottom");
    actions?.append(briefButton);

    const openBrief = event => {
      event?.preventDefault();
      if (!briefDialog.open) briefDialog.showModal();
      briefDialog.querySelector(".brief-dialog-close")?.focus({ preventScroll: true });
    };
    contactSection.querySelectorAll('a[href="#project-brief"]').forEach(link => link.addEventListener("click", openBrief));
    briefDialog.querySelector(".brief-dialog-close")?.addEventListener("click", () => briefDialog.close());
    briefDialog.addEventListener("click", event => {
      if (event.target === briefDialog) briefDialog.close();
    });
    if (window.location.hash === "#project-brief") requestAnimationFrame(() => briefDialog.showModal());
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
    { key: "contact", id: "contact", hash: "#contact" }
  ];
  const panels = specs.map(spec => ({ ...spec, element: document.getElementById(spec.id) }));
  if (panels.some(panel => !panel.element || panel.element.parentElement !== main)) return;

  const byKey = new Map(panels.map(panel => [panel.key, panel]));
  const byId = new Map(panels.map(panel => [panel.id, panel]));
  const buttons = [...menu.querySelectorAll("[data-section-target]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const footer = document.querySelector(".footer-reveal-shell");
  const contactPanel = byKey.get("contact");
  if (footer && contactPanel && !contactPanel.element.contains(footer)) contactPanel.element.append(footer);
  const setInert = (element, value) => {
    if ("inert" in element) element.inert = value;
  };

  function resolveHash(hash) {
    if (!hash || hash === "#") return null;
    let id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (_) {}
    if (id === "top" || id === "about") return { panel: byKey.get("home"), target: null };
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
        panel.element.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
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

    panel.element.scrollTop = 0;
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
        panel.element.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
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
    if (event.defaultPrevented) return;
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
  document.documentElement.classList.add("section-view-ready");
  document.body.classList.add("section-view-ready");
  window.scrollTo({ top: 0, behavior: "auto" });

  if (initial.target && initial.target !== active.element) {
    requestAnimationFrame(() => initial.target.scrollIntoView({ block: "start" }));
  }
  if (active.key === "work" || active.key === "archive") refreshSectionWidgets(active);
})();
