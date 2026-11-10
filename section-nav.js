(() => {
  "use strict";

  const main = document.querySelector("#top");
  const menu = document.querySelector("#section-rail-menu");
  const sectionRail = document.querySelector("#section-rail");
  if (!main || !menu || !sectionRail) return;
  const mobileFlowQuery = window.matchMedia("(max-width: 850px)");

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
  const railButtons = [...menu.querySelectorAll(".section-rail-button")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const railDockQuery = window.matchMedia("(min-width: 851px) and (hover: hover) and (pointer: fine)");
  const dockSettingsDefaults = { position: "left", smoothness: 0.18, magnification: 0.6, hoverRange: 120, iconSize: 40 };
  const dockSettings = (() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("massyneDockSettings") || "{}");
      const clamp = (value, min, max, fallback) => {
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
      };
      return {
        position: ["top", "left", "right", "bottom"].includes(saved.position) ? saved.position : dockSettingsDefaults.position,
        smoothness: clamp(saved.smoothness, 0.05, 0.5, dockSettingsDefaults.smoothness),
        magnification: clamp(saved.magnification, 0.1, 1.2, dockSettingsDefaults.magnification),
        hoverRange: clamp(saved.hoverRange, 40, 240, dockSettingsDefaults.hoverRange),
        iconSize: clamp(saved.iconSize, 28, 56, dockSettingsDefaults.iconSize)
      };
    } catch (_) {
      return { ...dockSettingsDefaults };
    }
  })();
  const dockSettingsToggle = document.querySelector("#dock-settings-toggle");
  const dockSettingsPanel = document.querySelector("#dock-settings-panel");
  const dockSettingsHeading = document.querySelector("#dock-settings-heading");
  const dockSettingsFields = document.querySelector("#dock-settings-fields");
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
    if (id === "top") return { panel: byKey.get("home"), target: null };
    if (id === "about") return { panel: byKey.get("home"), target: mobileFlowQuery.matches ? document.getElementById("about") : null };
    if (byId.has(id)) return { panel: byId.get(id), target: byId.get(id).element };
    const target = document.getElementById(id);
    if (!target) return null;
    const panel = panels.find(item => item.element === target || item.element.contains(target));
    return panel ? { panel, target } : null;
  }

  const initial = resolveHash(window.location.hash) || { panel: byKey.get("home"), target: null };
  let active = initial.panel;
  let transitionSequence = 0;
  let returningToHome = false;

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
    // A stale transition can leave the visible panel out of sync with the URL
    // and selected rail button. Rebuild the current state instead of trusting
    // the previous animation to have completed.
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
    if (panel.key !== "contact") returningToHome = false;
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

  function clearDockScale() {
    railButtons.forEach(button => {
      button.style.setProperty("--rail-scale", "1");
      button.style.removeProperty("z-index");
    });
  }

  function dockUsesHorizontalAxis() {
    return sectionRail.dataset.dockPosition === "top" || sectionRail.dataset.dockPosition === "bottom";
  }

  function setDockScale(pointerCoordinate) {
    const horizontal = dockUsesHorizontalAxis();
    const radius = dockSettings.hoverRange;
    const scaleRange = dockSettings.magnification;

    railButtons.forEach(button => {
      const rect = button.getBoundingClientRect();
      const buttonCenter = horizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
      const distance = Math.abs(pointerCoordinate - buttonCenter);
      const influence = distance >= radius ? 0 : (1 + Math.cos((distance / radius) * Math.PI)) / 2;
      button.style.setProperty("--rail-scale", (1 + scaleRange * influence).toFixed(3));
      button.style.zIndex = String(1 + Math.round(influence * 12));
    });
  }

  function refreshDockScale() {
    if (!railDockQuery.matches || reducedMotion.matches || document.hidden) {
      clearDockScale();
      return;
    }

    if (dockPointerInside && dockPointer) {
      setDockScale(dockUsesHorizontalAxis() ? dockPointer.x : dockPointer.y);
      return;
    }

    if (focusedRailButton?.isConnected) {
      const rect = focusedRailButton.getBoundingClientRect();
      setDockScale(dockUsesHorizontalAxis() ? rect.left + rect.width / 2 : rect.top + rect.height / 2);
      return;
    }

    clearDockScale();
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

  const dockRanges = [
    { key: "smoothness", input: "#dock-smoothness", output: "#dock-smoothness-output", format: value => Number(value).toFixed(2) },
    { key: "magnification", input: "#dock-magnification", output: "#dock-magnification-output", format: value => Number(value).toString() },
    { key: "hoverRange", input: "#dock-hover-range", output: "#dock-hover-range-output", format: value => `${Number(value)}px` },
    { key: "iconSize", input: "#dock-icon-size", output: "#dock-icon-size-output", format: value => `${Number(value)}px` }
  ];
  const dockPositionOptions = [...document.querySelectorAll("[data-dock-position-option]")];

  function applyDockSettings(persist = false) {
    sectionRail.dataset.dockPosition = dockSettings.position;
    document.body.dataset.dockPosition = dockSettings.position;
    sectionRail.style.setProperty("--dock-smoothness", `${dockSettings.smoothness}s`);
    sectionRail.style.setProperty("--dock-magnification", String(dockSettings.magnification));
    sectionRail.style.setProperty("--dock-hover-range", `${dockSettings.hoverRange}px`);
    sectionRail.style.setProperty("--dock-icon-size", `${dockSettings.iconSize}px`);

    dockPositionOptions.forEach(option => {
      const selected = option.dataset.dockPositionOption === dockSettings.position;
      option.setAttribute("aria-checked", String(selected));
      option.tabIndex = selected ? 0 : -1;
    });
    dockRanges.forEach(({ key, input: inputSelector, output: outputSelector, format }) => {
      const input = document.querySelector(inputSelector);
      const output = document.querySelector(outputSelector);
      if (input) input.value = String(dockSettings[key]);
      if (output) output.value = format(dockSettings[key]);
    });

    if (persist) {
      try { window.localStorage.setItem("massyneDockSettings", JSON.stringify(dockSettings)); } catch (_) {}
    }
    refreshDockScale();
  }

  function setDockSettingsOpen(open) {
    if (!dockSettingsPanel || !dockSettingsToggle) return;
    dockSettingsPanel.hidden = !open;
    dockSettingsToggle.setAttribute("aria-expanded", String(open));
    dockSettingsToggle.setAttribute("aria-label", open ? "Close dock settings" : "Open dock settings");
  }

  dockPositionOptions.forEach((option, index) => {
    option.addEventListener("click", () => {
      dockSettings.position = option.dataset.dockPositionOption;
      applyDockSettings(true);
    });
    option.addEventListener("keydown", event => {
      const [rowDelta, columnDelta] = {
        ArrowRight: [0, 1],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowUp: [-1, 0]
      }[event.key] || [];
      if (rowDelta === undefined) return;
      event.preventDefault();
      const row = Math.floor(index / 2);
      const column = index % 2;
      const nextRow = (row + rowDelta + 2) % 2;
      const nextColumn = (column + columnDelta + 2) % 2;
      const next = dockPositionOptions[nextRow * 2 + nextColumn];
      next.focus();
      next.click();
    });
  });

  dockRanges.forEach(({ key, input: inputSelector }) => {
    const input = document.querySelector(inputSelector);
    if (!input) return;
    input.addEventListener("input", () => {
      dockSettings[key] = Number(input.value);
      applyDockSettings(false);
    });
    input.addEventListener("change", () => {
      dockSettings[key] = Number(input.value);
      applyDockSettings(true);
    });
  });

  dockSettingsToggle?.addEventListener("click", () => setDockSettingsOpen(dockSettingsPanel?.hidden));
  dockSettingsHeading?.addEventListener("click", () => {
    if (!dockSettingsFields) return;
    const expanded = dockSettingsHeading.getAttribute("aria-expanded") === "true";
    dockSettingsHeading.setAttribute("aria-expanded", String(!expanded));
    dockSettingsFields.hidden = expanded;
  });
  document.addEventListener("pointerdown", event => {
    if (!dockSettingsPanel?.hidden && !event.target.closest("#dock-settings-ui")) setDockSettingsOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || dockSettingsPanel?.hidden) return;
    setDockSettingsOpen(false);
    dockSettingsToggle?.focus({ preventScroll: true });
  });

  applyDockSettings(false);
  railDockQuery.addEventListener("change", refreshDockScale);
  reducedMotion.addEventListener("change", refreshDockScale);
  document.addEventListener("visibilitychange", refreshDockScale);
  refreshDockScale();

  function atDesktopPanelEnd(panel) {
    return panel.element.scrollHeight - panel.element.clientHeight - panel.element.scrollTop <= 8;
  }

  function atMobileDocumentEnd() {
    const scroller = document.scrollingElement || document.documentElement;
    return scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 8;
  }

  function returnToHomeFromContact() {
    if (returningToHome) return;
    returningToHome = true;
    if (mobileFlowQuery.matches) {
      if (window.location.hash !== "#top") window.history.pushState({ section: "home" }, "", "#top");
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    } else {
      activate(byKey.get("home"), { updateHistory: true, hash: "#top", focus: false });
    }
    window.setTimeout(() => { returningToHome = false; }, reducedMotion.matches ? 120 : 1000);
  }

  contactPanel.element.addEventListener("wheel", event => {
    if (mobileFlowQuery.matches || active !== contactPanel || event.deltaY <= 0 || returningToHome) return;
    if (!atDesktopPanelEnd(contactPanel)) return;
    event.preventDefault();
    returnToHomeFromContact();
  }, { passive: false });

  let touchStartY = null;
  document.addEventListener("touchstart", event => {
    touchStartY = event.touches[0]?.clientY ?? null;
  }, { passive: true });
  document.addEventListener("touchmove", event => {
    if (!mobileFlowQuery.matches || active !== contactPanel || returningToHome || touchStartY === null) return;
    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined) return;
    const fingerMovingUp = touchStartY - currentY > 5;
    touchStartY = currentY;
    if (!fingerMovingUp || !atMobileDocumentEnd()) return;
    if (event.cancelable) event.preventDefault();
    returnToHomeFromContact();
  }, { passive: false });

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
