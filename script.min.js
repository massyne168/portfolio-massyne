const header = document.querySelector("#siteHeader");
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelectorAll(".nav-links a");

if (typeof window.CSS !== "undefined" && typeof window.CSS.registerProperty === "function") {
  document.body.classList.add("registerProperty-supported");
} else {
  document.body.classList.add("registerProperty-not-supported");
}

const revealItems = document.querySelectorAll(
  ".section-reveal, .project-card, .cyber-card, .service-card, .archive-card, .contact-card, .gurzil-logo-card, .gurzil-copy-card, .gurzil-image-card, .about-card, .about-skill-pills span, .motion-card"
);
const revealDuration = 800;
const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let scrollIdleTimer;

const markPageScrolling = () => {
  document.body.classList.add("is-scrolling");
  window.clearTimeout(scrollIdleTimer);
  scrollIdleTimer = window.setTimeout(() => {
    document.body.classList.remove("is-scrolling");
  }, 140);
};

const pageLoader = document.querySelector("#pageLoader");
const loaderPercent = document.querySelector("#loaderPercent");
const loaderStatus = document.querySelector("#loaderStatus");
const maximumLoadingTime = 2000;
let contentShown = false;

const showContent = () => {
  if (contentShown) {
    return;
  }

  contentShown = true;
  document.body.classList.remove("is-loading", "loading");
  document.body.classList.add("loaded");

  revealItems.forEach(item => {
    item.classList.add("is-visible");
    if (item.classList.contains("archive-card")) {
      item.classList.add("show");
    }
    item.style.transitionDelay = "";
  });

  document.querySelectorAll("main, .hero, .hero-content, .hero-image, .hero-visual, section, [data-animate], .reveal").forEach(item => {
    item.style.opacity = "1";
    item.style.visibility = "visible";
  });

  if (pageLoader) {
    pageLoader.classList.add("is-hidden", "loaded");
    window.setTimeout(() => {
      pageLoader.style.display = "none";
    }, 700);
  }
};

if (pageLoader && loaderPercent) {
  const loaderDuration = maximumLoadingTime;
  const loaderStatuses = [
    "Designing...",
    "Loading Visuals...",
    "Preparing Portfolio...",
    "Almost Ready..."
  ];
  const startTime = performance.now();
  let activeStatusIndex = 0;

  const updateLoader = currentTime => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / loaderDuration, 1);
    const percentage = Math.round(progress * 100);
    const statusIndex = Math.min(Math.floor(progress * loaderStatuses.length), loaderStatuses.length - 1);

    loaderPercent.textContent = `${percentage}%`;

    if (loaderStatus && statusIndex !== activeStatusIndex) {
      activeStatusIndex = statusIndex;
      loaderStatus.classList.add("is-changing");
      window.setTimeout(() => {
        loaderStatus.textContent = loaderStatuses[activeStatusIndex];
        loaderStatus.classList.remove("is-changing");
      }, 140);
    }

    if (progress < 1) {
      requestAnimationFrame(updateLoader);
      return;
    }

    loaderPercent.textContent = "100%";
  };

  requestAnimationFrame(updateLoader);
} else {
  showContent();
}

window.addEventListener("load", () => {
  showContent();
}, { once: true });
window.setTimeout(() => {
  showContent();
}, maximumLoadingTime);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = Number(entry.target.dataset.revealDelay || 0);
          entry.target.classList.add("is-visible");
          if (entry.target.classList.contains("archive-card")) {
            entry.target.classList.add("show");
          }
          window.setTimeout(() => {
            entry.target.style.transitionDelay = "";
          }, revealDuration + delay + 100);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -70px 0px"
    }
  );

  revealItems.forEach((item, index) => {
    const archiveIndex = item.classList.contains("archive-card")
      ? Array.from(document.querySelectorAll(".archive-card")).indexOf(item)
      : -1;
    const delay = archiveIndex >= 0 ? archiveIndex * 70 : Math.min(index * 35, 280);
    item.dataset.revealDelay = String(delay);
    item.style.transitionDelay = `${delay}ms`;
    revealObserver.observe(item);
  });
} else {
  showContent();
}

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

const debounce = (callback, wait = 160) => {
  let timer;

  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), wait);
  };
};

let headerTicking = false;
const scheduleHeaderUpdate = () => {
  markPageScrolling();

  if (headerTicking) {
    return;
  }

  headerTicking = true;
  requestAnimationFrame(() => {
    updateHeader();
    headerTicking = false;
  });
};

window.addEventListener("scroll", scheduleHeaderUpdate, { passive: true });
window.addEventListener("load", updateHeader);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", event => {
    const target = document.querySelector(anchor.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  });
});

const motionVideos = document.querySelectorAll(".motion-card video");

if (motionVideos.length && !prefersReducedMotion) {
  const motionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
          return;
        }

        video.pause();
      });
    },
    {
      rootMargin: "160px 0px",
      threshold: 0.2
    }
  );

  motionVideos.forEach(video => motionObserver.observe(video));
}

