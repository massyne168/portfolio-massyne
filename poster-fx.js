/* MASSYNE Lab — Pro FX & Procedural Texture Shaders
   Folded Paper Creases, Film Grain, Xerox Halftone, Plastic Gloss Sheen,
   and 1-Click Chrome/Streetwear Text Finishes.
*/
(() => {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // FX State with full undo/redo snapshot support
  const fxState = {
    foldedPaper: false,
    foldedPaperIntensity: 65,
    filmGrain: false,
    filmGrainIntensity: 45,
    halftone: false,
    halftoneIntensity: 50,
    plasticGloss: false,
    plasticGlossIntensity: 60,
    activeTextFinish: 'none'
  };

  // Pre-generate deterministic noise pattern canvas for silky 60fps grain
  let grainCanvas = null;
  function getGrainPattern(intensity) {
    const size = 256;
    if (!grainCanvas) {
      grainCanvas = document.createElement('canvas');
      grainCanvas.width = size;
      grainCanvas.height = size;
      const gctx = grainCanvas.getContext('2d');
      const imgData = gctx.createImageData(size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // High-frequency monochrome noise
        const val = (Math.random() * 255) | 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = (Math.random() * 85 + 20) | 0; // Soft alpha
      }
      gctx.putImageData(imgData, 0, 0);
    }
    return grainCanvas;
  }

  // Pre-generate halftone dot matrix pattern
  let halftoneCanvas = null;
  function getHalftonePattern() {
    const size = 16;
    if (!halftoneCanvas) {
      halftoneCanvas = document.createElement('canvas');
      halftoneCanvas.width = size;
      halftoneCanvas.height = size;
      const hctx = halftoneCanvas.getContext('2d');
      hctx.fillStyle = '#000000';
      hctx.beginPath();
      hctx.arc(size / 2, size / 2, 2.5, 0, Math.PI * 2);
      hctx.fill();
    }
    return halftoneCanvas;
  }

  // Render Folded Paper Creases
  function renderFoldedPaper(targetCtx, w, h, intensity) {
    const alpha = (intensity / 100) * 0.85;
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'overlay';

    // 1. Horizontal fold crease (around 38% and 65% height)
    const y1 = h * 0.38;
    const y2 = h * 0.68;
    const xMid = w * 0.5;

    // Crease 1: Horizontal Top
    let gradH1 = targetCtx.createLinearGradient(0, y1 - 18, 0, y1 + 18);
    gradH1.addColorStop(0, 'rgba(255,255,255,0)');
    gradH1.addColorStop(0.46, `rgba(255,255,255,${0.35 * alpha})`);
    gradH1.addColorStop(0.5, 'rgba(0,0,0,0.85)');
    gradH1.addColorStop(0.54, `rgba(0,0,0,${0.7 * alpha})`);
    gradH1.addColorStop(1, 'rgba(0,0,0,0)');
    targetCtx.fillStyle = gradH1;
    targetCtx.fillRect(0, y1 - 20, w, 40);

    // Crease 2: Horizontal Bottom
    let gradH2 = targetCtx.createLinearGradient(0, y2 - 16, 0, y2 + 16);
    gradH2.addColorStop(0, 'rgba(255,255,255,0)');
    gradH2.addColorStop(0.47, `rgba(255,255,255,${0.3 * alpha})`);
    gradH2.addColorStop(0.5, 'rgba(0,0,0,0.8)');
    gradH2.addColorStop(0.55, `rgba(0,0,0,${0.65 * alpha})`);
    gradH2.addColorStop(1, 'rgba(0,0,0,0)');
    targetCtx.fillStyle = gradH2;
    targetCtx.fillRect(0, y2 - 18, w, 36);

    // Crease 3: Vertical Center Fold
    let gradV = targetCtx.createLinearGradient(xMid - 20, 0, xMid + 20, 0);
    gradV.addColorStop(0, 'rgba(255,255,255,0)');
    gradV.addColorStop(0.46, `rgba(255,255,255,${0.38 * alpha})`);
    gradV.addColorStop(0.5, 'rgba(0,0,0,0.9)');
    gradV.addColorStop(0.54, `rgba(0,0,0,${0.75 * alpha})`);
    gradV.addColorStop(1, 'rgba(0,0,0,0)');
    targetCtx.fillStyle = gradV;
    targetCtx.fillRect(xMid - 22, 0, 44, h);

    // Subtle paper quadrant surface gradients (subtle crumple lighting)
    const quadGrad1 = targetCtx.createLinearGradient(0, 0, xMid, y1);
    quadGrad1.addColorStop(0, `rgba(255,255,255,${0.12 * alpha})`);
    quadGrad1.addColorStop(1, `rgba(0,0,0,${0.18 * alpha})`);
    targetCtx.fillStyle = quadGrad1;
    targetCtx.fillRect(0, 0, xMid, y1);

    const quadGrad2 = targetCtx.createLinearGradient(xMid, y1, w, y2);
    quadGrad2.addColorStop(0, `rgba(0,0,0,${0.15 * alpha})`);
    quadGrad2.addColorStop(1, `rgba(255,255,255,${0.1 * alpha})`);
    targetCtx.fillStyle = quadGrad2;
    targetCtx.fillRect(xMid, y1, w - xMid, y2 - y1);

    targetCtx.restore();
  }

  // Render Analog Film Grain
  function renderFilmGrain(targetCtx, w, h, intensity) {
    const alpha = (intensity / 100) * 0.45;
    if (alpha <= 0) return;
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'overlay';
    targetCtx.globalAlpha = alpha;
    const pat = targetCtx.createPattern(getGrainPattern(intensity), 'repeat');
    targetCtx.fillStyle = pat;
    targetCtx.fillRect(0, 0, w, h);
    targetCtx.restore();
  }

  // Render Xerox Halftone
  function renderHalftone(targetCtx, w, h, intensity) {
    const alpha = (intensity / 100) * 0.38;
    if (alpha <= 0) return;
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'multiply';
    targetCtx.globalAlpha = alpha;
    const pat = targetCtx.createPattern(getHalftonePattern(), 'repeat');
    targetCtx.fillStyle = pat;
    targetCtx.fillRect(0, 0, w, h);
    targetCtx.restore();
  }

  // Render CD / Plastic Gloss Sheen
  function renderPlasticGloss(targetCtx, w, h, intensity) {
    const alpha = (intensity / 100) * 0.65;
    if (alpha <= 0) return;
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';

    // Diagonal specular beam 1
    const diagGrad1 = targetCtx.createLinearGradient(0, 0, w * 1.1, h * 0.9);
    diagGrad1.addColorStop(0, 'rgba(255,255,255,0)');
    diagGrad1.addColorStop(0.24, 'rgba(255,255,255,0)');
    diagGrad1.addColorStop(0.3, `rgba(230,240,255,${0.45 * alpha})`);
    diagGrad1.addColorStop(0.34, `rgba(255,255,255,${0.75 * alpha})`);
    diagGrad1.addColorStop(0.37, `rgba(210,230,255,${0.35 * alpha})`);
    diagGrad1.addColorStop(0.48, 'rgba(255,255,255,0)');
    diagGrad1.addColorStop(0.72, `rgba(255,230,240,${0.25 * alpha})`);
    diagGrad1.addColorStop(0.75, `rgba(255,255,255,${0.5 * alpha})`);
    diagGrad1.addColorStop(0.78, 'rgba(255,255,255,0)');
    diagGrad1.addColorStop(1, 'rgba(255,255,255,0)');

    targetCtx.fillStyle = diagGrad1;
    targetCtx.fillRect(0, 0, w, h);

    // Subtle edge shrinkwrap light rim
    const rimGrad = targetCtx.createLinearGradient(0, 0, 0, h);
    rimGrad.addColorStop(0, `rgba(255,255,255,${0.3 * alpha})`);
    rimGrad.addColorStop(0.03, 'rgba(255,255,255,0)');
    rimGrad.addColorStop(0.97, 'rgba(255,255,255,0)');
    rimGrad.addColorStop(1, `rgba(255,255,255,${0.25 * alpha})`);
    targetCtx.fillStyle = rimGrad;
    targetCtx.fillRect(0, 0, w, h);

    targetCtx.restore();
  }

  // Chrome & Text Style Gradient Generators for Text Layers
  function createLiquidChromeGradient(targetCtx, x, y, width, height) {
    const halfH = height / 2;
    const g = targetCtx.createLinearGradient(0, -halfH, 0, halfH);
    g.addColorStop(0, '#1a1d22');
    g.addColorStop(0.18, '#8b96a5');
    g.addColorStop(0.35, '#dbe2ea');
    g.addColorStop(0.48, '#ffffff');
    g.addColorStop(0.52, '#333a44');
    g.addColorStop(0.7, '#9aa5b4');
    g.addColorStop(0.88, '#edf1f5');
    g.addColorStop(1, '#2c333e');
    return g;
  }

  function createBrushedSilverGradient(targetCtx, x, y, width, height) {
    const halfW = width / 2;
    const g = targetCtx.createLinearGradient(-halfW, 0, halfW, 0);
    g.addColorStop(0, '#686f7a');
    g.addColorStop(0.25, '#d2d7df');
    g.addColorStop(0.5, '#f5f7fa');
    g.addColorStop(0.75, '#b0b6c1');
    g.addColorStop(1, '#686f7a');
    return g;
  }

  // Draw all active overlays on poster:draw
  canvas.addEventListener('poster:draw', () => {
    const w = canvas.width;
    const h = canvas.height;

    // Apply Folded Paper
    if (fxState.foldedPaper) {
      renderFoldedPaper(ctx, w, h, fxState.foldedPaperIntensity);
    }
    // Apply Film Grain
    if (fxState.filmGrain) {
      renderFilmGrain(ctx, w, h, fxState.filmGrainIntensity);
    }
    // Apply Xerox Halftone
    if (fxState.halftone) {
      renderHalftone(ctx, w, h, fxState.halftoneIntensity);
    }
    // Apply CD / Plastic Gloss
    if (fxState.plasticGloss) {
      renderPlasticGloss(ctx, w, h, fxState.plasticGlossIntensity);
    }
  });

  // Undo / Redo Snapshot hooks
  canvas.addEventListener('poster:snapshot', event => {
    event.detail.fxState = { ...fxState };
  });

  canvas.addEventListener('poster:restore', event => {
    if (event.detail && event.detail.fxState) {
      Object.assign(fxState, event.detail.fxState);
      syncUI();
    }
  });

  // Event handler for updating FX from external UI or scripts
  canvas.addEventListener('poster:fx-update', event => {
    if (event.detail) {
      Object.assign(fxState, event.detail);
      syncUI();
      canvas.dispatchEvent(new Event('poster:render'));
    }
  });

  function syncUI() {
    const togglePaper = document.getElementById('fx-folded-paper');
    const sliderPaper = document.getElementById('fx-folded-paper-intensity');
    const toggleGrain = document.getElementById('fx-film-grain');
    const sliderGrain = document.getElementById('fx-film-grain-intensity');
    const toggleHalftone = document.getElementById('fx-halftone');
    const sliderHalftone = document.getElementById('fx-halftone-intensity');
    const toggleGloss = document.getElementById('fx-plastic-gloss');
    const sliderGloss = document.getElementById('fx-plastic-gloss-intensity');

    if (togglePaper) togglePaper.checked = fxState.foldedPaper;
    if (sliderPaper) sliderPaper.value = fxState.foldedPaperIntensity;
    if (toggleGrain) toggleGrain.checked = fxState.filmGrain;
    if (sliderGrain) sliderGrain.value = fxState.filmGrainIntensity;
    if (toggleHalftone) toggleHalftone.checked = fxState.halftone;
    if (sliderHalftone) sliderHalftone.value = fxState.halftoneIntensity;
    if (toggleGloss) toggleGloss.checked = fxState.plasticGloss;
    if (sliderGloss) sliderGloss.value = fxState.plasticGlossIntensity;

    document.querySelectorAll('[data-text-preset]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.textPreset === fxState.activeTextFinish));
    });
  }

  // Setup UI bindings when DOM is ready
  function bindUI() {
    const togglePaper = document.getElementById('fx-folded-paper');
    const sliderPaper = document.getElementById('fx-folded-paper-intensity');
    const toggleGrain = document.getElementById('fx-film-grain');
    const sliderGrain = document.getElementById('fx-film-grain-intensity');
    const toggleHalftone = document.getElementById('fx-halftone');
    const sliderHalftone = document.getElementById('fx-halftone-intensity');
    const toggleGloss = document.getElementById('fx-plastic-gloss');
    const sliderGloss = document.getElementById('fx-plastic-gloss-intensity');

    if (togglePaper) {
      togglePaper.addEventListener('change', e => {
        fxState.foldedPaper = e.target.checked;
        canvas.dispatchEvent(new Event('poster:render'));
      });
    }
    if (sliderPaper) {
      sliderPaper.addEventListener('input', e => {
        fxState.foldedPaperIntensity = Number(e.target.value);
        if (fxState.foldedPaper) canvas.dispatchEvent(new Event('poster:render'));
      });
    }

    if (toggleGrain) {
      toggleGrain.addEventListener('change', e => {
        fxState.filmGrain = e.target.checked;
        canvas.dispatchEvent(new Event('poster:render'));
      });
    }
    if (sliderGrain) {
      sliderGrain.addEventListener('input', e => {
        fxState.filmGrainIntensity = Number(e.target.value);
        if (fxState.filmGrain) canvas.dispatchEvent(new Event('poster:render'));
      });
    }

    if (toggleHalftone) {
      toggleHalftone.addEventListener('change', e => {
        fxState.halftone = e.target.checked;
        canvas.dispatchEvent(new Event('poster:render'));
      });
    }
    if (sliderHalftone) {
      sliderHalftone.addEventListener('input', e => {
        fxState.halftoneIntensity = Number(e.target.value);
        if (fxState.halftone) canvas.dispatchEvent(new Event('poster:render'));
      });
    }

    if (toggleGloss) {
      toggleGloss.addEventListener('change', e => {
        fxState.plasticGloss = e.target.checked;
        canvas.dispatchEvent(new Event('poster:render'));
      });
    }
    if (sliderGloss) {
      sliderGloss.addEventListener('input', e => {
        fxState.plasticGlossIntensity = Number(e.target.value);
        if (fxState.plasticGloss) canvas.dispatchEvent(new Event('poster:render'));
      });
    }

    // Text Style Presets: Liquid Chrome, Brushed Silver, Crimson Glow, Brutalist Outline, Condensed Streetwear
    document.querySelectorAll('[data-text-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.textPreset;
        fxState.activeTextFinish = preset;
        document.querySelectorAll('[data-text-preset]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));

        // Dispatch text style configuration
        canvas.dispatchEvent(new CustomEvent('poster:text-preset-apply', {
          detail: { preset }
        }));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUI);
  } else {
    bindUI();
  }

  // Export methods for 2x rendering and mockups
  window.MASSYNE_FX = {
    state: fxState,
    renderFoldedPaper,
    renderFilmGrain,
    renderHalftone,
    renderPlasticGloss,
    createLiquidChromeGradient,
    createBrushedSilverGradient
  };
})();
