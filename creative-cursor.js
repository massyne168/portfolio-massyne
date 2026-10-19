/* MASSYNE — lightweight desktop cursor. No timers, no heavy filters. */
(() => {
  "use strict";
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || reduced.matches) return;
  const cursor = document.createElement("div");
  cursor.className = "creative-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<span class="creative-cursor-dot"></span><span class="creative-cursor-label">VIEW PROJECT ↗</span>';
  document.body.append(cursor);
  let x = -100, y = -100, frame = 0;
  let target = null;
  const draw = () => { frame = 0; cursor.style.transform = "translate3d(" + x + "px," + y + "px,0)"; };
  const onMove = event => {
    if (!fine.matches || document.body.classList.contains("intro-active")) return;
    x = event.clientX; y = event.clientY;
    if (!frame) frame = requestAnimationFrame(draw);
    cursor.classList.add("is-visible");
    const card = event.target.closest?.(".project-grid > .project.image-open");
    const active = card && !card.classList.contains("carousel-outside") && !card.classList.contains("project-upcoming") && !card.closest(".is-dragging");
    if (card !== target) {
      target = card;
      cursor.classList.toggle("is-project", Boolean(active));
    }
    if (!active && cursor.classList.contains("is-project")) cursor.classList.remove("is-project");
  };
  window.addEventListener("pointermove", onMove, { passive:true });
  document.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
  document.addEventListener("pointerdown", () => cursor.classList.remove("is-project"), { passive:true });
  window.addEventListener("blur", () => cursor.classList.remove("is-visible"));
  reduced.addEventListener?.("change", () => { cursor.hidden = reduced.matches; });
  fine.addEventListener?.("change", () => { cursor.hidden = !fine.matches; });
})();