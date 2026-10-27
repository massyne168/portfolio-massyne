/* MASSYNE — semantic case study pages + source-grounded project data. */
(() => {
  "use strict";
  /* Lightweight exits to next/previous artwork or back to gallery. */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let leaving = false;
    document.addEventListener("click", event => {
      const link = event.target.closest?.("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
          link.target === "_blank" || link.hasAttribute("download") || leaving) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      const project = /^\\/projects\\/[^/]+\\.html$/.test(url.pathname);
      if (!project && !(url.pathname === "/" && url.hash === "#work")) return;
      event.preventDefault();
      leaving = true;
      document.documentElement.classList.add("project-is-leaving");
      window.setTimeout(() => window.location.assign(url.href), 180);
    }, true);
    window.addEventListener("pageshow", event => {
      if (event.persisted) { leaving = false; document.documentElement.classList.remove("project-is-leaving"); }
    });
  }
  const collection = Array.isArray(window.MASSYNE_PROJECTS) ? window.MASSYNE_PROJECTS : [];
  const params = new URLSearchParams(window.location.search);
  const slugFromPath = window.location.pathname.match(/\/projects\/([a-z0-9-]+)\.html$/)?.[1];
  const slug = slugFromPath || params.get("work");
  const project = collection.find(item => item.slug === slug);
  const find = id => document.getElementById(id);
  const set = (id, value) => {
    const element = find(id);
    if (element) element.textContent = value || "";
  };
  const projectHref = item => new URL("projects/" + encodeURIComponent(item.slug) + ".html", document.baseURI).href;

  // The same menu behaviour works for both the legacy query page and static project routes.
  const menu = document.querySelector(".menu");
  const nav = document.getElementById("nav");
  menu?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open") || false;
    menu.setAttribute("aria-expanded", String(open));
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menu?.setAttribute("aria-expanded", "false");
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      nav?.classList.remove("is-open");
      menu?.setAttribute("aria-expanded", "false");
    }
  });
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  }, {passive:true});

  if (!project) {
    set("case-title", "Project not found.");
    set("case-summary", "This project isn't in the current portfolio collection.");
    set("case-category", "Portfolio / Not found");
    document.title = "Project not found — MASSYNE";
    [".case-hero-visual",".case-details",".case-story",".case-design",".case-mockup",".case-visuals",".case-next"]
      .forEach(selector => document.querySelector(selector)?.remove());
    return;
  }
  const index = collection.indexOf(project);
  const previous = collection[(index - 1 + collection.length) % collection.length];
  const next = collection[(index + 1) % collection.length];
  const number = project.number || String(index + 1).padStart(2, "0");

  document.title = project.title + " — MASSYNE | Selected Work";
  document.querySelector('meta[name="description"]')?.setAttribute("content", project.summary);
  set("case-number", number);
  set("case-detail-number", number);
  set("case-category", project.category + " / " + project.year);
  set("case-title", project.title);
  set("case-summary", project.summary);
  set("case-year", project.year);
  set("case-fact-project", project.title);
  set("case-fact-category", project.category);
  set("case-fact-year", project.year);
  set("case-fact-focus", project.focus);
  set("case-concept", project.concept);
  set("case-direction", project.direction);

  const artwork = find("case-artwork");
  if (artwork) {
    artwork.src = project.image;
    artwork.alt = project.title + " — original artwork by MASSYNE";
  }
  document.querySelectorAll("[data-mockup-art]").forEach(image => {
    image.src = project.image;
    image.alt = ""; // Decorative presentation of the already captioned original artwork.
  });
  const cropped = find("case-detail-art");
  if (cropped) {
    cropped.src = project.image;
    cropped.alt = "Closer crop from " + project.title + ", original artwork";
  }

  // Editorial in-context presentation of the supplied artwork, not a fabricated product photograph.
  const storySection = document.querySelector(".case-story");
  if (storySection && project.image && !document.querySelector(".case-presentation")) {
    const section = document.createElement("section");
    section.className = "case-presentation";
    section.setAttribute("aria-label", "Artwork presentation");
    const heading = document.createElement("div");
    heading.className = "case-presentation-heading";
    const kicker = document.createElement("span");
    kicker.textContent = "ARTWORK / PRESENTATION";
    const title = document.createElement("h2");
    title.textContent = "Made to be seen.";
    const note = document.createElement("p");
    note.textContent = "A gallery-wall visualization of the original artwork.";
    heading.append(kicker, title, note);
    const scene = document.createElement("figure");
    scene.className = "case-presentation-scene";
    const frame = document.createElement("div");
    frame.className = "case-presentation-frame";
    const image = document.createElement("img");
    image.src = project.image;
    image.alt = project.title + " — original artwork presented in a digital gallery frame";
    image.loading = "lazy";
    image.decoding = "async";
    frame.append(image);
    const caption = document.createElement("figcaption");
    caption.textContent = "DIGITAL PRESENTATION / ORIGINAL ARTWORK";
    scene.append(frame, caption);
    section.append(heading, scene);
    storySection.before(section);
  }

  const insights = find("case-insights");
  if (insights) {
    insights.replaceChildren();
    (project.details || []).forEach((detail, i) => {
      const article = document.createElement("article");
      article.className = "case-insight";
      const numberLabel = document.createElement("span");
      numberLabel.textContent = String(i + 1).padStart(2, "0");
      const content = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = detail.title;
      const description = document.createElement("p");
      description.textContent = detail.description;
      content.append(title, description);
      article.append(numberLabel,content);
      insights.append(article);
    });
  }

  const gal = find("case-gallery");
  const gallery = Array.isArray(project.gallery) ? project.gallery : [project.image];
  if (gal) {
    gal.replaceChildren();
    gallery.forEach((src, i) => {
      const figure = document.createElement("figure");
      figure.className = "case-gallery-piece";
      const image = document.createElement("img");
      image.src = src;
      image.alt = project.title + (gallery.length > 1 ? " — original artwork " + (i + 1) : " — full composition");
      image.loading = "lazy";
      image.decoding = "async";
      const caption = document.createElement("figcaption");
      caption.textContent = gallery.length > 1
        ? "Artwork " + String(i + 1).padStart(2, "0") + " / " + String(gallery.length).padStart(2, "0")
        : "Original artwork / Full composition";
      figure.append(image,caption);
      gal.append(figure);
    });
  }
  set("case-prev-title", previous.title);
  set("case-next-title", next.title);
  find("case-prev-link")?.setAttribute("href", projectHref(previous));
  find("case-next-link")?.setAttribute("href", projectHref(next));
  // Preserve the 3.45s loader on F5 while allowing seamless intentional project-to-project transitions.
  ["case-prev-link","case-next-link"].forEach(id => {
    find(id)?.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      try { window.sessionStorage.setItem("massyne:skip-intro-once","yes"); } catch (_) {}
    });
  });

  // The full artwork viewer is a native accessible dialog, not another page load.
  const dialog = document.querySelector(".case-fullscreen");
  const dialogImage = dialog?.querySelector("img");
  const closeButton = dialog?.querySelector("button");
  find("case-zoom")?.addEventListener("click", () => {
    if (!dialog || !dialogImage || !artwork || typeof dialog.showModal !== "function") return;
    dialogImage.src = artwork.src;
    dialogImage.alt = artwork.alt;
    dialog.showModal();
    closeButton?.focus();
  });
  closeButton?.addEventListener("click", () => dialog?.close());
  dialog?.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
})();


