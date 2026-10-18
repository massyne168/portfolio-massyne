/* MASSYNE / 2026 STUDIO OPENING.
   Show only on first direct arrival in a tab or an explicit browser refresh (F5).
   Never interrupt clicking through internal projects, About, Services or other pages.
   Pure browser CSS/JS: no external packages, heavy media or persistent tracking. */
(() => {
  "use strict";
  const overlay = document.querySelector(".site-preloader");
  if (!overlay) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navInfo = window.performance.getEntriesByType?.("navigation")?.[0];
  const explicitReload = navInfo?.type === "reload";
  const firstViewKey = "massyne:studio-intro-seen";
  const navigationKey = "massyne:skip-intro-once";

  // Mark every genuine internal navigation, not only the carousel/next-project
  // clicks. Native browser refresh never dispatches the click event.
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target?.closest?.("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    try {
      const destination = new URL(link.href, document.baseURI);
      if (destination.origin === window.location.origin &&
          (destination.pathname !== window.location.pathname ||
           destination.search !== window.location.search)) {
        window.sessionStorage.setItem(navigationKey, "yes");
      }
    } catch (_) {}
  }, {capture:true});

  let visited = false, internalFlag = false;
  try {
    visited = window.sessionStorage.getItem(firstViewKey) === "yes";
    internalFlag = window.sessionStorage.getItem(navigationKey) === "yes";
    window.sessionStorage.removeItem(navigationKey);
  } catch (_) { /* Private/incognito storage denied; rely on referrer instead. */ }
  let internalReferrer = false;
  try {
    internalReferrer = Boolean(document.referrer) &&
      new URL(document.referrer).origin === window.location.origin;
  } catch (_) {}

  // A genuine browser refresh wins even when session flags/referrer exist.
  // A visitor who opens a new tab directly gets one introduction; internal
  // links always skip. Reloading any page deliberately replays the intro.
  const shouldShow = !reduced &&
    (explicitReload || (!visited && !internalFlag && !internalReferrer));
  if (!shouldShow) {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    return;
  }
  try { window.sessionStorage.setItem(firstViewKey, "yes"); } catch (_) {}

  const count = overlay.querySelector(".loader-count");
  const bar = overlay.querySelector(".loader-progress-fill");
  const progress = overlay.querySelector('[role="progressbar"]');
  const status = overlay.querySelector(".intro-status");
  const skip = overlay.querySelector(".loader-skip");
  const pageElements = [...document.querySelectorAll("header.site-header,main,footer")];
  const oldInert = pageElements.map(el => el.inert);
  const startingFocus = document.activeElement;
  let raf = 0, watchdog = 0, endTimer = 0, complete = false;
  const DURATION_MS = 1950;
  const labelAt = ["PREPARING THE STUDIO", "CURATING THE WORK", "OPENING THE PORTFOLIO", "WELCOME TO MASSYNE"];

  const progressTo = fraction => {
    const amount = Math.min(1,Math.max(0,fraction));
    const percent = Math.floor(amount * 100);
    if (count) count.textContent = String(percent).padStart(2,"0");
    if (bar) bar.style.transform = "scaleX(" + amount.toFixed(4) + ")";
    if (progress) progress.setAttribute("aria-valuenow",String(percent));
    if (status) status.textContent = labelAt[Math.min(3,Math.floor(amount * 4))];
  };
  const finish = () => {
    if (complete) return;
    complete = true;
    window.cancelAnimationFrame(raf);
    window.clearTimeout(watchdog);
    progressTo(1);
    overlay.classList.add("is-leaving");
    document.documentElement.classList.remove("intro-active");
    document.body.classList.remove("intro-active");
    pageElements.forEach((node,i) => {node.inert = oldInert[i];});
    if (startingFocus && typeof startingFocus.focus === "function" &&
        startingFocus.isConnected && startingFocus !== document.body) {
      startingFocus.focus({preventScroll:true});
    }
    endTimer = window.setTimeout(() => {
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden","true");
    }, 520);
  };

  overlay.hidden = false;
  overlay.setAttribute("aria-hidden","false");
  overlay.classList.remove("is-leaving");
  document.documentElement.classList.add("intro-active");
  document.body.classList.add("intro-active");
  pageElements.forEach(el => { el.inert = true; });
  progressTo(0);
  skip?.addEventListener("click",finish);
  const begin = window.performance.now();
  const frame = now => {
    if (complete) return;
    const elapsed = now - begin;
    progressTo(elapsed / DURATION_MS);
    if (elapsed >= DURATION_MS) finish();
    else raf = window.requestAnimationFrame(frame);
  };
  raf = window.requestAnimationFrame(frame);
  watchdog = window.setTimeout(finish, 3400);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finish();
  });
  window.addEventListener("pagehide", finish, {once:true});
})();