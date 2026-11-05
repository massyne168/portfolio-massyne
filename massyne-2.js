(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const projects = Array.isArray(window.MASSYNE_PROJECTS) ? window.MASSYNE_PROJECTS : [];
  const workGrid = document.getElementById("work-grid");
  const workCount = document.getElementById("work-count");
  const workEmpty = document.getElementById("work-empty");
  const objectGrid = document.getElementById("object-grid");
  const archiveGrid = document.getElementById("archive-grid");

  document.body.classList.add("m2-js");
  document.documentElement.classList.add("m2-ready");

  const escapeHTML = value => String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const assetURL = value => "/" + String(value || "").replace(/^\/+/, "");
  const responsiveSrcSet = value => {
    const match = String(value || "").match(/^images\/optimized\/(work[1-4]|card(?:8|9|10|11|12))-1400\.webp$/);
    return match ? [480,800,1200,1400].map(width => "/images/optimized/" + match[1] + "-" + width + ".webp " + width + "w").join(", ") : "";
  };
  const objectPreview = value => String(value || "").replace(/^(images\/mockups\/.+)-full\.webp$/, "$1-600.webp");
  const slugURL = slug => "projects/" + encodeURIComponent(String(slug || "")) + ".html";
  const groupFor = project => {
    const descriptor = (String(project.category || "") + " " + String(project.slug || "")).toLowerCase();
    if (/mockup|t-shirt|tshirt|streetwear|flat.?lay|hoodie|product/.test(descriptor)) return "objects";
    if (/identity|brand|logo/.test(descriptor)) return "identity";
    return "image";
  };
  const number = value => String(value).padStart(2, "0");
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = String(value);
  };

  const workGroups = {all: projects.length, image: 0, identity: 0, objects: 0};
  projects.forEach(project => { workGroups[groupFor(project)] += 1; });
  setText("[data-count-all]", number(workGroups.all));
  setText("[data-count-image]", number(workGroups.image));
  setText("[data-count-identity]", number(workGroups.identity));
  setText("[data-count-objects]", number(workGroups.objects));
  document.querySelectorAll("[data-project-total]").forEach(node => { node.textContent = number(projects.length); });

  const projectCard = (project, index) => {
    const title = escapeHTML(project.title || "Untitled artwork");
    const category = escapeHTML(project.category || "Original work");
    const focus = escapeHTML(project.focus || "");
    const year = escapeHTML(project.year || "");
    const image = escapeHTML(assetURL(project.image));
    const srcset = responsiveSrcSet(project.image);
    const slug = escapeHTML(project.slug);
    const group = groupFor(project);
    const alt = escapeHTML(project.title || "Original MASSYNE artwork");
    const className = "project m2-project-card m2-project-" + group;
    return '<article class="' + className + '" data-case-study="' + slug + '" data-group="' + group + '" data-search="' +
      escapeHTML([project.title, project.category, project.focus, project.summary].join(" ").toLowerCase()) + '" data-reveal style="--card-order:' + (index % 6) + '">' +
      '<a class="m2-project-link" href="' + escapeHTML(slugURL(project.slug)) + '" data-cursor="VIEW" aria-label="Open project details for ' + title + '">' +
      '<span class="m2-project-art"><img src="' + image + '" ' + (srcset ? 'srcset="' + escapeHTML(srcset) + '" sizes="(max-width: 680px) 92vw, (max-width: 1100px) 50vw, 44vw" ' : '') + 'alt="' + alt + ' — original artwork by MASSYNE" loading="' + (index < 2 ? "eager" : "lazy") + '" decoding="async" ' + (index === 0 ? 'fetchpriority="high"' : '') + '><span class="m2-project-index">' + number(index + 1) + '</span><span class="m2-project-arrow" aria-hidden="true">↗</span></span>' +
      '<span class="m2-project-meta"><span>' + category + '</span><span>' + year + '</span></span>' +
      '<span class="m2-project-title">' + title + '</span>' +
      (focus ? '<span class="m2-project-focus">' + focus + '</span>' : '') +
      '</a></article>';
  };

  if (workGrid) {
    if (projects.length) {
      workGrid.innerHTML = projects.map(projectCard).join("");
    } else {
      workGrid.innerHTML = "";
      if (workEmpty) {
        workEmpty.hidden = false;
        workEmpty.textContent = "The project index could not load. Please refresh to see the original work.";
      }
    }
  }

  let activeWorkFilter = "all";
  const workSearch = document.getElementById("work-search");
  const workFilters = Array.from(document.querySelectorAll("[data-work-filter]"));
  const filterWork = () => {
    const query = String(workSearch && workSearch.value || "").trim().toLowerCase();
    const cards = Array.from(document.querySelectorAll(".m2-project-card"));
    let visible = 0;
    cards.forEach(card => {
      const groupMatch = activeWorkFilter === "all" || card.dataset.group === activeWorkFilter;
      const searchMatch = !query || (card.dataset.search || "").includes(query);
      const show = groupMatch && searchMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (workCount) workCount.textContent = number(visible) + " / " + number(projects.length) + " PROJECTS";
    if (workEmpty) workEmpty.hidden = visible > 0;
  };
  workFilters.forEach(button => {
    button.addEventListener("click", () => {
      activeWorkFilter = button.dataset.workFilter || "all";
      workFilters.forEach(item => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      filterWork();
    });
  });
  workSearch && workSearch.addEventListener("input", filterWork);
  filterWork();

  // Add future mockup image paths and truthful display names to this list.
  const gurzilApplications = [
    {title:"Backpack", image:"images/gurzil/mockups/backpack.webp"},
    {title:"Beanie", image:"images/gurzil/mockups/beanie.webp"},
    {title:"Bottle", image:"images/gurzil/mockups/bottle.webp"},
    {title:"Bracelet", image:"images/gurzil/mockups/bracelet.webp"},
    {title:"Cap", image:"images/gurzil/mockups/cap.webp"},
    {title:"Cards", image:"images/gurzil/mockups/cards.webp"},
    {title:"Hoodie", image:"images/gurzil/mockups/hoodie.webp"},
    {title:"Mug", image:"images/gurzil/mockups/mug.webp"},
    {title:"Phone case", image:"images/gurzil/mockups/phone-case.webp"},
    {title:"Sneakers", image:"images/gurzil/mockups/sneakers.webp"},
    {title:"Tote", image:"images/gurzil/mockups/tote.webp"},
    {title:"Watch", image:"images/gurzil/mockups/watch.webp"}
  ];
  const mockupProjects = projects.filter(project => groupFor(project) === "objects");
  const objectCards = mockupProjects.map((project, index) => {
    const title = escapeHTML(project.title || "Original object study");
    return '<a class="m2-object-card" href="' + escapeHTML(slugURL(project.slug)) + '" data-cursor="OPEN" data-reveal style="--card-order:' + (index % 5) + '">' +
      '<span class="m2-object-art"><img src="' + escapeHTML(assetURL(objectPreview(project.image))) + '" alt="' + title + ' — original MASSYNE mockup" loading="lazy" decoding="async"><span aria-hidden="true">↗</span></span>' +
      '<span class="m2-object-meta"><span>' + escapeHTML(project.category || "Object study") + '</span><span>' + escapeHTML(project.year || "") + '</span></span><strong>' + title + '</strong>' +
      '</a>';
  });
  gurzilApplications.forEach((item, index) => {
    const title = escapeHTML(item.title);
    objectCards.push('<a class="m2-object-card m2-object-application" href="projects/gurzil-team.html" data-cursor="OPEN" data-reveal style="--card-order:' + (index % 5) + '">' +
      '<span class="m2-object-art"><img src="' + escapeHTML(assetURL(item.image)) + '" alt="Gurzil Team ' + title.toLowerCase() + ' brand application" loading="lazy" decoding="async"><span aria-hidden="true">↗</span></span>' +
      '<span class="m2-object-meta"><span>GURZIL TEAM / APPLICATION</span><span>2026</span></span><strong>Gurzil / ' + title + '</strong>' +
      '</a>');
  });
  if (objectGrid) objectGrid.innerHTML = objectCards.join("");
  setText("#object-count", number(objectCards.length));

  const archiveItems = [
    {image:"images/posters/yediiklim.webp", alt:"Yediiklim — blue cultural association poster", group:"poster"},
    {image:"images/logos/exotic-roleplay.webp", alt:"EXOTIC Roleplay — gold and white geometric logo", group:"logo"},
    {image:"images/posters/exotic-roleplay.webp", alt:"EXOTIC Roleplay — navy and gold community banner", group:"poster"},
    {image:"images/archive1.webp", alt:"Poster study / 01", group:"poster"},
    {image:"images/archive2.webp", alt:"Poster study / 02", group:"poster"},
    {image:"images/archive3.webp", alt:"Poster study / 03", group:"poster"},
    {image:"images/archive4.webp", alt:"Poster study / 04", group:"poster"},
    {image:"images/archive5.webp", alt:"Poster study / 05", group:"poster"},
    {image:"images/archive6.webp", alt:"Identity study / 06", group:"identity"},
    {image:"images/archive7.webp", alt:"Identity study / 07", group:"identity"},
    {image:"images/archive8.webp", alt:"Poster study / 08", group:"poster"},
    {image:"images/archive9.webp", alt:"Poster study / 09", group:"poster"},
    {image:"images/archive14.webp", alt:"Identity study / 14", group:"identity"},
    {image:"images/archive15.webp", alt:"Poster study / 15", group:"poster"},
    {image:"images/archive16.webp", alt:"Visual experiment / 16", group:"experiment"},
    {image:"images/archive17.webp", alt:"Poster study / 17", group:"poster"},
    {image:"images/archive18.webp", alt:"Poster study / 18", group:"poster"},
    {image:"images/archive19.webp", alt:"Identity study / 19", group:"identity"},
    {image:"images/archive20.webp", alt:"Logo study / 20", group:"logo"},
    {image:"images/archive21.webp", alt:"Logo study / 21", group:"logo"},
    {image:"images/archive22.webp", alt:"Poster study / 22", group:"poster"},
    {image:"images/archive23.webp", alt:"Poster study / 23", group:"poster"},
    {image:"images/archive24.webp", alt:"Poster study / 24", group:"poster"},
    {image:"images/archive27.webp", alt:"Logo study / 27", group:"logo"},
    {image:"images/archive28.webp", alt:"Logo study / 28", group:"logo"},
    {image:"images/archive29.webp", alt:"Logo study / 29", group:"logo"}
  ];
  const archiveButtons = Array.from(document.querySelectorAll("[data-archive-filter]"));
  const archiveCount = document.getElementById("archive-count");
  const renderArchive = () => {
    if (!archiveGrid) return;
    archiveGrid.innerHTML = archiveItems.map((item, index) =>
      '<button class="m2-archive-card" type="button" data-archive-group="' + item.group + '" data-archive-index="' + index + '" data-reveal aria-label="Preview ' + escapeHTML(item.alt) + '">' +
      '<span class="m2-archive-image"><img src="' + escapeHTML(assetURL(item.image)) + '" alt="' + escapeHTML(item.alt) + '" loading="lazy" decoding="async"><i aria-hidden="true">↗</i></span>' +
      '<span class="m2-archive-caption"><span>' + escapeHTML(item.alt) + '</span><b>' + number(index + 1) + '</b></span></button>'
    ).join("");
    archiveItems.forEach(item => {
      const countNode = document.querySelector('[data-archive-count="' + item.group + '"]');
      if (countNode) countNode.dataset.countValue = String((Number(countNode.dataset.countValue) || 0) + 1);
    });
    const countAll = document.querySelector('[data-archive-count="all"]');
    if (countAll) countAll.textContent = number(archiveItems.length);
    ["poster","identity","logo","experiment"].forEach(group => {
      const count = archiveItems.filter(item => item.group === group).length;
      const node = document.querySelector('[data-archive-count="' + group + '"]');
      if (node) node.textContent = number(count);
    });
    filterArchive("all");
  };
  let activeArchiveFilter = "all";
  function filterArchive(group) {
    activeArchiveFilter = group || "all";
    let visible = 0;
    document.querySelectorAll(".m2-archive-card").forEach(card => {
      const show = activeArchiveFilter === "all" || card.dataset.archiveGroup === activeArchiveFilter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    archiveButtons.forEach(button => {
      const selected = (button.dataset.archiveFilter || "all") === activeArchiveFilter;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (archiveCount) archiveCount.textContent = number(visible) + " / " + number(archiveItems.length) + " ARCHIVE PIECES";
  }
  archiveButtons.forEach(button => button.addEventListener("click", () => filterArchive(button.dataset.archiveFilter)));
  renderArchive();

  const dialog = document.getElementById("archive-dialog");
  const dialogImage = document.getElementById("archive-image");
  const dialogCaption = document.getElementById("archive-caption");
  const dialogCounter = document.getElementById("archive-counter");
  let dialogIndex = 0;
  let dialogTrigger = null;
  const visibleArchive = () => archiveItems.map((item, index) => ({item, index}))
    .filter(record => activeArchiveFilter === "all" || record.item.group === activeArchiveFilter);
  const showArchiveImage = index => {
    const visible = visibleArchive();
    if (!visible.length || !dialog || !dialogImage) return;
    dialogIndex = (index + visible.length) % visible.length;
    const current = visible[dialogIndex];
    dialogImage.src = assetURL(current.item.image);
    dialogImage.alt = current.item.alt;
    if (dialogCaption) dialogCaption.textContent = current.item.alt;
    if (dialogCounter) dialogCounter.textContent = number(dialogIndex + 1) + " / " + number(visible.length);
  };
  archiveGrid && archiveGrid.addEventListener("click", event => {
    const button = event.target.closest(".m2-archive-card");
    if (!button || !dialog) return;
    dialogTrigger = button;
    const visible = visibleArchive();
    const index = visible.findIndex(record => record.index === Number(button.dataset.archiveIndex));
    showArchiveImage(Math.max(0, index));
    if (typeof dialog.showModal === "function") dialog.showModal();
  });
  document.getElementById("archive-close")?.addEventListener("click", () => dialog?.close());
  document.getElementById("archive-prev")?.addEventListener("click", () => showArchiveImage(dialogIndex - 1));
  document.getElementById("archive-next")?.addEventListener("click", () => showArchiveImage(dialogIndex + 1));
  dialog?.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener("close", () => { dialogTrigger?.focus(); dialogTrigger = null; });
  dialog?.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); showArchiveImage(dialogIndex - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showArchiveImage(dialogIndex + 1); }
  });

  const header = document.querySelector(".m2-header");
  const menuButton = document.querySelector(".m2-menu-button");
  const nav = document.querySelector(".m2-nav");
  const closeMenu = () => {
    if (!header || !menuButton) return;
    header.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".m2-menu-label").textContent = "MENU";
  };
  menuButton?.addEventListener("click", () => {
    const open = header.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector(".m2-menu-label").textContent = open ? "CLOSE" : "MENU";
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && header?.classList.contains("is-open")) {
      closeMenu();
      menuButton?.focus();
    }
  });
  document.addEventListener("click", event => {
    if (header?.classList.contains("is-open") && !header.contains(event.target)) closeMenu();
  });

  const navLinks = Array.from(document.querySelectorAll(".m2-nav a[href^='#']"));
  const sections = navLinks.map(link => ({link, section:document.querySelector(link.getAttribute("href"))})).filter(item => item.section);
  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sections.forEach(item => {
        if (item.section === visible.target) item.link.setAttribute("aria-current", "location");
        else item.link.removeAttribute("aria-current");
      });
    }, {rootMargin:"-22% 0px -62% 0px",threshold:[0,.1,.3,.6]});
    sections.forEach(item => sectionObserver.observe(item.section));
  }

  let scrollFrame = 0;
  const scrollMeter = document.getElementById("scroll-meter");
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    if (scrollMeter) scrollMeter.style.transform = "scaleX(" + progress + ")";
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
    scrollFrame = 0;
  };
  const requestScrollUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateScroll);
  };
  window.addEventListener("scroll", requestScrollUpdate, {passive:true});
  window.addEventListener("resize", requestScrollUpdate, {passive:true});
  updateScroll();

  let revealObserver = null;
  const watchReveals = root => {
    const nodes = Array.from((root || document).querySelectorAll("[data-reveal]")).filter(node => !node.classList.contains("is-revealed"));
    if (!nodes.length) return;
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      nodes.forEach(node => node.classList.add("is-revealed"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        });
      }, {threshold:.08,rootMargin:"0px 0px -28px 0px"});
    }
    nodes.forEach((node, index) => {
      node.style.setProperty("--reveal-delay", Math.min(index % 5, 4) * 55 + "ms");
      revealObserver.observe(node);
    });
  };
  watchReveals(document);

  if (finePointer.matches && !reduceMotion.matches) {
    const cursor = document.getElementById("m2-cursor");
    let pointerFrame = 0, pointerX = 0, pointerY = 0;
    window.addEventListener("pointermove", event => {
      if (event.pointerType === "touch" || !cursor) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        cursor.style.transform = "translate3d(" + pointerX + "px," + pointerY + "px,0)";
      });
    }, {passive:true});
    document.addEventListener("pointerover", event => {
      const target = event.target.closest("[data-cursor]");
      if (!target || !cursor) return;
      cursor.classList.add("is-visible");
      cursor.querySelector("span").textContent = target.dataset.cursor || "VIEW";
    });
    document.addEventListener("pointerout", event => {
      if (!cursor || event.relatedTarget?.closest("[data-cursor]")) return;
      cursor.classList.remove("is-visible");
    });
    document.querySelectorAll("[data-magnetic]").forEach(target => {
      target.addEventListener("pointermove", event => {
        if (event.pointerType === "touch") return;
        const box = target.getBoundingClientRect();
        const x = Math.max(-5, Math.min(5, (event.clientX - box.left - box.width / 2) * .06));
        const y = Math.max(-4, Math.min(4, (event.clientY - box.top - box.height / 2) * .07));
        target.style.setProperty("--mag-x", x.toFixed(1) + "px");
        target.style.setProperty("--mag-y", y.toFixed(1) + "px");
      }, {passive:true});
      target.addEventListener("pointerleave", () => {
        target.style.removeProperty("--mag-x");
        target.style.removeProperty("--mag-y");
      });
    });
    const objectStage = document.querySelector(".m2-object-stage");
    objectStage?.addEventListener("pointermove", event => {
      const rect = objectStage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      objectStage.style.setProperty("--stage-y", (x * 5).toFixed(2) + "deg");
      objectStage.style.setProperty("--stage-x", (y * -4).toFixed(2) + "deg");
    }, {passive:true});
    objectStage?.addEventListener("pointerleave", () => {
      objectStage.style.removeProperty("--stage-y");
      objectStage.style.removeProperty("--stage-x");
    });
  }

  const reelPlayer = document.getElementById("showreel-player");
  const reelShell = document.querySelector(".m2-showreel");
  if (reelPlayer && reelShell && "MutationObserver" in window) {
    const reelSourceObserver = new MutationObserver(() => reelShell.classList.toggle("has-source", Boolean(reelPlayer.getAttribute("src"))));
    reelSourceObserver.observe(reelPlayer, {attributes:true,attributeFilter:["src"]});
  }
  const motionVideos = Array.from(document.querySelectorAll(".m2-motion-card video"));
  motionVideos.forEach(video => video.addEventListener("play", () => {
    motionVideos.filter(other => other !== video).forEach(other => other.pause());
    const showreel = document.getElementById("showreel-player");
    if (showreel && !showreel.paused) showreel.pause();
  }));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) motionVideos.forEach(video => video.pause());
  });
})();