const closeMenu = () => {
  header.classList.remove("menu-open");
  document.body.classList.remove("menu-open");
  menuToggle.classList.remove("active");
  const navMenu = document.querySelector(".nav-links");
  navMenu?.classList.remove("open", "active", "is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
};

const sectionLinks = Array.from(navLinks).filter(link => link.hash);
const linkedSections = sectionLinks
  .map(link => document.querySelector(link.hash))
  .filter(Boolean);

const setActiveLink = id => {
  sectionLinks.forEach(link => {
    link.classList.toggle("is-active", link.hash === `#${id}`);
  });
};

if (linkedSections.length) {
  setActiveLink("home");

  const activeSectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    {
      threshold: 0.35,
      rootMargin: "-25% 0px -45% 0px"
    }
  );

  linkedSections.forEach(section => activeSectionObserver.observe(section));
}

const archiveGallery = document.querySelector(".archive-track");

if (archiveGallery) {
  const archivePrev = document.querySelector(".archive-arrow-prev");
  const archiveNext = document.querySelector(".archive-arrow-next");
  let isDraggingArchive = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let archiveScrollTimer;
  let archiveWheelDelta = 0;
  let archiveWheelFrame = null;
  let archiveDragFrame = null;
  let archiveDragLeft = 0;

  const getArchiveStep = () => {
    const card = archiveGallery.querySelector(".archive-card");
    if (!card) {
      return Math.min(320, archiveGallery.clientWidth);
    }

    const styles = window.getComputedStyle(archiveGallery);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || 0);
    return card.getBoundingClientRect().width + gap;
  };

  const updateArchiveArrows = () => {
    const maxScroll = archiveGallery.scrollWidth - archiveGallery.clientWidth;
    archivePrev?.classList.toggle("is-disabled", archiveGallery.scrollLeft <= 2);
    archiveNext?.classList.toggle("is-disabled", archiveGallery.scrollLeft >= maxScroll - 2);
  };

  const snapArchiveToNearest = () => {
    const step = getArchiveStep();
    const target = Math.round(archiveGallery.scrollLeft / step) * step;
    archiveGallery.scrollTo({
      left: target,
      behavior: "smooth"
    });
  };

  const scheduleArchiveSnap = () => {
    window.clearTimeout(archiveScrollTimer);
    archiveScrollTimer = window.setTimeout(snapArchiveToNearest, 180);
  };

  const scrollArchiveByCards = direction => {
    archiveGallery.scrollBy({
      left: direction * getArchiveStep(),
      behavior: "smooth"
    });
    window.setTimeout(updateArchiveArrows, 420);
  };

  archiveGallery.addEventListener("wheel", event => {
    event.preventDefault();
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    archiveWheelDelta += delta * 0.85;

    if (!archiveWheelFrame) {
      archiveWheelFrame = requestAnimationFrame(() => {
        archiveGallery.scrollBy({
          left: archiveWheelDelta,
          behavior: "auto"
        });
        archiveWheelDelta = 0;
        archiveWheelFrame = null;
      });
    }

    scheduleArchiveSnap();
  }, { passive: false });

  archiveGallery.addEventListener("pointerdown", event => {
    isDraggingArchive = true;
    dragStartX = event.clientX;
    dragStartScroll = archiveGallery.scrollLeft;
    archiveGallery.classList.add("is-dragging");
    archiveGallery.setPointerCapture(event.pointerId);
  });

  archiveGallery.addEventListener("pointermove", event => {
    if (!isDraggingArchive) {
      return;
    }

    const dragDistance = event.clientX - dragStartX;
    archiveDragLeft = dragStartScroll - dragDistance;

    if (!archiveDragFrame) {
      archiveDragFrame = requestAnimationFrame(() => {
        archiveGallery.scrollLeft = archiveDragLeft;
        archiveDragFrame = null;
      });
    }
  });

  const stopArchiveDrag = event => {
    if (!isDraggingArchive) {
      return;
    }

    isDraggingArchive = false;
    archiveGallery.classList.remove("is-dragging");
    snapArchiveToNearest();

    if (archiveGallery.hasPointerCapture(event.pointerId)) {
      archiveGallery.releasePointerCapture(event.pointerId);
    }
  };

  archiveGallery.addEventListener("pointerup", stopArchiveDrag);
  archiveGallery.addEventListener("pointercancel", stopArchiveDrag);
  archiveGallery.addEventListener("pointerleave", stopArchiveDrag);
  let archiveArrowTicking = false;
  const scheduleArchiveArrowUpdate = () => {
    if (archiveArrowTicking) {
      return;
    }

    archiveArrowTicking = true;
    requestAnimationFrame(() => {
      updateArchiveArrows();
      archiveArrowTicking = false;
    });
  };

  archiveGallery.addEventListener("scroll", scheduleArchiveArrowUpdate, { passive: true });
  archivePrev?.addEventListener("click", () => scrollArchiveByCards(-1));
  archiveNext?.addEventListener("click", () => scrollArchiveByCards(1));
  window.addEventListener("resize", debounce(updateArchiveArrows), { passive: true });
  updateArchiveArrows();
}

