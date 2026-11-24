(() => {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const input = document.getElementById('poster-name');
  const status = document.getElementById('lab-status');
  const pageBackground = document.getElementById('page-background');
  const titleColor = document.getElementById('title-color');
  const titleWeight = document.getElementById('title-weight');

  // Aspect Ratios Configuration
  const RATIOS = {
    '4:5':  { w: 1080, h: 1350, cssRatio: '4/5',  label: '1080 × 1350', meta: '4 : 5' },
    '9:16': { w: 1080, h: 1920, cssRatio: '9/16', label: '1080 × 1920', meta: '9 : 16' },
    '1:1':  { w: 1200, h: 1200, cssRatio: '1/1',  label: '1200 × 1200', meta: '1 : 1' },
    '16:9': { w: 1920, h: 1080, cssRatio: '16/9', label: '1920 × 1080', meta: '16 : 9' }
  };

  let currentRatio = '4:5';

  const state = {
    font: 'Sora',
    textX: 0,
    textY: 0,
    textScale: 100,
    textAngle: 0,
    titleColor: '#FCF6F5',
    titleWeight: '700',
    background: '#050608',
    textPreset: 'none'
  };

  let queued = false;

  // Set Aspect Ratio
  function setAspectRatio(key) {
    if (!RATIOS[key]) key = '4:5';
    currentRatio = key;
    const cfg = RATIOS[key];

    canvas.width = cfg.w;
    canvas.height = cfg.h;
    canvas.style.aspectRatio = cfg.cssRatio;

    if (inkCanvas) {
      inkCanvas.width = cfg.w;
      inkCanvas.height = cfg.h;
    }

    const dimLabel = document.getElementById('canvas-dim-label');
    if (dimLabel) dimLabel.textContent = cfg.label;
    const metaRatio = document.getElementById('canvas-meta-ratio');
    if (metaRatio) metaRatio.textContent = cfg.meta;

    document.querySelectorAll('[data-ratio-option]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.ratioOption === key));
    });

    render();
  }

  window.MASSYNE_SET_RATIO = setAspectRatio;

  document.querySelectorAll('[data-ratio-option]').forEach(btn => {
    btn.addEventListener('click', () => setAspectRatio(btn.dataset.ratioOption));
  });

  // Mode Switcher: 2D Canvas vs Live Mockup
  const modeCanvasBtn = document.getElementById('mode-canvas');
  const modeMockupBtn = document.getElementById('mode-mockup');
  const canvasWorkarea = document.getElementById('canvas-workarea');
  const mockupWorkarea = document.getElementById('mockup-workarea');
  const downloadPosterBtn = document.getElementById('download-poster');
  const exportMockupTopbarBtn = document.getElementById('export-mockup-topbar-btn');
  const ratioSelectorWrap = document.getElementById('ratio-selector-wrap');

  function setStudioMode(mode) {
    const isMockup = mode === 'mockup';
    if (modeCanvasBtn) modeCanvasBtn.setAttribute('aria-pressed', String(!isMockup));
    if (modeMockupBtn) modeMockupBtn.setAttribute('aria-pressed', String(isMockup));
    if (canvasWorkarea) canvasWorkarea.hidden = isMockup;
    if (mockupWorkarea) mockupWorkarea.hidden = !isMockup;
    if (downloadPosterBtn) downloadPosterBtn.hidden = isMockup;
    if (exportMockupTopbarBtn) exportMockupTopbarBtn.hidden = !isMockup;
    if (ratioSelectorWrap) ratioSelectorWrap.style.visibility = isMockup ? 'hidden' : 'visible';

    const statusBadge = document.getElementById('canvas-status-badge');
    if (statusBadge) statusBadge.textContent = isMockup ? 'LIVE MOCKUP' : 'CANVAS';

    if (isMockup && window.MASSYNE_MOCKUPS && window.MASSYNE_MOCKUPS.renderMockup) {
      window.MASSYNE_MOCKUPS.renderMockup();
    }
  }

  if (modeCanvasBtn) modeCanvasBtn.addEventListener('click', () => setStudioMode('canvas'));
  if (modeMockupBtn) modeMockupBtn.addEventListener('click', () => setStudioMode('mockup'));

  // Main Draw Routine
  function draw() {
    queued = false;
    const raw = input ? input.value.trim() : '';
    const title = raw.toLocaleUpperCase();
    const width = canvas.width, height = canvas.height;
    const background = state.background || '#050608';

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    canvas.dataset.paletteForeground = state.titleColor;
    canvas.dataset.paletteAccent = '#c81024';

    const boxes = [];
    if (title) {
      let size = 160;
      ctx.font = `${state.titleWeight} ${size}px "${state.font}", sans-serif`;
      while (ctx.measureText(title).width > (width * 0.86) && size > 28) {
        size -= 2;
        ctx.font = `${state.titleWeight} ${size}px "${state.font}", sans-serif`;
      }
      size *= state.textScale / 100;
      const x = width / 2 + state.textX, y = height / 2 + state.textY;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(state.textAngle * Math.PI / 180);
      ctx.font = `${state.titleWeight} ${size}px "${state.font}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // Apply Text Style Preset (Chrome, Silver, Glow, Outline)
      if (state.textPreset === 'liquid_chrome' && window.MASSYNE_FX) {
        ctx.fillStyle = window.MASSYNE_FX.createLiquidChromeGradient(ctx, -width / 2, -size, width, size * 2);
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 12;
      } else if (state.textPreset === 'brushed_silver' && window.MASSYNE_FX) {
        ctx.fillStyle = window.MASSYNE_FX.createBrushedSilverGradient(ctx, -width / 2, -size, width, size * 2);
        ctx.shadowColor = 'rgba(200,210,230,0.3)';
        ctx.shadowBlur = 8;
      } else if (state.textPreset === 'crimson_glow') {
        ctx.fillStyle = '#ff2a3f';
        ctx.shadowColor = '#c81024';
        ctx.shadowBlur = 24;
      } else if (state.textPreset === 'brutalist_outline') {
        ctx.fillStyle = 'transparent';
        ctx.strokeStyle = state.titleColor;
        ctx.lineWidth = Math.max(3, size * 0.035);
      } else {
        ctx.fillStyle = state.titleColor;
      }

      const textWidth = Math.min(width * 0.92, ctx.measureText(title).width);
      if (state.textPreset === 'brutalist_outline') {
        ctx.strokeText(title, 0, 0, width * 0.92);
      } else {
        ctx.fillText(title, 0, 0, width * 0.92);
      }
      ctx.restore();

      boxes.push({ x, y, width: textWidth, height: size, align: 'center', angle: state.textAngle });
    }

    canvas.dataset.textBoxes = JSON.stringify(boxes);
    canvas.dispatchEvent(new Event('poster:draw'));
    canvas.setAttribute('aria-label', title ? title + ' design canvas' : 'Blank design canvas');
  }

  function render() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  }

  canvas.addEventListener('poster:render', render);

  // Snapshot & Restore for Undo/Redo
  canvas.addEventListener('poster:snapshot', event => {
    event.detail.poster = { ...state, name: input ? input.value : '', ratio: currentRatio };
  });

  canvas.addEventListener('poster:restore', event => {
    const saved = event.detail.poster || {};
    if (input) input.value = saved.name || '';
    for (const key of Object.keys(state)) {
      if (key in saved) state[key] = saved[key];
    }
    if (pageBackground) pageBackground.value = state.background;
    if (titleColor) titleColor.value = state.titleColor;
    if (titleWeight) titleWeight.value = state.titleWeight;
    document.querySelectorAll('[data-font]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.font === state.font));
    });
    if (saved.ratio && saved.ratio !== currentRatio) {
      setAspectRatio(saved.ratio);
    } else {
      render();
    }
  });

  canvas.addEventListener('poster:text-edit', event => {
    Object.assign(state, event.detail);
    render();
  });

  // Text preset application
  canvas.addEventListener('poster:text-preset-apply', event => {
    const preset = event.detail.preset;
    state.textPreset = preset;
    if (preset === 'condensed_streetwear') {
      state.font = 'Anton';
      state.textScale = 125;
      document.querySelectorAll('[data-font]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.font === 'Anton')));
    }
    render();
  });

  if (input) input.addEventListener('input', () => { if (status) status.textContent = ''; render(); });
  if (pageBackground) pageBackground.addEventListener('input', () => { state.background = pageBackground.value; render(); });
  document.querySelectorAll('[data-font]').forEach(button => button.addEventListener('click', () => {
    state.font = button.dataset.font;
    document.querySelectorAll('[data-font]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render();
  }));
  if (titleColor) titleColor.addEventListener('input', () => { state.titleColor = titleColor.value; render(); });
  if (titleWeight) titleWeight.addEventListener('change', () => { state.titleWeight = titleWeight.value; render(); });

  document.documentElement.dataset.theme = 'dark';

  const resetBtn = document.getElementById('reset-poster');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (input) input.value = '';
      Object.assign(state, { font: 'Sora', textX: 0, textY: 0, textScale: 100, textAngle: 0, titleColor: '#FCF6F5', titleWeight: '700', background: '#050608', textPreset: 'none' });
      if (pageBackground) pageBackground.value = state.background;
      if (titleColor) titleColor.value = state.titleColor;
      if (titleWeight) titleWeight.value = state.titleWeight;
      document.querySelectorAll('[data-font]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.font === state.font)));
      document.querySelectorAll('[data-text-preset]').forEach(b => b.setAttribute('aria-pressed', 'false'));
      if (status) status.textContent = 'Design reset to dark obsidian canvas.';
      render();
    });
  }

  // 2x HD PNG Export Routine
  async function exportPoster2x() {
    const button = document.getElementById('download-poster');
    if (button) button.disabled = true;
    try {
      await document.fonts.ready;
      draw();

      const targetW = canvas.width * 2;
      const targetH = canvas.height * 2;
      const offscreen = document.createElement('canvas');
      offscreen.width = targetW;
      offscreen.height = targetH;
      const octx = offscreen.getContext('2d');
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(canvas, 0, 0, targetW, targetH);

      // Re-apply procedural shader textures at native 2x resolution
      if (window.MASSYNE_FX && window.MASSYNE_FX.state) {
        const fx = window.MASSYNE_FX;
        if (fx.state.foldedPaper) fx.renderFoldedPaper(octx, targetW, targetH, fx.state.foldedPaperIntensity);
        if (fx.state.filmGrain) fx.renderFilmGrain(octx, targetW, targetH, fx.state.filmGrainIntensity);
        if (fx.state.halftone) fx.renderHalftone(octx, targetW, targetH, fx.state.halftoneIntensity);
        if (fx.state.plasticGloss) fx.renderPlasticGloss(octx, targetW, targetH, fx.state.plasticGlossIntensity);
      }

      const blob = await new Promise(resolve => offscreen.toBlob(resolve, 'image/png'));
      if (!blob) throw Error('Export unavailable');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = (input ? input.value.trim().replace(/[^a-z0-9]+/gi, '-').slice(0, 30) : '') || 'design';
      a.download = `massyne-lab-${slug}-${targetW}x${targetH}-2x.png`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      if (status) status.textContent = `Your ${targetW} × ${targetH} HD design is exported.`;
    } catch (err) {
      console.error('Export error:', err);
      if (status) status.textContent = 'Export could not finish. Please try again.';
    } finally {
      if (button) button.disabled = false;
    }
  }

  if (downloadPosterBtn) downloadPosterBtn.addEventListener('click', exportPoster2x);

  // Freehand Drawing Engine
  const drawFieldset = document.querySelector('.freehand-controls');
  const strokes = [], inkCanvas = document.createElement('canvas');
  inkCanvas.width = canvas.width;
  inkCanvas.height = canvas.height;
  const inkCtx = inkCanvas.getContext('2d');
  const drawColor = document.getElementById('draw-color');
  const drawSize = document.getElementById('draw-size');
  const drawSizeValue = document.getElementById('draw-size-value');
  const drawToolButtons = drawFieldset ? [...drawFieldset.querySelectorAll('[data-draw-tool]')] : [];
  let drawTool = 'select', activeStroke = null, activePointer = null;

  function setDrawTool(tool, announce = true) {
    drawTool = tool;
    canvas.dataset.tool = tool;
    drawToolButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.drawTool === tool)));
    canvas.dispatchEvent(new CustomEvent('poster:toolchange', { detail: { tool } }));
    if (announce && status) {
      status.textContent = tool === 'select' ? 'Select mode: move text, images and shapes.' : tool === 'draw' ? 'Pen ready — draw on the canvas.' : 'Eraser ready — erase freehand marks.';
    }
  }

  drawToolButtons.forEach(button => button.addEventListener('click', () => setDrawTool(button.dataset.drawTool)));
  if (drawSize && drawSizeValue) {
    drawSize.addEventListener('input', () => {
      drawSizeValue.value = drawSize.value + ' px';
      drawSizeValue.textContent = drawSizeValue.value;
    });
  }

  function drawFreehand() {
    inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    for (const stroke of strokes) {
      if (!stroke.points.length) continue;
      inkCtx.save();
      inkCtx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
      inkCtx.strokeStyle = stroke.color;
      inkCtx.fillStyle = stroke.color;
      inkCtx.lineWidth = stroke.size;
      inkCtx.lineCap = 'round';
      inkCtx.lineJoin = 'round';
      if (stroke.points.length === 1) {
        inkCtx.beginPath();
        inkCtx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
        inkCtx.fill();
      } else {
        inkCtx.beginPath();
        inkCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const a = stroke.points[i], b = stroke.points[i + 1];
          inkCtx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
        }
        const last = stroke.points[stroke.points.length - 1];
        inkCtx.lineTo(last.x, last.y);
        inkCtx.stroke();
      }
      inkCtx.restore();
    }
    ctx.drawImage(inkCanvas, 0, 0);
    canvas.dataset.freehandCount = strokes.length;
    if (Number(canvas.dataset.reportedStrokeCount) !== strokes.length) {
      canvas.dataset.reportedStrokeCount = strokes.length;
      canvas.dispatchEvent(new CustomEvent('poster:freehandchange', { detail: { count: strokes.length } }));
    }
  }

  canvas.addEventListener('poster:draw', drawFreehand);

  canvas.addEventListener('poster:snapshot', event => {
    event.detail.drawings = strokes.map(stroke => ({ ...stroke, points: stroke.points.map(point => ({ ...point })) }));
  });

  canvas.addEventListener('poster:restore', event => {
    const saved = Array.isArray(event.detail.drawings) ? event.detail.drawings : [];
    strokes.splice(0, strokes.length, ...saved.map(stroke => ({ ...stroke, points: stroke.points.map(point => ({ ...point })) })));
    activeStroke = null;
    activePointer = null;
    render();
  });

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) / rect.width * canvas.width)),
      y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) / rect.height * canvas.height))
    };
  }

  canvas.addEventListener('pointerdown', event => {
    if (drawTool === 'select' || (event.button !== 0 && event.pointerType === 'mouse')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    activeStroke = {
      color: drawColor ? drawColor.value : '#c81024',
      size: drawSize ? Number(drawSize.value) : 16,
      erase: drawTool === 'erase',
      points: [canvasPoint(event)]
    };
    strokes.push(activeStroke);
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    render();
  }, { capture: true });

  canvas.addEventListener('pointermove', event => {
    if (!activeStroke || event.pointerId !== activePointer) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const events = event.getCoalescedEvents?.() || [event];
    for (const pointEvent of events) activeStroke.points.push(canvasPoint(pointEvent));
    render();
  }, { capture: true });

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => {
      if (!activeStroke || event.pointerId !== activePointer) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      activePointer = null;
      activeStroke = null;
      render();
      if (status) status.textContent = 'Stroke added. Use Undo or keep creating.';
    }, { capture: true });
  }

  const clearDrawingBtn = document.getElementById('clear-drawing');
  if (clearDrawingBtn) {
    clearDrawingBtn.addEventListener('click', () => {
      if (!strokes.length) return;
      strokes.length = 0;
      render();
      if (status) status.textContent = 'Freehand marks cleared. Use Undo to bring them back.';
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      strokes.length = 0;
      activeStroke = null;
      activePointer = null;
      if (drawColor) drawColor.value = '#c81024';
      if (drawSize) drawSize.value = '16';
      if (drawSizeValue) {
        drawSizeValue.value = '16 px';
        drawSizeValue.textContent = '16 px';
      }
      setDrawTool('select', false);
    });
  }

  setDrawTool('select', false);
  draw();

  Promise.all([
    'Sora', 'Anton', 'Bebas Neue', 'Space Grotesk', 'DM Serif Display',
    'Oswald', 'Orbitron', 'Montserrat', 'Manrope', 'Playfair Display', 'IBM Plex Mono'
  ].map(font => document.fonts.load(`700 32px "${font}"`).catch(() => {}))).then(render);
})();
