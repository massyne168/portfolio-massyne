/* MASSYNE / subtle portrait back-light interaction.
   Shifts only the ambient background. The actual portrait never distorts. */
(() => {
  "use strict";
  const card = document.querySelector(".hero-v2-portrait.portrait-art-directed");
  if (!card) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let pending = 0;
  let relativeX = 0;
  let relativeY = 0;
  const reset = () => {
    if (pending) window.cancelAnimationFrame(pending);
    pending = 0;
    card.style.setProperty("--portrait-light-x", "0px");
    card.style.setProperty("--portrait-light-y", "0px");
  };
  const flush = () => {
    pending = 0;
    card.style.setProperty("--portrait-light-x", Math.round(relativeX * 13) + "px");
    card.style.setProperty("--portrait-light-y", Math.round(relativeY * 11) + "px");
  };
  card.addEventListener("pointermove", event => {
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    relativeX = Math.min(1, Math.max(-1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    relativeY = Math.min(1, Math.max(-1, ((event.clientY - rect.top) / rect.height - .5) * 2));
    if (!pending) pending = window.requestAnimationFrame(flush);
  }, {passive:true});
  card.addEventListener("pointerleave",reset);
  window.addEventListener("blur",reset);
})();
