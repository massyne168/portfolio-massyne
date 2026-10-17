/* MASSYNE / Cinematic signature intro — 0 to 100 in 3.45s, no libraries.
   Runs on every full document load, including F5/Refresh.
   Reduced motion, background tabs, and navigation fail safely. */
(() => {
  "use strict";
  const overlay = document.querySelector(".site-preloader");
  if (!overlay) return;
  const count = overlay.querySelector(".loader-count");
  const bar = overlay.querySelector(".loader-progress-fill");
  const progress = overlay.querySelector("[role=progressbar]");
  const skip = overlay.querySelector(".loader-skip");
  const status = overlay.querySelector(".intro-status");
  const stages = [...overlay.querySelectorAll("[data-intro-stage]")];
  const phaseLabels = [
    "ESTABLISHING IDENTITY",
    "CURATING VISUAL WORLDS",
    "IGNITING MOTION",
    "OPENING THE EXPERIENCE"
  ];
  let currentPhase = -1;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Replay on every page load/refresh rather than relying on session storage.
  // Accessibility exception: never delay visitors requesting reduced motion.
  if (reduced) return;

  const DURATION_MS = 3450;
  let raf = 0;
  let watchdog = 0;
  let finished = false;
  let previous = -1;
  const originallyFocused = document.activeElement;
  const blocked = [...document.querySelectorAll("header.site-header,main,footer")];
  const previousInert = blocked.map(node => !!node.inert);

  const update = fraction => {
    const clamped = Math.max(0, Math.min(1, fraction));
    // One tiny CSS variable drives the scanning light and progress indicator.
    overlay.style.setProperty("--intro-progress", clamped.toFixed(4));
    const value = Math.min(100, Math.max(0, Math.floor(clamped * 100)));
    if (value === previous) return;
    previous = value;
    if (count) count.textContent = String(value).padStart(2, "0");
    if (bar) bar.style.transform = "scaleX(" + clamped + ")";
    if (progress) progress.setAttribute("aria-valuenow", String(value));
    const phase = Math.min(3, Math.floor(value / 25));
    if (phase !== currentPhase) {
      currentPhase = phase;
      if (status) status.textContent = phaseLabels[phase];
      stages.forEach((step, index) => {
        step.classList.toggle("is-active", index === phase);
        step.classList.toggle("is-done", index < phase);
      });
    }
    if (value === 100 && status) status.textContent = "WELCOME TO MASSYNE";
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    window.cancelAnimationFrame(raf);
    window.clearTimeout(watchdog);
    update(1);
    document.documentElement.classList.remove("intro-active");
    document.body.classList.remove("intro-active");
    blocked.forEach((node, i) => { node.inert = previousInert[i]; });
    overlay.classList.add("is-leaving");
    overlay.setAttribute("aria-hidden", "true");

    if (document.activeElement === skip) {
      if (originallyFocused && originallyFocused !== document.body &&
          typeof originallyFocused.focus === "function") {
        originallyFocused.focus({preventScroll:true});
      } else {
        document.querySelector(".site-header .brand-logo")?.focus({preventScroll:true});
      }
    }
    window.setTimeout(() => { overlay.hidden = true; }, 670);
  };

  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("intro-active");
  document.body.classList.add("intro-active");
  blocked.forEach(node => { node.inert = true; });
  update(0);
  skip?.addEventListener("click", finish);
  const startedAt = window.performance.now();
  const tick = now => {
    if (finished) return;
    update((now - startedAt) / DURATION_MS);
    if (now - startedAt >= DURATION_MS) finish();
    else raf = window.requestAnimationFrame(tick);
  };
  raf = window.requestAnimationFrame(tick);
  watchdog = window.setTimeout(finish, 4600);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finish();
  });
  window.addEventListener("pagehide", finish, {once:true});
})();