menuToggle.addEventListener("click", () => {
  if (window.innerWidth <= 768) {
    closeMenu();
    return;
  }

  const isOpen = header.classList.toggle("menu-open");
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.classList.toggle("active", isOpen);
  const navMenu = document.querySelector(".nav-links");
  navMenu?.classList.toggle("open", isOpen);
  navMenu?.classList.toggle("active", isOpen);
  navMenu?.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    if (link.hash) {
      setActiveLink(link.hash.slice(1));
    }

    closeMenu();
  });
});

window.addEventListener("resize", debounce(() => {
  if (window.innerWidth > 820 || window.innerWidth <= 768) {
    closeMenu();
  }
}), { passive: true });

if (window.innerWidth <= 768) {
  closeMenu();
}

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

if (finePointer) {
  const customCursor = document.querySelector(".custom-cursor");
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  const cursorGlow = document.querySelector(".cursor-glow");
  const cursorTargets = document.querySelectorAll("a, button, .btn, .menu-toggle, .project-card, .cyber-card, .service-card, .archive-card, .contact-card, .gurzil-logo-card, .gurzil-copy-card, .gurzil-image-card, .about-card, .about-skill-pills span, .motion-card, .lv-glow-card");

  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
  const dot = { x: mouse.x, y: mouse.y };
  const ring = { x: mouse.x, y: mouse.y };
  const glow = { x: mouse.x, y: mouse.y };
  const cursorPull = { x: 0, y: 0 };
  let ringScale = 1;
  let targetScale = 1;
  let activeTargetRect = null;
  let cursorFrame = null;
  let cursorActive = false;
  let lastCursorMove = performance.now();

  const lerp = (start, end, amount) => start + (end - start) * amount;

  const moveCursor = () => {
    if (document.body.classList.contains("is-scrolling")) {
      cursorActive = false;
      cursorFrame = null;
      return;
    }

    const targetX = mouse.x + cursorPull.x;
    const targetY = mouse.y + cursorPull.y;

    dot.x = lerp(dot.x, targetX, 0.28);
    dot.y = lerp(dot.y, targetY, 0.28);
    ring.x = lerp(ring.x, targetX, 0.12);
    ring.y = lerp(ring.y, targetY, 0.12);
    glow.x = lerp(glow.x, mouse.x, 0.1);
    glow.y = lerp(glow.y, mouse.y, 0.1);
    ringScale = lerp(ringScale, targetScale, 0.12);

    if (customCursor) {
      customCursor.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-8px, -8px)`;
    }

    if (cursorDot) {
      cursorDot.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%)`;
    }

    if (cursorRing) {
      cursorRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;
    }

    if (cursorGlow) {
      cursorGlow.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0) translate(-50%, -50%)`;
    }

    if (!document.body.classList.contains("cursor-hover") && performance.now() - lastCursorMove > 900) {
      cursorActive = false;
    }

    if (cursorActive) {
      cursorFrame = requestAnimationFrame(moveCursor);
    } else {
      cursorFrame = null;
    }
  };

  const startCursor = () => {
    if (cursorFrame) {
      return;
    }

    cursorActive = true;
    cursorFrame = requestAnimationFrame(moveCursor);
  };

  window.addEventListener("pointermove", event => {
    if (document.body.classList.contains("is-scrolling")) {
      cursorActive = false;
      return;
    }

    mouse.x = event.clientX;
    mouse.y = event.clientY;
    lastCursorMove = performance.now();
    document.body.classList.add("cursor-ready");
    startCursor();
  });

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("cursor-ready");
    cursorActive = false;
  });

  cursorTargets.forEach(item => {
    item.addEventListener("pointerenter", () => {
      document.body.classList.add("cursor-hover");
      activeTargetRect = item.getBoundingClientRect();
      targetScale = 1.08;
    });

    item.addEventListener("pointermove", event => {
      const rect = activeTargetRect || item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = event.clientX - centerX;
      const distanceY = event.clientY - centerY;
      const moveX = Math.max(Math.min(distanceX * 0.18, 10), -10);
      const moveY = Math.max(Math.min(distanceY * 0.18, 10), -10);

      item.style.setProperty("--magnet-x", `${moveX}px`);
      item.style.setProperty("--magnet-y", `${moveY}px`);
      cursorPull.x = (centerX - event.clientX) * 0.06;
      cursorPull.y = (centerY - event.clientY) * 0.06;
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--magnet-x", "0px");
      item.style.setProperty("--magnet-y", "0px");
      activeTargetRect = null;
      cursorPull.x = 0;
      cursorPull.y = 0;
      targetScale = 1;
      document.body.classList.remove("cursor-hover");
    });
  });
}