/* Premium reading navigation + cinematic multi-work artwork viewer.
   Progressive enhancement only; static HTML and existing case-study content remain intact. */
(() => {
  "use strict";
  const collection = Array.isArray(window.MASSYNE_PROJECTS) ? window.MASSYNE_PROJECTS : [];
  const slug = location.pathname.match(/\/projects\/([a-z0-9-]+)\.html$/)?.[1] ||
    new URLSearchParams(location.search).get("work");
  const project = collection.find(item => item.slug === slug);
  if (!project) return;

  // Editorial chapter index: follows the real existing sections without replacing their text.
  const intro = document.querySelector(".case-intro");
  const landmarks = [
    [".case-hero-visual","01","The artwork"],
    [".case-story","02","The concept"],
    [".case-design","03","The anatomy"],
    [".case-visuals","04","The gallery"]
  ].map(([selector,num,label]) => ({element:document.querySelector(selector),num,label}))
   .filter(item=>item.element);
  if (intro && landmarks.length) {
    const nav = document.createElement("nav");
    nav.className = "case-chapters";
    nav.setAttribute("aria-label","Jump between creative project chapters");
    const list = document.createElement("div");
    list.className = "case-chapter-list";
    const links = [];
    landmarks.forEach(({element,num,label}) => {
      element.id = element.id || "chapter-" + num;
      const link = document.createElement("a");
      link.href = location.pathname + location.search + "#" + element.id;
      link.className = "case-chapter-link";
      const n = document.createElement("span");
      n.textContent = num;
      const name = document.createElement("strong");
      name.textContent = label;
      link.append(n,name);
      list.append(link);
      links.push(link);
    });
    const caption = document.createElement("p");
    caption.className = "case-chapter-caption";
    caption.textContent = "EXPLORE THE BREAKDOWN / " + (project.focus || project.category);
    nav.append(caption,list);
    intro.after(nav);

    const activate = idx => links.forEach((link,i) => {
      if (i === idx) link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    });
    activate(0);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry=>entry.isIntersecting)
          .sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
        if (visible[0]) activate(landmarks.findIndex(item=>item.element===visible[0].target));
      }, {rootMargin:"-18% 0px -55% 0px",threshold:0});
      landmarks.forEach(({element})=>observer.observe(element));
    }
  }

  // Creative DNA is sourced only from editorial fields authored for each real work.
  const notes = (project.details || []).slice(0,3);
  const story = document.querySelector(".case-story");
  if (story && notes.length) {
    const section = document.createElement("section");
    section.className = "case-dna";
    section.setAttribute("aria-label","Project creative DNA");
    const heading = document.createElement("div");
    heading.className = "case-dna-heading";
    const kicker = document.createElement("p");
    kicker.className = "eyebrow";
    kicker.textContent = "CREATIVE INDEX / " + (project.number || "00");
    const h2 = document.createElement("h2");
    h2.textContent = "Three visual decisions.";
    const description = document.createElement("p");
    description.textContent = "A concise map of the creative thinking behind this original piece.";
    heading.append(kicker,h2,description);
    const grid = document.createElement("div");
    grid.className = "case-dna-grid";
    notes.forEach((note,i) => {
      const card = document.createElement("article");
      card.className = "case-dna-card";
      const count = document.createElement("span");
      count.textContent = String(i+1).padStart(2,"0") + " / VISUAL NOTE";
      const title = document.createElement("h3");
      title.textContent = note.title;
      const copy = document.createElement("p");
      copy.textContent = note.description;
      card.append(count,title,copy);
      grid.append(card);
    });
    section.append(heading,grid);
    story.after(section);
  }

  // Upgrade existing native <dialog>; moving its existing image keeps legacy zoom
  // handling, Escape, focus restoration and basic-browser fallback working.
  const dialog = document.querySelector(".case-fullscreen");
  const image = dialog?.querySelector("img");
  const oldCaption = dialog?.querySelector("p");
  const close = dialog?.querySelector(".case-fullscreen-close");
  if (!dialog || !image || !close || typeof dialog.showModal !== "function") return;

  dialog.classList.add("case-immersive");
  dialog.setAttribute("aria-label","Immersive portfolio artwork viewer");
  const frame = document.createElement("div");
  frame.className = "case-viewer-frame";
  image.before(frame);
  frame.append(image);

  const bar = document.createElement("div");
  bar.className = "case-viewer-bar";
  const info = document.createElement("div");
  info.className = "case-viewer-info";
  const counter = document.createElement("span");
  counter.className = "case-viewer-counter";
  counter.setAttribute("aria-live","polite");
  const title = document.createElement("strong");
  title.className = "case-viewer-title";
  info.append(counter,title);

  const controls = document.createElement("div");
  controls.className = "case-viewer-controls";
  const makeButton = (label,text) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "case-viewer-control";
    button.setAttribute("aria-label",label);
    button.textContent = text;
    return button;
  };
  const prev = makeButton("Previous artwork","←");
  const next = makeButton("Next artwork","→");
  const zoom = makeButton("Zoom artwork","＋");
  zoom.setAttribute("aria-pressed","false");
  const detail = document.createElement("a");
  detail.className = "case-viewer-detail";
  detail.textContent = "EXPLORE THIS PROJECT ↗";
  controls.append(prev,next,zoom,detail);
  bar.append(info,controls);
  frame.after(bar);
  if (oldCaption) oldCaption.hidden = true;
  close.textContent = "CLOSE ×";

  // Load just one artwork at a time; no eager 20-image fetch.
  const gallery = Array.isArray(project.gallery) && project.gallery.length ? project.gallery : [project.image];
  const items = [];
  const seen = new Set();
  const add = (item,source) => {
    if (!source) return;
    const key = new URL(source, document.baseURI).href;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({src:key,title:item.title,slug:item.slug});
  };
  gallery.forEach(src=>add(project,src));
  if (!gallery.includes(project.image)) add(project,project.image);
  const projectIndex = collection.indexOf(project);
  for (let step=1;step<collection.length;step++) {
    const item = collection[(projectIndex+step)%collection.length];
    add(item,item.image);
  }
  let current = 0;
  let pointerX = null;
  const show = idx => {
    if (!items.length) return;
    current = (idx+items.length)%items.length;
    const item = items[current];
    image.classList.remove("is-zoomed");
    zoom.setAttribute("aria-pressed","false");
    zoom.textContent = "＋";
    image.src = item.src;
    image.alt = item.title + " — original artwork by MASSYNE";
    title.textContent = item.title;
    counter.textContent = String(current+1).padStart(2,"0") + " / " +
      String(items.length).padStart(2,"0") + " — SELECTED WORKS";
    detail.hidden = item.slug === project.slug;
    detail.href = new URL("projects/" + encodeURIComponent(item.slug) + ".html",document.baseURI).href;
  };
  const open = idx => {
    show(idx);
    if (!dialog.open) dialog.showModal();
    close.focus();
  };

  // The existing zoom button's listener opens the same dialog first.
  // Ensure the enhanced counter and links are initialized after that handler.
  document.getElementById("case-zoom")?.addEventListener("click",()=>show(0));
  const galleryNodes = [...document.querySelectorAll("#case-gallery .case-gallery-piece")];
  galleryNodes.forEach((figure,i)=>{
    const button = document.createElement("button");
    button.type = "button";
    button.className = "case-gallery-open";
    button.textContent = "VIEW IMMERSIVE ↗";
    button.setAttribute("aria-label","Open full artwork " + (i+1) + " in viewer");
    figure.append(button);
    button.addEventListener("click",()=>open(Math.min(i,Math.max(0,gallery.length-1))));
  });
  prev.addEventListener("click",()=>show(current-1));
  next.addEventListener("click",()=>show(current+1));
  zoom.addEventListener("click",()=>{
    const active = image.classList.toggle("is-zoomed");
    zoom.setAttribute("aria-pressed",String(active));
    zoom.textContent = active ? "－" : "＋";
  });
  dialog.addEventListener("keydown",event=>{
    if (!dialog.open || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); show(current-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); show(current+1); }
  });
  frame.addEventListener("pointerdown",event=>{
    if(event.pointerType!=="touch")return;
    pointerX=event.clientX;
  },{passive:true});
  frame.addEventListener("pointerup",event=>{
    if(pointerX===null || event.pointerType!=="touch")return;
    const delta=event.clientX-pointerX;
    pointerX=null;
    if(image.classList.contains("is-zoomed"))return;
    if(Math.abs(delta)>55)show(current+(delta<0?1:-1));
  },{passive:true});
  dialog.addEventListener("close",()=>{
    image.classList.remove("is-zoomed");
    pointerX=null;
  });
})();
