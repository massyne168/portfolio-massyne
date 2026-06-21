const header = document.querySelector("#siteHeader");
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(
  ".section-reveal, .project-card, .service-card, .archive-card, .contact-card, .gurzil-logo-card, .gurzil-copy-card, .gurzil-image-card, .about-card, .about-skill-pills span, .motion-card"
);
const revealDuration = 800;
const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;

const pageLoader = document.querySelector("#pageLoader");
const loaderPercent = document.querySelector("#loaderPercent");
const loaderStatus = document.querySelector("#loaderStatus");

if (pageLoader && loaderPercent) {
  const loaderDuration = 900;
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

    document.body.classList.remove("is-loading");
    pageLoader.classList.add("loaded");
    window.setTimeout(() => {
      pageLoader.remove();
    }, 700);
  };

  requestAnimationFrame(updateLoader);
}

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

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

window.addEventListener("scroll", updateHeader);
window.addEventListener("load", updateHeader);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", event => {
    const target = document.querySelector(anchor.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

const closeMenu = () => {
  header.classList.remove("menu-open");
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
    archiveGallery.scrollBy({
      left: delta * 0.85,
      behavior: "smooth"
    });
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
    archiveGallery.scrollLeft = dragStartScroll - dragDistance;
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
  archiveGallery.addEventListener("scroll", updateArchiveArrows, { passive: true });
  archivePrev?.addEventListener("click", () => scrollArchiveByCards(-1));
  archiveNext?.addEventListener("click", () => scrollArchiveByCards(1));
  window.addEventListener("resize", updateArchiveArrows);
  updateArchiveArrows();
}

menuToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("menu-open");
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

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) {
    closeMenu();
  }
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

if (finePointer) {
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  const cursorGlow = document.querySelector(".cursor-glow");
  const cursorTargets = document.querySelectorAll("a, button, .btn, .menu-toggle, .project-card, .service-card, .archive-card, .contact-card, .gurzil-logo-card, .gurzil-copy-card, .gurzil-image-card, .about-card, .about-skill-pills span, .motion-card");

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

  const lerp = (start, end, amount) => start + (end - start) * amount;

  const moveCursor = () => {
    const targetX = mouse.x + cursorPull.x;
    const targetY = mouse.y + cursorPull.y;

    dot.x = lerp(dot.x, targetX, 0.28);
    dot.y = lerp(dot.y, targetY, 0.28);
    ring.x = lerp(ring.x, targetX, 0.12);
    ring.y = lerp(ring.y, targetY, 0.12);
    glow.x = lerp(glow.x, mouse.x, 0.1);
    glow.y = lerp(glow.y, mouse.y, 0.1);
    ringScale = lerp(ringScale, targetScale, 0.12);

    cursorDot.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;
    cursorGlow.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(moveCursor);
  };

  window.addEventListener("pointermove", event => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    document.body.classList.add("cursor-ready");
  });

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("cursor-ready");
  });

  cursorTargets.forEach(item => {
    item.addEventListener("pointerenter", () => {
      document.body.classList.add("cursor-hover");
      targetScale = 1.08;
    });

    item.addEventListener("pointermove", event => {
      const rect = item.getBoundingClientRect();
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
      cursorPull.x = 0;
      cursorPull.y = 0;
      targetScale = 1;
      document.body.classList.remove("cursor-hover");
    });
  });

  requestAnimationFrame(moveCursor);
}
