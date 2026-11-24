/* ==========================================================================
   MASSYNE — DEEP 3D CURVED ORBITAL RING CONTROLLER (#work)
   Hardware accelerated 60fps rAF orbital physics, glass-free 3D artworks,
   animated crimson corner reticles (┌ ┐ └ ┘), and interactive orbital scrubber.
   Zero external dependencies • Pure Dark-Only Lock
   ========================================================================== */
(() => {
  "use strict";

  const grid = document.querySelector(".project-grid");
  const stage = document.querySelector(".curated-stage");
  const controls = document.querySelector(".carousel-controls");
  const buttons = [...document.querySelectorAll(".view-switch [data-view]")];
  const allCards = grid ? [...grid.querySelectorAll(":scope > .project")] : [];
  let cards = allCards.filter(card => !card.hidden);

  const prev = document.querySelector(".carousel-prev");
  const next = document.querySelector(".carousel-next");
  const togglePlayback = document.querySelector(".carousel-autoplay");
  const positionLabel = document.querySelector(".carousel-position");
  const currentName = document.querySelector(".carousel-current-name");
  const countLabel = document.querySelector(".project-count-label");
  const discoverCount = document.getElementById("discover-count");
  const discoverSearch = document.getElementById("discover-search");

  // Scrubber Elements
  const scrubber = document.querySelector(".orbital-scrubber");
  const scrubberProgress = document.querySelector(".orbital-scrubber-progress");
  const scrubberThumb = document.querySelector(".orbital-scrubber-thumb");

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dialog = document.querySelector(".lightbox");

  if (!grid || !stage || !allCards.length) return;

  let count = cards.length;
  let mode = "3d";
  let active = 0;
  let currentPos = 0;
  let targetPos = 0;
  let drag = null;
  let suppressClickUntil = 0;
  let visible = false;
  let hovering = false;
  let userPaused = false;
  let lastInteraction = -1000000;
  let playback = null;
  let wheelAt = 0;
  let animationId = null;
  let scrubberDragging = false;

  // Card per-instance physics state for spring-lerp hover tilt
  const cardState = new WeakMap();

  function applyCardAspect(card) {
    const img = card.querySelector("img");
    if (!img) return;

    const update = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const ratio = nw / nh;
        card.style.setProperty("--item-aspect", `${nw} / ${nh}`);
        card.style.setProperty("--item-ratio", ratio.toFixed(4));
        card.style.setProperty("--item-natural-w", `${nw}px`);
        card.style.setProperty("--item-natural-h", `${nh}px`);
      }
    };

    if (img.complete && img.naturalWidth) {
      update();
    } else {
      img.addEventListener("load", update, { once: true });
    }
  }

  function initCardElements(card) {
    // 0. Ensure card respects intrinsic natural dimensions & aspect ratio
    applyCardAspect(card);

    // 1. Remove old SVG edge tracers
    card.querySelector(".carousel-edge-light")?.remove();

    // 2. Inject 4 Crimson Corner Reticles (┌ ┐ └ ┘, #c81024)
    if (!card.querySelector(".orbital-reticles")) {
      const reticles = document.createElement("div");
      reticles.className = "orbital-reticles";
      reticles.setAttribute("aria-hidden", "true");
      reticles.innerHTML = `
        <span class="reticle reticle-tl"></span>
        <span class="reticle reticle-tr"></span>
        <span class="reticle reticle-bl"></span>
        <span class="reticle reticle-br"></span>
      `;
      card.appendChild(reticles);
    }

    // 3. Inject Soft Floor Reflection Beneath
    if (!card.querySelector(".orbital-floor-reflection")) {
      const floor = document.createElement("div");
      floor.className = "orbital-floor-reflection";
      floor.setAttribute("aria-hidden", "true");
      card.appendChild(floor);
    }

    // 4. Inject Neutral White/Silver Sheen (NO red cursor tint)
    if (!card.querySelector(".orbital-card-sheen")) {
      const sheen = document.createElement("div");
      sheen.className = "orbital-card-sheen";
      sheen.setAttribute("aria-hidden", "true");
      card.appendChild(sheen);
    }

    // Card Hover Physics State
    cardState.set(card, {
      tiltX: 0,
      tiltY: 0,
      liftZ: 0,
      targetTiltX: 0,
      targetTiltY: 0,
      targetLiftZ: 0
    });

    // Smooth Pointer Hover Tracking
    card.addEventListener("pointermove", event => {
      if (mode !== "3d" || (drag && drag.moving)) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (event.clientX - rect.left) / rect.width - 0.5; // -0.5 to +0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5; // -0.5 to +0.5

      const state = cardState.get(card);
      if (state) {
        state.targetTiltY = px * 24;  // rotateY ±24deg toward cursor
        state.targetTiltX = -py * 24; // rotateX ±24deg toward cursor
        state.targetLiftZ = 46;       // lift +46px forward in 3D Z-space
      }
      // Neutral light reflection location
      card.style.setProperty("--sheen-x", `${((px + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--sheen-y", `${((py + 0.5) * 100).toFixed(1)}%`);
    });

    card.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse") {
        card.classList.add("is-hovered");
        hovering = true;
      }
    });

    card.addEventListener("pointerleave", () => {
      const state = cardState.get(card);
      if (state) {
        state.targetTiltX = 0;
        state.targetTiltY = 0;
        state.targetLiftZ = 0;
      }
      card.classList.remove("is-hovered");
      hovering = false;
    });
  }

  allCards.forEach(initCardElements);

  const labelFor = card => card.querySelector("h3")?.textContent?.trim() || "Selected work";
  const userAction = () => { lastInteraction = performance.now(); };

  // Angular distance to nearest wrapping position
  const nearest = (index, center) => {
    if (!count) return 0;
    let delta = (index - center) % count;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    return delta;
  };

  // Update dynamic counts and labels
  const updateLabels = activeIndex => {
    if (!count) {
      if (positionLabel) positionLabel.textContent = "00 / 00";
      if (currentName) currentName.textContent = "No matching projects";
      if (countLabel) countLabel.textContent = "CURATED WORKS — 00 WORKS";
      if (discoverCount) discoverCount.textContent = "0 original works";
      return;
    }
    const safeIdx = ((activeIndex % count) + count) % count;
    const selected = cards[safeIdx];
    if (positionLabel) {
      positionLabel.textContent = `${String(safeIdx + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
    }
    if (currentName && selected) {
      const suffix = selected.classList.contains("project-upcoming") ? " — Coming Soon" : "";
      const value = labelFor(selected) + suffix;
      if (currentName.textContent !== value) currentName.textContent = value;
    }
    if (countLabel) {
      const isMock = cards.some(c => (c.dataset.discoverCategories || "").includes("mockups"));
      countLabel.textContent = `${isMock ? "MOCKUP STUDIO" : "CURATED WORKS"} — ${String(count).padStart(2, "0")} WORKS`;
    }
    if (discoverCount) {
      const isMock = cards.some(c => (c.dataset.discoverCategories || "").includes("mockups"));
      discoverCount.textContent = `${count} ${isMock ? "mockups" : "original works"}`;
    }
    if (discoverSearch) {
      const isMock = cards.some(c => (c.dataset.discoverCategories || "").includes("mockups"));
      discoverSearch.placeholder = `Search ${count} ${isMock ? "mockups" : "works"}…`;
    }
  };

  // Update live progress scrubber bar
  const updateScrubber = (pos, total) => {
    if (!scrubberProgress || !scrubberThumb) return;
    if (!total || total <= 1) {
      scrubberProgress.style.width = "100%";
      scrubberThumb.style.left = "100%";
      if (scrubber) {
        scrubber.setAttribute("aria-valuemin", "1");
        scrubber.setAttribute("aria-valuemax", "1");
        scrubber.setAttribute("aria-valuenow", "1");
      }
      return;
    }
    const norm = (((pos % total) + total) % total) / (total - 1);
    const clamped = Math.max(0, Math.min(1, norm));
    const pct = `${(clamped * 100).toFixed(2)}%`;
    scrubberProgress.style.width = pct;
    scrubberThumb.style.left = pct;
    if (scrubber) {
      scrubber.setAttribute("aria-valuemin", "1");
      scrubber.setAttribute("aria-valuemax", String(total));
      scrubber.setAttribute("aria-valuenow", String(Math.round(clamped * (total - 1)) + 1));
    }
  };

  // 60fps Deep 3D Curved Orbital Physics Loop
  function physicsLoop(timestamp) {
    if (mode === "3d" && visible && !document.hidden && count > 0) {
      const time = timestamp * 0.001; // seconds

      // Silky smooth orbital inertia lerp
      let diff = targetPos - currentPos;
      diff = ((diff + count * 1.5) % count) - count * 0.5;
      if (Math.abs(diff) > 0.0005) {
        currentPos += diff * 0.068;
      } else {
        currentPos = targetPos;
      }
      currentPos = ((currentPos % count) + count) % count;

      // Update Scrubber Progress
      updateScrubber(currentPos, count);

      // Deep 3D Horizontal Arc Parameters
      const isMobile = window.innerWidth <= 850;
      const radius = isMobile
        ? Math.min(520, window.innerWidth * 0.78)
        : Math.min(920, Math.max(460, window.innerWidth * 0.56));
      const stepAngle = isMobile ? 32 : 28; // deg
      const isReduced = motion.matches;

      let closestIdx = 0;
      let minCenterDist = Infinity;

      cards.forEach((card, index) => {
        const state = cardState.get(card);
        if (!state) return;

        // Spring-lerp hover tilt (0.08 spring-lerp)
        state.tiltX += (state.targetTiltX - state.tiltX) * 0.08;
        state.tiltY += (state.targetTiltY - state.tiltY) * 0.08;
        state.liftZ += (state.targetLiftZ - state.liftZ) * 0.08;

        // Nearest angular position relative to center
        const offset = nearest(index, currentPos);
        const absOffset = Math.abs(offset);

        if (absOffset < minCenterDist) {
          minCenterDist = absOffset;
          closestIdx = index;
        }

        // Beyond ~3.3 steps card is out of field of view
        if (absOffset > 3.35) {
          card.style.opacity = "0";
          card.style.visibility = "hidden";
          card.style.pointerEvents = "none";
          return;
        }

        const angleDeg = offset * stepAngle;
        const angleRad = (angleDeg * Math.PI) / 180;

        // Deep 3D Orbital Geometry:
        // x = Math.sin(angleRad) * radius
        // z = (Math.cos(angleRad) - 1) * radius * 1.24 + centerBoost
        // rotY = -angleDeg * 1.28
        // Floating 3D levitation = Math.sin(t + idx * 1.15) * 4.5px
        const centerBoost = Math.max(0, 1 - absOffset) * 68;
        const x = Math.sin(angleRad) * radius;
        const z = (Math.cos(angleRad) - 1) * radius * 1.24 + centerBoost;
        const rotY = -angleDeg * 1.28;
        const levitation = isReduced ? 0 : Math.sin(time * 2.2 + index * 1.15) * 4.5;

        const isCenter = absOffset < 0.45;
        const opacity = absOffset <= 1.5 ? 1 : Math.max(0, 1 - (absOffset - 1.5) / 1.7);
        const zIndex = 100 - Math.round(absOffset * 15);

        card.style.visibility = "visible";
        card.style.pointerEvents = absOffset < 2.5 ? "auto" : "none";
        card.style.zIndex = String(zIndex);
        card.style.opacity = opacity.toFixed(3);

        // Hardware accelerated 3D transform combining orbital arc, levitation, and hover spring tilt
        card.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${levitation.toFixed(1)}px), ${(z + state.liftZ).toFixed(1)}px) rotateX(${state.tiltX.toFixed(2)}deg) rotateY(${(rotY + state.tiltY).toFixed(2)}deg)`;

        card.classList.toggle("is-carousel-active", isCenter);
        card.classList.toggle("is-carousel-near", absOffset < 1.6);
        card.setAttribute("aria-hidden", String(!isCenter));
        card.tabIndex = isCenter && card.classList.contains("image-open") ? 0 : -1;
      });

      if (closestIdx !== active) {
        active = closestIdx;
        updateLabels(active);
      }
    }

    animationId = window.requestAnimationFrame(physicsLoop);
  }

  const changeSlide = (index, isManual = true) => {
    if (isManual) userAction();
    if (!count) return;
    targetPos = Math.round(index);
    targetPos = ((targetPos % count) + count) % count;
  };

  // Autoplay Logic
  const canPlay = () =>
    mode === "3d" && count > 1 &&
    visible &&
    !motion.matches &&
    !userPaused &&
    !hovering &&
    !scrubberDragging &&
    !document.hidden &&
    !dialog?.open && !document.querySelector('.director-dialog[open]') &&
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
      if (canPlay()) changeSlide(targetPos + 1, false);
    }, 3900);
  };

  const updateToggle = () => {
    if (!togglePlayback) return;
    togglePlayback.hidden = motion.matches || mode !== "3d";
    togglePlayback.setAttribute("aria-pressed", String(userPaused));
    togglePlayback.setAttribute("aria-label", userPaused
      ? "Resume automatic orbital transitions"
      : "Pause automatic orbital transitions");
    togglePlayback.textContent = userPaused ? "Play" : "Pause";
  };

  // View Mode Switching (3d / grid / index)
  const setView = value => {
    mode = value;
    grid.dataset.view = value;
    const is3D = value === "3d";
    grid.classList.toggle("carousel-ready", is3D);
    stage.classList.toggle("carousel-active", is3D);
    grid.classList.remove("is-dragging");
    controls.hidden = !is3D;
    if (scrubber) scrubber.hidden = !is3D;

    document.querySelectorAll(".orbital-compass").forEach(el => {
      el.hidden = !is3D;
    });

    buttons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.view === value));
    });

    if (is3D) {
      updateLabels(active);
      if (!animationId) animationId = window.requestAnimationFrame(physicsLoop);
    } else {
      cards.forEach(card => {
        card.classList.remove("is-carousel-active", "is-carousel-near", "is-hovered");
        card.removeAttribute("aria-hidden");
        card.style.pointerEvents = "";
        card.style.visibility = "";
        card.style.opacity = "";
        card.style.transform = "";
        card.style.zIndex = "";
        if (card.classList.contains("image-open")) card.tabIndex = 0;
        else card.removeAttribute("tabindex");
      });
    }
    updateToggle();
    updatePlayback();
  };

  buttons.forEach(button => button.addEventListener("click", () => {
    userAction();
    setView(button.dataset.view);
  }));

  prev?.addEventListener("click", () => changeSlide(targetPos - 1));
  next?.addEventListener("click", () => changeSlide(targetPos + 1));
  togglePlayback?.addEventListener("click", () => {
    userPaused = !userPaused;
    userAction();
    updateToggle();
    updatePlayback();
  });

  // Keyboard navigation
  grid.addEventListener("keydown", event => {
    if (mode !== "3d") return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      changeSlide(targetPos + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeSlide(targetPos - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      changeSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      changeSlide(count - 1);
    }
  });

  // Shortest-Path Clicking on Flanking Artwork, Native Open on Centered Artwork
  grid.addEventListener("click", event => {
    if (mode !== "3d") return;
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const card = event.target.closest(".project");
    if (!card) return;
    const targetIdx = cards.indexOf(card);
    if (targetIdx < 0) return;

    const offset = nearest(targetIdx, currentPos);
    // If flanking artwork is clicked, smoothly orbit to center
    if (Math.abs(offset) > 0.45) {
      event.preventDefault();
      event.stopPropagation();
      userAction();
      targetPos = Math.round(currentPos + offset);
    }
    // If center artwork is clicked, allow event to propagate to open case study / modal!
  }, true);

  // Horizontal Pointer Drag (Touch / Mouse) without blocking vertical scroll
  grid.addEventListener("pointerdown", event => {
    if (mode !== "3d" || (event.pointerType === "mouse" && event.button !== 0)) return;
    drag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPos: targetPos,
      moving: false
    };
    userAction();
  });

  grid.addEventListener("pointermove", event => {
    if (mode !== "3d" || !drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.moving) {
      // Only capture if strictly horizontal movement
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        drag.moving = true;
        grid.classList.add("is-dragging");
        try { grid.setPointerCapture(event.pointerId); } catch (_) {}
      }
    }

    if (drag.moving) {
      const slideStep = window.innerWidth <= 850 ? 210 : 320;
      targetPos = drag.startPos - (dx / slideStep);
      if (event.cancelable) event.preventDefault();
    }
  });

  const finishDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moving;
    drag = null;
    grid.classList.remove("is-dragging");

    if (moved) {
      suppressClickUntil = performance.now() + 350;
      targetPos = Math.round(targetPos);
    }
    try {
      if (grid.hasPointerCapture(event.pointerId)) grid.releasePointerCapture(event.pointerId);
    } catch (_) {}
  };

  grid.addEventListener("pointerup", finishDrag);
  grid.addEventListener("pointercancel", finishDrag);
  grid.addEventListener("lostpointercapture", finishDrag);

  // Horizontal Wheel / Trackpad Gesture (Leaves vertical scroll untouched)
  grid.addEventListener("wheel", event => {
    if (mode !== "3d" || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.15) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelAt < 380) return;
    wheelAt = now;
    userAction();
    changeSlide(targetPos + Math.sign(event.deltaX));
  }, { passive: false });

  // Scrubber Drag & Click Handling
  if (scrubber) {
    const handleScrub = clientX => {
      const rect = scrubber.getBoundingClientRect();
      if (!rect.width || !count) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      targetPos = Math.round(ratio * (count - 1));
      userAction();
    };

    scrubber.addEventListener("pointerdown", event => {
      scrubberDragging = true;
      scrubber.classList.add("is-dragging");
      handleScrub(event.clientX);
      try { scrubber.setPointerCapture(event.pointerId); } catch (_) {}
    });

    scrubber.addEventListener("pointermove", event => {
      if (!scrubberDragging) return;
      handleScrub(event.clientX);
    });

    const endScrub = event => {
      if (!scrubberDragging) return;
      scrubberDragging = false;
      scrubber.classList.remove("is-dragging");
      try {
        if (scrubber.hasPointerCapture(event.pointerId)) scrubber.releasePointerCapture(event.pointerId);
      } catch (_) {}
    };

    scrubber.addEventListener("pointerup", endScrub);
    scrubber.addEventListener("pointercancel", endScrub);
  }

  // Hover detection for pausing autoplay
  stage.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") hovering = true;
  });
  stage.addEventListener("pointerleave", () => { hovering = false; });

  // Intersection Observer for pausing physics when offscreen
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible && mode === "3d" && !animationId) {
        animationId = window.requestAnimationFrame(physicsLoop);
      }
    }, { threshold: 0.15 });
    observer.observe(stage);
  } else {
    visible = true;
    animationId = window.requestAnimationFrame(physicsLoop);
  }

  // Live Category Filtering Integration (All Artwork & Mockups)
  const filterButtons = [...document.querySelectorAll("#work [data-discover-category]")];

  const isMockupCard = card => {
    const cats = (card.dataset.discoverCategories || "").toLowerCase();
    return cats.includes("mockups");
  };

  function applyCategoryFilter(category) {
    const isMockupsCat = category === "mockups";

    allCards.forEach(card => {
      const isMock = isMockupCard(card);
      const show = isMockupsCat ? isMock : !isMock;

      card.hidden = !show;
      if (!show) {
        card.classList.remove("is-carousel-active", "is-carousel-near", "is-hovered");
        card.setAttribute("aria-hidden", "true");
        card.style.opacity = "0";
        card.style.visibility = "hidden";
        card.style.pointerEvents = "none";
        card.tabIndex = -1;
      } else {
        card.style.visibility = "";
      }
    });

    filterButtons.forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.dataset.discoverCategory === category));
    });

    cards = allCards.filter(card => !card.hidden);
    count = cards.length;
    targetPos = 0;
    currentPos = 0;
    active = 0;
    drag = null;
    grid.classList.remove("is-dragging");

    updateLabels(0);
    updateScrubber(0, count);
    updatePlayback();
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      userAction();
      const cat = btn.dataset.discoverCategory || "all";
      applyCategoryFilter(cat);
    });
  });

  grid.addEventListener("discoverychange", () => {
    cards = allCards.filter(card => !card.hidden);
    count = cards.length;
    targetPos = 0;
    currentPos = 0;
    active = 0;
    drag = null;
    grid.classList.remove("is-dragging");
    updateLabels(0);
    updateScrubber(0, count);
    updatePlayback();
  });

  // Reduced motion preference listener
  motion.addEventListener?.("change", () => {
    userPaused = motion.matches;
    updateToggle();
    updatePlayback();
  });

  document.addEventListener("visibilitychange", () => {
    updatePlayback();
  });

  // Activate 3D Orbital Ring layout
  setView("3d");
  updateLabels(0);
})();
