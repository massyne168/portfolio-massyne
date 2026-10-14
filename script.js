(() => {
  "use strict";
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const nav = document.querySelector("#nav");
  const menu = document.querySelector(".menu");
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");

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

  // Native accessible image preview, including pointer and keyboard activation.
  const dialog = document.querySelector(".lightbox");
  const previewImage = dialog?.querySelector("img");
  const previewLabel = dialog?.querySelector("p");
  document.querySelectorAll(".image-open").forEach(item => {
    const open = () => {
      const image = item.querySelector("img");
      if (!image || !dialog || !previewImage) return;
      previewImage.src = image.currentSrc || image.src;
      previewImage.alt = image.alt;
      if (previewLabel) previewLabel.textContent = image.alt;
      if (!dialog.open) dialog.showModal();
    };
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    if (!item.hasAttribute("aria-label")) {
      item.setAttribute("aria-label", "Preview " + (item.querySelector("img")?.alt || "artwork"));
    }
    item.addEventListener("click", open);
    item.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
  dialog?.querySelector("button")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

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