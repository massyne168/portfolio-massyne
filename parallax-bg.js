(function () {
  function hasStudioBackground() {
    const studioBg = document.getElementById("site-background-layer");
    return Boolean(studioBg && studioBg.querySelector(".site-background-media"));
  }

  function removeParallaxIfStudioActive() {
    if (!hasStudioBackground()) return false;
    const existing = document.getElementById("massyne-parallax-bg");
    if (existing) existing.remove();
    return true;
  }

  function initParallaxBg() {
    if (removeParallaxIfStudioActive()) return;
    if (document.getElementById("massyne-parallax-bg")) return;

    const stage = document.createElement("div");
    stage.id = "massyne-parallax-bg";
    stage.setAttribute("aria-hidden", "true");
    stage.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:0;zoom:1.07527;overflow:hidden;perspective:1200px;pointer-events:none;background:transparent;transition:opacity 0.25s ease;";

    const layer = document.createElement("div");
    layer.style.cssText =
      "position:absolute;inset:-10%;width:120%;height:120%;transform-style:preserve-3d;will-change:transform;";

    const bgCfg = window.MASSYNE_STUDIO_CONTENT?.site?.background;
    const customBgSrc = bgCfg?.path || bgCfg?.src || bgCfg?.url;
    const defaultBgSrc = "https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev/images/og-preview.jpg";
    const bgSrc = customBgSrc || defaultBgSrc;
    const isVideoBg = bgCfg?.type === "video" || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(bgSrc);
    const img = document.createElement(isVideoBg ? "video" : "img");
    img.src = bgSrc;
    if (isVideoBg) { img.autoplay = true; img.loop = true; img.muted = true; img.playsInline = true; img.preload = "metadata"; }
    img.alt = "";
    img.decoding = "async";
    img.style.cssText =
      "width:100%;height:100%;object-fit:cover;display:block;filter:blur(0px);";
    img.onerror = function () { stage.remove(); };

    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 45%, rgba(8, 8, 10, 0.35), rgba(8, 8, 10, 0.55));";

    layer.appendChild(img);
    stage.appendChild(layer);
    stage.appendChild(overlay);
    document.body.prepend(stage);

    let mx = 0, my = 0, tx = 0, ty = 0;
    let rafId = 0;
    const depth = 1.0;

    function tick() {
      rafId = 0;
      if (document.hidden || !document.body.contains(stage)) return;
      mx += (tx - mx) * 0.07;
      my += (ty - my) * 0.07;
      const moveX = -mx * 26 * depth;
      const moveY = -my * 18 * depth;
      const rotY = mx * 3.5 * depth;
      const rotX = -my * 3.5 * depth;
      layer.style.transform =
        "translate3d(" + moveX.toFixed(2) + "px," + moveY.toFixed(2) + "px,0) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg)";
      if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function wake() {
      if (!rafId && !document.hidden && document.body.contains(stage)) {
        rafId = requestAnimationFrame(tick);
      }
    }

    if (window.MutationObserver) {
      new MutationObserver(removeParallaxIfStudioActive).observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      ty = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      wake();
    }, { passive: true });

    window.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) {
        tx = (e.touches[0].clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        ty = (e.touches[0].clientY / Math.max(1, window.innerHeight)) * 2 - 1;
        wake();
      }
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) wake();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initParallaxBg);
  } else {
    initParallaxBg();
  }
})();