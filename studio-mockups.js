/* MASSYNE MOCKUP STUDIO / One real original print, three concept mediums.
   Existing Curated Works remain the single source of projects and image URLs. */
(() => {
  "use strict";
  const workspace = document.getElementById("mockup-studio");
  if (!workspace) return;
  const selector = document.getElementById("pm-project");
  const title = document.getElementById("pm-current-title");
  const category = document.getElementById("pm-current-category");
  const caseLink = document.getElementById("pm-project-link");
  const modeLabel = document.getElementById("pm-medium-label");
  const countLabel = document.getElementById("pm-work-count");
  const modes = Array.from(workspace.querySelectorAll("[data-pm-mode]"));
  const pickers = Array.from(document.querySelectorAll("[data-pick-project]"));
  const displayImages = Array.from(workspace.querySelectorAll(".pm-original-image"));
  if (!selector || !displayImages.length) return;

  const cardData = Array.from(document.querySelectorAll(".project-grid > .project[data-case-study]"))
    .map(card => {
      const image = card.querySelector("img");
      const label = card.querySelector("h3");
      if (!image || !label) return null;
      return {
        slug: card.dataset.caseStudy,
        title: label.textContent.trim(),
        image: image.getAttribute("src"),
        category: card.querySelector("div > span")?.textContent?.replace(/^\d+\s*\/\s*/, "") || "Original artwork"
      };
    }).filter(Boolean);
  if (!cardData.length) return;

  const items = new Map(cardData.map(p => [p.slug, p]));
  const newArt = new Set(["glory","nocturne-red-sun","envy","nocturne-dark-veil","the-last-oath"]);
  const ordered = [...cardData.filter(p => newArt.has(p.slug)), ...cardData.filter(p => !newArt.has(p.slug))];
  const newGroup = document.createElement("optgroup");
  newGroup.label = "NEW / 2026 — FIVE NEW ARTWORKS";
  const otherGroup = document.createElement("optgroup");
  otherGroup.label = "THE CURATED COLLECTION";
  ordered.forEach(p => {
    const option = document.createElement("option");
    option.value = p.slug;
    option.textContent = p.title;
    (newArt.has(p.slug) ? newGroup : otherGroup).append(option);
  });
  selector.replaceChildren(newGroup,otherGroup);
  if (countLabel) countLabel.textContent = cardData.length + " ORIGINAL WORKS";

  const updateArtwork = slug => {
    const item = items.get(slug) || ordered[0];
    if (!item) return;
    selector.value = item.slug;
    if (title) title.textContent = item.title;
    if (category) category.textContent = item.category;
    if (caseLink) {
      caseLink.href = "projects/" + encodeURIComponent(item.slug) + ".html";
      caseLink.setAttribute("aria-label","Open " + item.title + " case study");
    }
    // Preserve the untouched original typography and content inside the artwork.
    displayImages.forEach(image => {
      if (image.getAttribute("src") !== item.image) image.setAttribute("src",item.image);
    });
    pickers.forEach(button => {
      const selected = button.dataset.pickProject === item.slug;
      button.classList.toggle("is-selected",selected);
      button.setAttribute("aria-pressed",String(selected));
    });
    const stage = workspace.querySelector(".pm-stage");
    stage?.setAttribute("aria-label", item.title + " in a " +
      ({hoodie:"black hoodie",tee:"premium T-shirt",frame:"glass picture frame"})[workspace.dataset.mode]);
  };
  const mediumLabels = {
    hoodie:"BLACK OVERSIZED HOODIE",
    tee:"OFF-WHITE PREMIUM T-SHIRT",
    frame:"GALLERY GLASS FRAME"
  };
  const setMedium = mode => {
    if (!Object.hasOwn(mediumLabels,mode)) return;
    workspace.dataset.mode = mode;
    modes.forEach(button => {
      const active = button.dataset.pmMode === mode;
      button.classList.toggle("is-active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    if (modeLabel) modeLabel.textContent = mediumLabels[mode];
    updateArtwork(selector.value);
  };
  selector.addEventListener("change", () => updateArtwork(selector.value));
  modes.forEach(button => button.addEventListener("click",()=>setMedium(button.dataset.pmMode)));
  pickers.forEach(button => button.addEventListener("click",()=>{
    updateArtwork(button.dataset.pickProject);
    // Don't forcibly scroll on touch: keep the product preview under user control.
    const stage = workspace.querySelector(".pm-stage");
    if (window.matchMedia("(min-width: 781px)").matches) stage?.scrollIntoView?.({block:"nearest",behavior:"smooth"});
  }));
  updateArtwork(items.has("glory") ? "glory" : ordered[0].slug);
  setMedium("hoodie");
})();
