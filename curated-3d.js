/* MASSYNE Curated Works — light, dependency-free 3D carousel controller.
   Grid is the progressive enhancement fallback. */
(() => {
  "use strict";

  const grid = document.querySelector(".project-grid");
  const stage = document.querySelector(".curated-stage");
  const controls = document.querySelector(".carousel-controls");
  const buttons = [...document.querySelectorAll(".view-switch [data-view]")];
  const cards = grid ? [...grid.querySelectorAll(":scope > .project")] : [];
  const prev = document.querySelector(".carousel-prev");
  const next = document.querySelector(".carousel-next");
  const togglePlayback = document.querySelector(".carousel-autoplay");
  const positionLabel = document.querySelector(".carousel-position");
  const currentName = document.querySelector(".carousel-current-name");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dialog = document.querySelector(".lightbox");

  if (!grid || !stage || !controls || !cards.length || buttons.length < 2) return;

  const count = cards.length;

  // Offset the orbit phase so neighbouring borders never flash in sync.
  cards.forEach((card, index) => {
    card.style.setProperty("--massyne-fx-order", String(index));
  });

  // Animate grid cards only while they're on screen; the 3D view separately
  // animates only the current card and its immediate neighbours.
  if ("IntersectionObserver" in window) {
    const fxObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-in-viewport", entry.isIntersecting);
      }
    }, { threshold: .015, rootMargin: "70px 0px" });
    cards.forEach(card => fxObserver.observe(card));
  } else {
    cards.forEach(card => card.classList.add("is-in-viewport"));
  }

  const validModes = new Set(["3d", "grid", "index"]);
  let mode = "grid";
  let active = 0;
  let drag = null;
  let dragOffset = 0;
  let suppressClickUntil = 0;
  let slideStep = 280;
  let visible = false;
  let hovering = false;
  let userPaused = false;
  let lastInteraction = -1000000;
  let playback = null;
  let wheelAt = 0;
  let renderFrame = 0;

  const mod = index => (index % count + count) % count;
  const labelFor = card => card.querySelector("h3")?.textContent?.trim() || "Selected work";
  const userAction = () => { lastInteraction = performance.now(); };

  const nearest = (index, center) => {
    let delta = index - center;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    return delta;
  };

  const measureStep = () => {
    if (mode !== "3d") return;
    const width = cards[0].offsetWidth;
    if (width > 0) slideStep = width * (window.innerWidth < 560 ? 0.74 : 0.91);
  };

  const render = () => {
    renderFrame = 0;
    if (mode !== "3d") return;

    cards.forEach((card, index) => {
      const distance = nearest(index, active) + dragOffset;
      const amount = Math.abs(distance);
      const center = index === active;
      const outside = amount > 3.05;
      const opacity = amount <= 1.7 ? 1 : Math.max(0, (3.12 - amount) / 1.42);
      const scale = Math.max(0.72, 1 - amount * 0.085);
      const rotation = -Math.sign(distance) * Math.min(25, amount * 10);
      const depth = -Math.min(4, amount) * 82;

      card.style.setProperty("--carousel-x", (distance * slideStep).toFixed(1) + "px");
      card.style.setProperty("--carousel-z", depth.toFixed(1) + "px");
      card.style.setProperty("--carousel-rotate", rotation.toFixed(2) + "deg");
      card.style.setProperty("--carousel-scale", scale.toFixed(4));
      card.style.setProperty("--carousel-opacity", opacity.toFixed(3));
      card.style.setProperty("--carousel-layer", String(100 - Math.round(amount * 12)));
      card.style.setProperty("--carousel-brightness", Math.max(0.67, 1 - amount * 0.105).toFixed(3));

      card.classList.toggle("is-carousel-active", center);
      card.classList.toggle("is-carousel-near", !outside && amount < 1.65);
      card.classList.toggle("carousel-outside", outside);
      card.style.pointerEvents = amount < 2.25 && !outside ? "auto" : "none";
      card.setAttribute("aria-hidden", String(!center));

      // Only the centred finished project is in the keyboard tab order.
      card.tabIndex = center && card.classList.contains("image-open") ? 0 : -1;
    });

    const selected = cards[active];
    if (positionLabel) {
      positionLabel.textContent = String(active + 1).padStart(2, "0") + " / " + String(count).padStart(2, "0");
    }
    if (currentName) {
      const suffix = selected.classList.contains("project-upcoming") ? " — Coming Soon" : "";
      const value = labelFor(selected) + suffix;
      if (currentName.textContent !== value) currentName.textContent = value;
    }
  };

  const requestRender = () => {
    if (renderFrame || mode !== "3d") return;
    renderFrame = window.requestAnimationFrame(render);
  };

  const changeSlide = (index, isManual = true) => {
    if (isManual) userAction();
    active = mod(index);
    dragOffset = 0;
    requestRender();
  };

  const canPlay = () =>
    mode === "3d" &&
    visible &&
    !motion.matches &&
    !userPaused &&
    !hovering &&
    !document.hidden &&
    !dialog?.open &&
    performance.now() - lastInteraction > 7000 &&
    !grid.contains(document.activeElement) &&
    !controls.contains(document.activeElement);

  const updatePlayback = () => {
    if (playback) {
      window.clearInterval(playback);
      playback = null;
    }
    if (mode !== "3d" || motion.matches || userPaused) return;
    playback = window.setInterval(() => {
      if (canPlay()) changeSlide(active + 1, false);
    }, 3900);
  };

  const updateToggle = () => {
    if (!togglePlayback) return;
    togglePlayback.hidden = motion.matches || mode !== "3d";
    togglePlayback.setAttribute("aria-pressed", String(userPaused));
    togglePlayback.setAttribute("aria-label", userPaused
      ? "Resume automatic slide transitions"
      : "Pause automatic slide transitions");
    togglePlayback.textContent = userPaused ? "Play" : "Pause";
  };

  const setView = value => {
    if (!validModes.has(value)) return;
    mode = value;
    grid.dataset.view = value;
    const is3D = value === "3d";
    grid.classList.toggle("carousel-ready", is3D);
    stage.classList.toggle("carousel-active", is3D);
    grid.classList.remove("is-dragging");
    grid.setAttribute("aria-label", is3D
      ? "Curated works 3D carousel. Use arrow keys or drag to browse projects."
      : "Curated works " + (value === "index" ? "index" : "grid"));
    if (is3D) grid.setAttribute("aria-roledescription", "carousel");
    else grid.removeAttribute("aria-roledescription");
    controls.hidden = !is3D;
    drag = null;
    dragOffset = 0;

    buttons.forEach(button => {
      const selected = button.dataset.view === value;
      button.setAttribute("aria-pressed", String(selected));
    });

    if (is3D) {
      measureStep();
      render();
    } else {
      cards.forEach(card => {
        card.classList.remove("is-carousel-active", "is-carousel-near", "carousel-outside");
        card.removeAttribute("aria-hidden");
        card.style.pointerEvents = "";
        if (card.classList.contains("image-open")) card.tabIndex = 0;
        else card.removeAttribute("tabindex");
        for (const name of ["x", "z", "rotate", "scale", "opacity", "layer", "brightness"]) {
          card.style.removeProperty("--carousel-" + name);
        }
      });
    }
    updateToggle();
    updatePlayback();
  };

  buttons.forEach(button => button.addEventListener("click", () => {
    userAction();
    setView(button.dataset.view);
  }));

  prev?.addEventListener("click", () => changeSlide(active - 1));
  next?.addEventListener("click", () => changeSlide(active + 1));
  togglePlayback?.addEventListener("click", () => {
    userPaused = !userPaused;
    userAction();
    updateToggle();
    updatePlayback();
  });

  grid.addEventListener("keydown", event => {
    if (mode !== "3d") return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      changeSlide(active + (event.key === "ArrowRight" ? 1 : -1));
    } else if (event.key === "Home") {
      event.preventDefault();
      changeSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      changeSlide(count - 1);
    }
  });

  // Capture before the existing project lightbox handler: side cards focus first,
  // the selected card opens the original full-screen preview.
  grid.addEventListener("click", event => {
    if (mode !== "3d") return;
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const card = event.target.closest(".project");
    const target = cards.indexOf(card);
    if (target >= 0 && target !== active) {
      event.preventDefault();
      event.stopPropagation();
      changeSlide(target);
    }
  }, true);

  grid.addEventListener("pointerdown", event => {
    if (mode !== "3d" || (event.pointerType === "mouse" && event.button !== 0)) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, moving: false };
    userAction();
  });

  grid.addEventListener("pointermove", event => {
    if (mode !== "3d" || !drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moving && Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy) * 1.12) {
      drag.moving = true;
      grid.classList.add("is-dragging");
      try { grid.setPointerCapture(event.pointerId); } catch (_) { /* Native scrolling may own the pointer. */ }
    }
    if (!drag.moving) return;
    drag.dx = dx;
    dragOffset = Math.max(-3.1, Math.min(3.1, dx / slideStep));
    if (event.pointerType === "mouse" && event.cancelable) event.preventDefault();
    requestRender();
  });

  const finishDrag = (event, cancelled) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = drag.dx;
    const moved = drag.moving;
    drag = null;
    grid.classList.remove("is-dragging");
    dragOffset = 0;
    if (moved) suppressClickUntil = performance.now() + 400;
    if (!cancelled && moved && Math.abs(dx) > 42) {
      const steps = Math.min(3, Math.max(1, Math.round(Math.abs(dx) / slideStep)));
      changeSlide(active - Math.sign(dx) * steps);
    } else requestRender();
    try {
      if (grid.hasPointerCapture(event.pointerId)) grid.releasePointerCapture(event.pointerId);
    } catch (_) { /* The browser may have cancelled this pointer. */ }
  };
  grid.addEventListener("pointerup", event => finishDrag(event, false));
  grid.addEventListener("pointercancel", event => finishDrag(event, true));
  grid.addEventListener("lostpointercapture", event => {
    if (drag && drag.id === event.pointerId) finishDrag(event, true);
  });

  // Horizontal trackpad scrolling browses; vertical page scrolling is untouched.
  grid.addEventListener("wheel", event => {
    if (mode !== "3d" || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.1) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelAt < 390) return;
    wheelAt = now;
    changeSlide(active + Math.sign(event.deltaX));
  }, { passive: false });

  stage.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") hovering = true;
  });
  stage.addEventListener("pointerleave", () => { hovering = false; });
  controls.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") hovering = true;
  });
  controls.addEventListener("pointerleave", () => { hovering = false; });

  grid.classList.add("is-fx-offscreen");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      grid.classList.toggle("is-fx-offscreen", !visible);
    }, { threshold: 0.22 });
    observer.observe(stage);
  } else { visible = true; grid.classList.remove("is-fx-offscreen"); }

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      if (mode === "3d") {
        measureStep();
        render();
      }
    });
  }, { passive: true });

  motion.addEventListener?.("change", () => {
    if (motion.matches) {
      userPaused = false;
      if (mode === "3d") setView("grid");
    }
    updateToggle();
    updatePlayback();
  });
  document.addEventListener("visibilitychange", () => {
    grid.classList.toggle("is-fx-hidden", document.hidden);
    updatePlayback();
  });

  // Reduced-motion viewers start in the static grid but can explicitly choose 3D.
  setView(motion.matches ? "grid" : "3d");
})();