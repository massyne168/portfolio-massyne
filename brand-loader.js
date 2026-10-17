/* MASSYNE / First-visit intro — 0 to 100 in 3.45s, no libraries.
   Plays once per tab/session; add ?intro=1 to explicitly replay.
   Reduced motion, failed storage, background tabs, and navigation fail safely. */
(() => {
  "use strict";
  const overlay = document.querySelector(".site-preloader");
  if (!overlay) return;
  const count = overlay.querySelector(".loader-count");
  const bar = overlay.querySelector(".loader-progress-fill");
  const progress = overlay.querySelector("[role=progressbar]");
  const skip = overlay.querySelector(".loader-skip");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(window.location.search);
  const forceReplay = params.get("intro") === "1";
  const storageKey = "massyne:cinematic-intro:v1";
  let alreadyPlayed = false;
  try { alreadyPlayed = window.sessionStorage.getItem(storageKey) === "yes"; } catch (_) {}
  if (reduced || (alreadyPlayed && !forceReplay)) return;

  const DURATION_MS = 3450;
  let raf = 0;
  let watchdog = 0;
  let finished = false;
  let previous = -1;
  const originallyFocused = document.activeElement;
  const blocked = [...document.querySelectorAll("header.site-header,main,footer")];
  const previousInert = blocked.map(node => !!node.inert);

  const update = fraction => {
    const value = Math.min(100, Math.max(0, Math.floor(fraction * 100)));
    if (value === previous) return;
    previous = value;
    if (count) count.textContent = String(value).padStart(2, "0");
    if (bar) bar.style.transform = "scaleX(" + value / 100 + ")";
    if (progress) progress.setAttribute("aria-valuenow", String(value));
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    window.cancelAnimationFrame(raf);
    window.clearTimeout(watchdog);
    update(1);
    try { window.sessionStorage.setItem(storageKey, "yes"); } catch (_) {}
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
    window.setTimeout(() => { overlay.hidden = true; }, 390);
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