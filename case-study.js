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
      const project = /^\/projects\/[^/]+\.html$/.test(url.pathname);
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

  // Related projects: source-grounded recommendations from the existing portfolio dataset.
  // No external request, stock imagery, invented client credits or fake case studies.
  const relatedBefore=document.querySelector(".case-next");
  const commonWords=new Set(["poster","visual","study","design","artwork","graphic","creative","original","independent","the","and","art","with","composition","direction"]);
  const tokens=value=>new Set(String(value||"").toLowerCase().split(/[^a-z0-9]+/).filter(word=>word.length>=4&&!commonWords.has(word)));
  const intersection=(one,two)=>{
    let hits=0;
    for(const word of one)if(two.has(word))hits++;
    return hits;
  };
  if(relatedBefore && collection.length>1 && !document.querySelector(".case-related")){
    const sourceCategory=tokens(project.category);
    const sourceFocus=tokens(project.focus);
    const scored=collection.filter(item=>item.slug!==project.slug&&item.image&&item.title).map((item,position)=>{
      const cat=tokens(item.category),focus=tokens(item.focus);
      let score=0;
      if(item.category===project.category)score+=10;
      score+=intersection(sourceCategory,cat)*4;
      score+=intersection(sourceFocus,focus)*3;
      score+=intersection(sourceCategory,focus)*2;
      score+=intersection(sourceFocus,cat)*2;
      return {item,score,position};
    });
    scored.sort((a,b)=>b.score-a.score||a.position-b.position);
    const related=scored.slice(0,3).map(entry=>entry.item);
    if(related.length){
      const thumbs={
        "ghost-protocol":"images/optimized/work1-480.webp",
        "the-cursed-crown":"images/optimized/work3-480.webp",
        "ashes-of-innocence":"images/optimized/work2-480.webp",
        "the-queen":"images/optimized/work4-480.webp",
        "the-final-fall":"images/optimized/card8-480.webp",
        "legends":"images/optimized/card10-480.webp",
        "nyctophile":"images/optimized/card11-480.webp",
        "warriors-break":"images/optimized/card12-480.webp",
        "veiled-sorrow-surreal":"images/optimized/card9-480.webp",
        "glory":"images/curated/glory-420.webp",
        "envy":"images/curated/envy-420.webp",
        "the-last-oath":"images/curated/the-last-oath-420.webp",
        "nocturne-red-sun":"images/curated/nocturne-red-sun-420.webp",
        "nocturne-dark-veil":"images/curated/nocturne-dark-veil-420.webp"
      };
      const section=document.createElement("section");
      section.className="case-related";
      section.setAttribute("aria-labelledby","case-related-title");
      const heading=document.createElement("div");
      heading.className="case-related-head";
      const kicker=document.createElement("p");
      kicker.className="eyebrow";
      kicker.textContent="MORE TO EXPLORE / MASSYNE";
      const title=document.createElement("h2");
      title.id="case-related-title";
      title.textContent="Explore related projects.";
      const intro=document.createElement("p");
      intro.textContent="More original artwork connected by mood, direction or visual language.";
      heading.append(kicker,title,intro);
      const gallery=document.createElement("div");
      gallery.className="case-related-grid";
      related.forEach((item,i)=>{
        const link=document.createElement("a");
        link.href=projectHref(item);
        link.className="case-related-card";
        link.setAttribute("aria-label","Explore "+item.title+" case study");
        const media=document.createElement("span");
        media.className="case-related-art";
        const image=document.createElement("img");
        image.src=thumbs[item.slug]||item.image;
        image.alt=item.title+" — original artwork by MASSYNE";
        image.loading="lazy";
        image.decoding="async";
        image.setAttribute("fetchpriority","low");
        media.append(image);
        const line=document.createElement("span");
        line.className="case-related-info";
        const copy=document.createElement("span");
        const num=document.createElement("small");
        num.textContent=String(i+1).padStart(2,"0")+" / "+item.category;
        const name=document.createElement("strong");
        name.textContent=item.title;
        const arrow=document.createElement("span");
        arrow.className="case-related-arrow";
        arrow.textContent="↗";
        arrow.setAttribute("aria-hidden","true");
        copy.append(num,name);
        line.append(copy,arrow);
        link.append(media,line);
        link.addEventListener("click",event=>{
          if(event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
          try{window.sessionStorage.setItem("massyne:skip-intro-once","yes");}catch(_){}
        });
        gallery.append(link);
      });
      section.append(heading,gallery);
      relatedBefore.before(section);
    }
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
