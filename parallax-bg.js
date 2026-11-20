(function () {
  function initParallaxBg() {
    if (document.getElementById("massyne-parallax-bg")) return;

    const stage = document.createElement("div");
    stage.id = "massyne-parallax-bg";
    stage.setAttribute("aria-hidden", "true");
    stage.style.cssText =
      "position:fixed;inset:0;z-index:-1;overflow:hidden;perspective:1200px;pointer-events:none;background:#08080a;transition:opacity 0.25s ease;";

    const layer = document.createElement("div");
    layer.style.cssText =
      "position:absolute;inset:-7%;width:114%;height:114%;transform-style:preserve-3d;will-change:transform;";

    const bgCfg = window.MASSYNE_STUDIO_CONTENT?.site?.background; const customBgSrc = bgCfg?.path || bgCfg?.src; const defaultBgSrc = "images/og-preview.jpg"; const bgSrc = customBgSrc || defaultBgSrc; const isVideoBg = bgCfg?.type === "video" || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(bgSrc); const img = document.createElement(isVideoBg ? "video" : "img");
    img.src = bgSrc; if (isVideoBg) { img.autoplay = true; img.loop = true; img.muted = true; img.playsInline = true; }
    img.alt = "";
    img.style.cssText =
      "width:100%;height:100%;object-fit:cover;display:block;filter:blur(0px);";
    img.onerror = function () { img.style.display = "none"; };

    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 45%, rgba(8,8,10,0.35), rgba(8,8,10,0.82));";

    layer.appendChild(img);
    stage.appendChild(layer);
    stage.appendChild(overlay);
    document.body.prepend(stage);

    function syncTheme() {
      const isLight =
        document.documentElement.getAttribute("data-theme") === "light" ||
        document.body.classList.contains("light-theme");
      stage.style.opacity = isLight ? "0" : "1";
    }
    syncTheme();
    if (window.MutationObserver) {
      new MutationObserver(syncTheme).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "class"]
      });
    }

    let mx = 0, my = 0, tx = 0, ty = 0;
    const depth = 1.0; // 100% 3D Depth

    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      ty = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    }, { passive: true });

    window.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) {
        tx = (e.touches[0].clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        ty = (e.touches[0].clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      }
    }, { passive: true });

    function tick() {
      mx += (tx - mx) * 0.07;
      my += (ty - my) * 0.07;
      const moveX = -mx * 42 * depth;
      const moveY = -my * 28 * depth;
      const rotY = mx * 5.5 * depth;
      const rotX = -my * 4.5 * depth;
      layer.style.transform =
        "translate3d(" + moveX.toFixed(2) + "px," + moveY.toFixed(2) + "px,0) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initParallaxBg);
  } else {
    initParallaxBg();
  }
})();
