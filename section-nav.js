(() => {
  "use strict";

  const main = document.querySelector("#top");
  const menu = document.querySelector("#section-rail-menu");
  const sectionRail = document.querySelector("#section-rail");
  if (!main || !menu || !sectionRail) return;
  const mobileFlowQuery = window.matchMedia("(max-width: 850px)");

  
  // Keep #project-brief directly inline inside #contact (no modal popup / no "Write a project brief" button).

  const specs = [
    { key: "home", id: "home-panel", hash: "#top" },
    { key: "work", id: "work", hash: "#work" },
    { key: "process", id: "process", hash: "#process" },
    { key: "identity", id: "identity", hash: "#identity" },
    { key: "motion", id: "motion", hash: "#motion" },
    { key: "archive", id: "archive", hash: "#archive" },
    { key: "services", id: "services", hash: "#services" },
    { key: "contact", id: "contact", hash: "#contact" }
  ];
  const panels = specs.map(spec => ({ ...spec, element: document.getElementById(spec.id) }));
  if (panels.some(panel => !panel.element || panel.element.parentElement !== main)) return;

  const byKey = new Map(panels.map(panel => [panel.key, panel]));
  const byId = new Map(panels.map(panel => [panel.id, panel]));
  const buttons = [...menu.querySelectorAll("[data-section-target]")];
  const railButtons = [...menu.querySelectorAll(".section-rail-button")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const railDockQuery = window.matchMedia("(min-width: 851px) and (hover: hover) and (pointer: fine)");
  const dockPreset = Object.freeze({ position: "left", smoothness: 0.5, magnification: 0.3, hoverRange: 130, iconSize: 42 });
  const footer = document.querySelector(".site-footer");
  const contactPanel = byKey.get("contact");
  if (footer && contactPanel && !contactPanel.element.contains(footer)) contactPanel.element.append(footer);
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

  const applyPanelVisibility = () => {
    const mobileFlow = mobileFlowQuery.matches;
    panels.forEach(panel => {
      panel.element.dataset.panelSection = panel.key;
      panel.element.tabIndex = -1;
      const selected = mobileFlow || panel === active;
      panel.element.hidden = !selected;
      panel.element.setAttribute("aria-hidden", String(!selected));
      setInert(panel.element, !selected);
    });
    [...main.children].forEach(child => {
      child.hidden = !panels.some(panel => panel.element === child);
    });
    if (footer) footer.hidden = mobileFlow ? false : active.key !== "contact";
    document.body.classList.toggle("mobile-scroll-flow", mobileFlow);
  };
  applyPanelVisibility();
  mobileFlowQuery.addEventListener("change", () => {
    applyPanelVisibility();
    if (!mobileFlowQuery.matches) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    const resolved = resolveHash(window.location.hash);
    const target = resolved?.target || (resolved?.panel && resolved.panel !== byKey.get("home") ? resolved.panel.element : null);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "auto" }));
    else window.scrollTo({ top: 0, behavior: "auto" });
  });

  function updateButtons(panel) {
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
    document.querySelectorAll(".site-nav a[href^='#']").forEach(link => {
      const resolved = resolveHash(link.getAttribute("href"));
      if (resolved && resolved.panel === panel) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function syncMobileActivePanel() {
    if (!mobileFlowQuery.matches) return;
    const threshold = Math.min(window.innerHeight * .35, 260);
    let next = panels[0];
    panels.forEach(panel => {
      if (panel.element.getBoundingClientRect().top <= threshold) next = panel;
    });
    if (!next || next === active) return;
    active = next;
    document.body.dataset.activePanel = active.key;
    updateButtons(active);
    updateHeaderLinks(active);
    if (footer) footer.hidden = false;
  }

  window.addEventListener("scroll", syncMobileActivePanel, { passive: true });

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

  function reconcileActivePanel() {
    transitionSequence += 1;
    panels.forEach(panel => {
      panel.element.classList.remove("section-panel-entering", "section-panel-leaving");
    });
    applyPanelVisibility();
    document.body.dataset.activePanel = active.key;
    updateButtons(active);
    updateHeaderLinks(active);
  }

  function activate(panel, options = {}) {
    if (!panel) return;
    const anchorTarget = options.target && options.target !== panel.element ? options.target : null;
    if (panel === active) {
      reconcileActivePanel();
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
      if (item === active || item === panel) return;
      item.element.classList.remove("section-panel-entering", "section-panel-leaving");
      item.element.hidden = true;
      item.element.setAttribute("aria-hidden", "true");
      setInert(item.element, true);
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

  // Let the buttons follow the pointer like a smooth desktop dock.
  let dockPointer = null;
  let dockPointerInside = false;
  let focusedRailButton = null;
  let dockAnimationFrame = 0;
  let dockPreviousFrameTime = 0;
  const dockMotion = railButtons.map(() => ({ scale: 1, shift: 0 }));

  function clearDockScale() {
    if (dockAnimationFrame) window.cancelAnimationFrame(dockAnimationFrame);
    dockAnimationFrame = 0;
    dockPreviousFrameTime = 0;
    railButtons.forEach(button => {
      button.style.setProperty("--rail-scale", "1");
      button.style.setProperty("--dock-shift-x", "0px");
      button.style.setProperty("--dock-shift-y", "0px");
      button.style.removeProperty("z-index");
    });
    dockMotion.forEach(motion => {
      motion.scale = 1;
      motion.shift = 0;
    });
  }

  function dockUsesHorizontalAxis() {
    return sectionRail.dataset.dockPosition === "top" || sectionRail.dataset.dockPosition === "bottom";
  }

  function getDockMagnificationTargets() {
    const horizontal = dockUsesHorizontalAxis();
    const radius = dockPreset.hoverRange;
    const scaleRange = dockPreset.magnification;
    const menuRect = menu.getBoundingClientRect();
    const menuOrigin = horizontal ? menuRect.left + menu.clientLeft : menuRect.top + menu.clientTop;
    const centers = railButtons.map(button => menuOrigin + (horizontal
      ? button.offsetLeft + button.offsetWidth / 2
      : button.offsetTop + button.offsetHeight / 2));
    const pointerCoordinate = dockPointerInside && dockPointer
      ? (horizontal ? dockPointer.x : dockPointer.y)
      : centers[railButtons.indexOf(focusedRailButton)];

    if (!Number.isFinite(pointerCoordinate)) {
      return railButtons.map(() => ({ scale: 1, shift: 0, influence: 0 }));
    }

    const targets = railButtons.map((button, index) => {
      const distance = Math.abs(pointerCoordinate - centers[index]);
      const influence = distance >= radius ? 0 : (1 + Math.cos((distance / radius) * Math.PI)) / 2;
      const scale = 1 + scaleRange * influence;
      const size = horizontal ? button.offsetWidth : button.offsetHeight;
      return { scale, growth: size * (scale - 1) / 2, influence };
    });

    let expandedBefore = 0;
    const expandedCenters = targets.map(target => {
      const expandedCenter = expandedBefore * 2 + target.growth;
      expandedBefore += target.growth;
      return expandedCenter;
    });

    let anchorShift = expandedCenters[0] || 0;
    if (pointerCoordinate >= centers[centers.length - 1]) {
      anchorShift = expandedCenters[expandedCenters.length - 1] || 0;
    } else if (pointerCoordinate > centers[0]) {
      const nextIndex = centers.findIndex((center, index) => index > 0 && center >= pointerCoordinate);
      const previousIndex = nextIndex - 1;
      const interval = centers[nextIndex] - centers[previousIndex];
      const progress = interval > 0 ? (pointerCoordinate - centers[previousIndex]) / interval : 0;
      anchorShift = expandedCenters[previousIndex] + (expandedCenters[nextIndex] - expandedCenters[previousIndex]) * progress;
    }

    return targets.map((target, index) => ({
      scale: target.scale,
      shift: expandedCenters[index] - anchorShift,
      influence: target.influence
    }));
  }

  function animateDockScale(time) {
    dockAnimationFrame = 0;
    const delta = dockPreviousFrameTime ? Math.min(50, time - dockPreviousFrameTime) : 16;
    dockPreviousFrameTime = time;
    const responseTime = Math.max(0.017, dockPreset.smoothness / 3);
    const progress = 1 - Math.exp(-(delta / 1000) / responseTime);
    const targets = getDockMagnificationTargets();
    let stillMoving = false;

    railButtons.forEach((button, index) => {
      const current = dockMotion[index];
      const target = targets[index];
      current.scale += (target.scale - current.scale) * progress;
      current.shift += (target.shift - current.shift) * progress;
      if (Math.abs(target.scale - current.scale) < 0.001) current.scale = target.scale;
      if (Math.abs(target.shift - current.shift) < 0.03) current.shift = target.shift;
      if (current.scale !== target.scale || current.shift !== target.shift) stillMoving = true;

      button.style.setProperty("--rail-scale", current.scale.toFixed(4));
      button.style.setProperty("--dock-shift-x", `${(dockUsesHorizontalAxis() ? current.shift : 0).toFixed(2)}px`);
      button.style.setProperty("--dock-shift-y", `${(dockUsesHorizontalAxis() ? 0 : current.shift).toFixed(2)}px`);
      button.style.zIndex = String(1 + Math.round(target.influence * 12));
    });

    if (stillMoving) dockAnimationFrame = window.requestAnimationFrame(animateDockScale);
    else dockPreviousFrameTime = 0;
  }

  function refreshDockScale() {
    if (!railDockQuery.matches || reducedMotion.matches || document.hidden) {
      clearDockScale();
      return;
    }
    if (!dockAnimationFrame) dockAnimationFrame = window.requestAnimationFrame(animateDockScale);
  }

  menu.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    dockPointerInside = true;
    dockPointer = { x: event.clientX, y: event.clientY };
    refreshDockScale();
  });
  menu.addEventListener("pointerleave", () => {
    dockPointerInside = false;
    dockPointer = null;
    refreshDockScale();
  });
  menu.addEventListener("focusin", event => {
    focusedRailButton = event.target.closest(".section-rail-button");
    dockPointerInside = false;
    refreshDockScale();
  });
  menu.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      focusedRailButton = menu.contains(document.activeElement)
        ? document.activeElement.closest(".section-rail-button")
        : null;
      refreshDockScale();
    });
  });
  window.addEventListener("resize", refreshDockScale, { passive: true });

  function applyDockPreset() {
    sectionRail.dataset.dockPosition = dockPreset.position;
    document.body.dataset.dockPosition = dockPreset.position;
    sectionRail.style.setProperty("--dock-icon-size", `${dockPreset.iconSize}px`);
    refreshDockScale();
  }

  applyDockPreset();
  railDockQuery.addEventListener("change", refreshDockScale);
  reducedMotion.addEventListener("change", refreshDockScale);
  document.addEventListener("visibilitychange", refreshDockScale);
  refreshDockScale();

  document.addEventListener("click", event => {
    if (event.defaultPrevented || mobileFlowQuery.matches) return;
    const link = event.target.closest?.("a[href^='#']");
    if (!link) return;
    const resolved = resolveHash(link.getAttribute("href"));
    if (!resolved) return;
    event.preventDefault();
    activate(resolved.panel, { updateHistory: true, hash: link.getAttribute("href"), target: resolved.target, focus: true });
  });

  const restoreFromLocation = () => {
    if (mobileFlowQuery.matches) return;
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

  if (mobileFlowQuery.matches) {
    const initialTarget = initial.target || (initial.panel !== byKey.get("home") ? initial.panel.element : null);
    if (initialTarget) requestAnimationFrame(() => initialTarget.scrollIntoView({ block: "start", behavior: "auto" }));
  } else if (initial.target && initial.target !== active.element) {
    requestAnimationFrame(() => initial.target.scrollIntoView({ block: "start" }));
  }
  if (active.key === "work" || active.key === "archive") refreshSectionWidgets(active);
})();