(() => {
  "use strict";
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const nav = document.querySelector("#nav");
  const menu = document.querySelector(".menu");
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  // Derive the editorial count from the actual gallery so reorganizing
  // projects cannot leave an outdated "08 PROJECTS" label behind.
  const countLabel = document.querySelector(".project-count-label");
  const curatedCards = document.querySelectorAll(".project-grid > .project");
  if (countLabel) {
    countLabel.textContent = "CURATED WORKS — " + String(curatedCards.length).padStart(2, "0") + " PROJECTS";
  }


  const closeMenu = () => {
    if (!nav || !menu) return;
    nav.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
  };
  menu?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("is-open") ?? false;
    menu.setAttribute("aria-expanded", String(isOpen));
  });
  nav?.querySelectorAll("a").forEach(anchor =>
    anchor.addEventListener("click", closeMenu)
  );
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", event => {
    if (header && !header.contains(event.target)) closeMenu();
  });

  // Native scrolling with a very lightweight, non-invasive progress indicator.
  let scrollFrame = 0;
  const updateScroll = () => {
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.min(1, Math.max(0, window.scrollY / scrollRange));
    progress?.style.setProperty("--scroll-progress", value);
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
    scrollFrame = 0;
  };
  const requestScrollUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScroll);
  };
  window.addEventListener("scroll", requestScrollUpdate, { passive:true });
  window.addEventListener("resize", requestScrollUpdate, { passive:true });
  updateScroll();

  // Keep all archive assets, while letting visitors switch categories.
  const archiveItems = Array.from(document.querySelectorAll(".archive-item"));
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  filterButtons.forEach(button => button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    archiveItems.forEach(item => {
      const categories = (item.dataset.category || "").split(/\s+/);
      const visible = filter === "all" || categories.includes(filter);
      item.classList.toggle("is-hidden", !visible);
      item.toggleAttribute("hidden", !visible);
    });
  }));
  filterButtons.forEach(button =>
    button.setAttribute("aria-pressed", String(button.classList.contains("active")))
  );

  // Native accessible image preview. Arrow keys stay within the originating gallery.
  const dialog = document.querySelector(".lightbox");
  const previewImage = dialog?.querySelector("img");
  const previewLabel = dialog?.querySelector("p");
  const closePreview = dialog?.querySelector("button");
  let previewItems = [];
  let previewIndex = -1;
  let previewTrigger = null;
  const imageOpeners = Array.from(document.querySelectorAll(".image-open"));
  const showPreview = index => {
    const item = previewItems[index];
    const image = item?.querySelector("img");
    if (!image || !dialog || !previewImage) return;
    previewIndex = index;
    previewImage.src = image.currentSrc || image.src;
    previewImage.alt = image.alt;
    if (previewLabel) previewLabel.textContent = image.alt + " — " + (index + 1) + " of " + previewItems.length;
    if (!dialog.open) {
      dialog.showModal();
      closePreview?.focus();
    }
  };
  imageOpeners.forEach(item => {
    const open = () => {
      const gallery = item.closest(".project-grid, .identity-gallery, .self-brand, .archive-grid") || item.parentElement;
      previewItems = Array.from(gallery?.querySelectorAll(".image-open") || [item]);
      previewTrigger = item;
      showPreview(Math.max(0, previewItems.indexOf(item)));
    };
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    if (!item.hasAttribute("aria-label")) item.setAttribute("aria-label", "Preview " + (item.querySelector("img")?.alt || "artwork"));
    item.addEventListener("click", open);
    item.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
  closePreview?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener("keydown", event => {
    if (previewItems.length < 2) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault(); showPreview((previewIndex + 1) % previewItems.length);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault(); showPreview((previewIndex - 1 + previewItems.length) % previewItems.length);
    }
  });
  dialog?.addEventListener("close", () => {
    previewTrigger?.focus();
    previewItems = []; previewIndex = -1; previewTrigger = null;
  });

  // Switch between a curated visual gallery and a compact project index.
  const projectGrid = document.querySelector(".project-grid");
  const viewButtons = [...document.querySelectorAll(".view-switch button[data-view]")];
  viewButtons.forEach(button => button.addEventListener("click", () => {
    if (!projectGrid) return;
    const nextView = button.dataset.view;
    if (nextView !== "grid" && nextView !== "index") return;
    if (projectGrid.dataset.view === nextView) return;
    projectGrid.dataset.view = nextView;
    viewButtons.forEach(item => {
      item.setAttribute("aria-pressed", String(item.dataset.view === nextView));
    });
    if (!motionQuery.matches && typeof Element.prototype.animate === "function") {
      projectGrid.querySelectorAll(".project").forEach((card, index) => {
        card.animate([
          { opacity: .55, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 260 + Math.min(index, 7) * 30, easing: "cubic-bezier(.2,.7,.2,1)" });
      });
    }
  }));

  // Opt-in section reveals: hidden state is added only when observation is supported.
  const targets = [...document.querySelectorAll(".section-head, .identity-top, .about > div, .contact > h2")];
  let revealObserver;
  const resetReveals = () => {
    revealObserver?.disconnect();
    targets.forEach(el => el.classList.remove("reveal-pending"));
    targets.forEach(el => el.classList.add("reveal-visible"));
  };
  const setupReveals = () => {
    if (motionQuery.matches || !("IntersectionObserver" in window)) {
      resetReveals();
      return;
    }
    revealObserver?.disconnect();
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("reveal-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: "0px 0px 40px 0px" });
    targets.forEach(el => {
      el.classList.remove("reveal-visible");
      el.classList.add("reveal-pending");
      revealObserver.observe(el);
    });
  };
  setupReveals();
  motionQuery.addEventListener?.("change", event => {
    if (event.matches) resetReveals();
    else setupReveals();
  });
})();