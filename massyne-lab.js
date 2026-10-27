/* MASSYNE LAB: three lightweight, opt-in CSS-based experiments. */
(() => {
  "use strict";
  const root = document.querySelector("#lab");
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));
  const choose = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const selected = index === i;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i]?.toggleAttribute("hidden", !selected);
    });
    if (focus) tabs[index]?.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => choose(i));
    tab.addEventListener("keydown", event => {
      if (!["ArrowRight","ArrowLeft","Home","End"].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
        (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      choose(index, true);
    });
  });
  choose(0);

  const typeInput = root.querySelector("#lab-type-input");
  const typeCopy = root.querySelector("#lab-type-copy");
  const typeStage = root.querySelector("#lab-type-stage");
  const typeMotion = root.querySelector("#lab-type-motion");
  const updateType = () => { typeCopy.textContent = typeInput.value.trim() || "MASSYNE"; };
  typeInput?.addEventListener("input", updateType);
  updateType();
  root.querySelector("#lab-type-outline")?.addEventListener("click", event => {
    const button = event.currentTarget;
    const active = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(active));
    typeStage.dataset.outline = String(active);
  });

  const posterImage = root.querySelector("#lab-poster-image");
  const posterTitle = root.querySelector("#lab-poster-title");
  const posterButtons = [...root.querySelectorAll("[data-lab-poster]")];
  posterButtons.forEach(button => button.addEventListener("click", () => {
    posterImage.src = button.dataset.labPoster;
    posterImage.alt = button.dataset.title + " — original MASSYNE artwork";
    posterTitle.textContent = button.dataset.title;
    posterButtons.forEach(option => option.setAttribute("aria-pressed", String(option === button)));
  }));
  root.querySelector("#lab-poster-contrast")?.addEventListener("input", event => {
    posterImage.style.setProperty("--lab-contrast", String(Number(event.target.value) / 100));
  });

  const colorStage = root.querySelector("#lab-color-stage");
  const paletteButtons = [...root.querySelectorAll("[data-lab-palette]")];
  paletteButtons.forEach(button => button.addEventListener("click", () => {
    colorStage.dataset.palette = button.dataset.labPalette;
    paletteButtons.forEach(option => option.setAttribute("aria-pressed", String(option === button)));
  }));

  // No continuous animation loops: movement is only in response to deliberate pointer interaction.
  // Reduced-motion and touch visitors still have complete access to the controls.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches &&
      matchMedia("(hover: hover) and (pointer: fine)").matches) {
    [[typeStage,typeMotion],[colorStage,null]].forEach(([stage,range]) => {
      let frame = 0;
      let point = null;
      const move = event => {
        const rect = stage.getBoundingClientRect();
        point = [(event.clientX - rect.left) / rect.width - .5,(event.clientY - rect.top) / rect.height - .5];
        if (frame) return;
        frame = requestAnimationFrame(() => {
          const strength = range ? Number(range.value) : 18;
          stage.style.setProperty("--lab-x", (point[0] * strength).toFixed(1) + "px");
          stage.style.setProperty("--lab-y", (point[1] * strength).toFixed(1) + "px");
          frame = 0;
        });
      };
      stage?.addEventListener("pointermove", move, {passive:true});
      stage?.addEventListener("pointerleave", () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        stage.style.setProperty("--lab-x", "0px");
        stage.style.setProperty("--lab-y", "0px");
      });
    });
  }
})();
