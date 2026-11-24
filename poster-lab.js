/* ==========================================================================
   MASSYNE LAB — CANVA EDITION 2D GRAPHIC DESIGN STUDIO ENGINE
   Multi-layer interactive 2D canvas, magnetic alignment guides,
   8-handle transformation, Google Fonts typography, vector shapes,
   Cloudflare R2 portfolio assets, analog texture shaders, and 2x HD export.
   Zero external dependencies • Hardware accelerated • Pure Dark-Only
   ========================================================================== */

(() => {
  "use strict";

  // DOM Elements
  const canvas = document.getElementById("poster-canvas");
  const overlayCanvas = document.getElementById("overlay-canvas");
  if (!canvas || !overlayCanvas) return;

  const ctx = canvas.getContext("2d");
  const octx = overlayCanvas.getContext("2d");

  const canvasViewport = document.getElementById("canvas-viewport");
  const canvasStageWrapper = document.getElementById("canvas-stage-wrapper");
  const canvasPresetSelect = document.getElementById("canvas-preset");
  const canvasDimPill = document.getElementById("canvas-dim-pill");
  const projectTitleInput = document.getElementById("project-title");
  const zoomLabel = document.getElementById("zoom-label");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const btnZoomFit = document.getElementById("btn-zoom-fit");
  const btnUndo = document.getElementById("btn-undo");
  const btnRedo = document.getElementById("btn-redo");
  const btnSaveJson = document.getElementById("btn-save-json");
  const btnOpenJson = document.getElementById("btn-open-json");
  const projectJsonInput = document.getElementById("project-json-input");
  const btnExportMain = document.getElementById("btn-export-main");
  const exportDropdown = document.getElementById("export-dropdown");
  const exportPng2x = document.getElementById("export-png-2x");
  const exportPng1x = document.getElementById("export-png-1x");
  const exportJpg2x = document.getElementById("export-jpg-2x");
  const exportTransparentBg = document.getElementById("export-transparent-bg");
  const statusText = document.getElementById("status-text");

  // Custom Size Modal
  const customSizeModal = document.getElementById("custom-size-modal");
  const customSizeForm = document.getElementById("custom-size-form");
  const customWInput = document.getElementById("custom-w");
  const customHInput = document.getElementById("custom-h");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnCancelCustom = document.getElementById("btn-cancel-custom");

  // Left Drawer & Navigation
  const toolRail = document.querySelector(".tool-rail");
  const leftDrawer = document.getElementById("left-drawer");
  const drawerTitle = document.getElementById("drawer-title");
  const btnCloseDrawer = document.getElementById("btn-close-drawer");

  // Right Inspector
  const tabProperties = document.getElementById("tab-properties");
  const tabLayers = document.getElementById("tab-layers");
  const panelProperties = document.getElementById("panel-properties");
  const panelLayers = document.getElementById("panel-layers");
  const contextInspectorBody = document.getElementById("context-inspector-body");
  const layersStackList = document.getElementById("layers-stack-list");
  const layersBadge = document.getElementById("layers-badge");
  const btnLayerUp = document.getElementById("btn-layer-up");
  const btnLayerDown = document.getElementById("btn-layer-down");
  const btnLayerTop = document.getElementById("btn-layer-top");
  const btnLayerBottom = document.getElementById("btn-layer-bottom");

  // Canvas Format Presets
  const PRESETS = {
    "3:4": { w: 1080, h: 1440, label: "1080 × 1440 (3:4)" },
    "1:1": { w: 1080, h: 1080, label: "1080 × 1080 (1:1)" },
    "9:16": { w: 1080, h: 1920, label: "1080 × 1920 (9:16)" },
    "16:9": { w: 1920, h: 1080, label: "1920 × 1080 (16:9)" },
    "4:5": { w: 1200, h: 1500, label: "1200 × 1500 (4:5)" },
    "custom": { w: 1080, h: 1440, label: "Custom" }
  };

  // Master Studio State
  const state = {
    title: "Untitled Design",
    format: "3:4",
    width: 1080,
    height: 1440,
    zoom: 1.0,
    background: {
      type: "color", // "color" | "gradient" | "pattern"
      color: "#050608",
      gradient: "obsidian_noir",
      pattern: "none"
    },
    overlays: {
      grain: false,
      grainDensity: 45,
      creases: false,
      creasesIntensity: 65,
      halftone: false,
      halftoneContrast: 50,
      gloss: false,
      glossSheen: 60,
      scanlines: false,
      scanlinesOpacity: 35,
      vignette: false,
      vignetteIntensity: 50
    },
    layers: [],
    selectedId: null,
    snapGuides: { x: null, y: null }
  };

  // Undo / Redo History
  const history = {
    undoStack: [],
    redoStack: [],
    max: 30
  };

  function pushHistory(action = "Edit") {
    // Clone state snapshot
    const snapshot = {
      title: state.title,
      format: state.format,
      width: state.width,
      height: state.height,
      background: JSON.parse(JSON.stringify(state.background)),
      overlays: JSON.parse(JSON.stringify(state.overlays)),
      layers: state.layers.map(l => {
        const copy = { ...l };
        if (l.type === "image" && l.img) copy.imgSrc = l.img.src;
        return copy;
      }),
      selectedId: state.selectedId
    };

    history.undoStack.push(snapshot);
    if (history.undoStack.length > history.max) history.undoStack.shift();
    history.redoStack = []; // clear redo on new action
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (btnUndo) btnUndo.disabled = history.undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = history.redoStack.length === 0;
  }

  function undo() {
    if (!history.undoStack.length) return;
    const current = {
      title: state.title,
      format: state.format,
      width: state.width,
      height: state.height,
      background: JSON.parse(JSON.stringify(state.background)),
      overlays: JSON.parse(JSON.stringify(state.overlays)),
      layers: state.layers.map(l => ({ ...l })),
      selectedId: state.selectedId
    };
    history.redoStack.push(current);

    const prev = history.undoStack.pop();
    restoreSnapshot(prev);
    updateHistoryButtons();
    setStatus("Undo performed.");
  }

  function redo() {
    if (!history.redoStack.length) return;
    const current = {
      title: state.title,
      format: state.format,
      width: state.width,
      height: state.height,
      background: JSON.parse(JSON.stringify(state.background)),
      overlays: JSON.parse(JSON.stringify(state.overlays)),
      layers: state.layers.map(l => ({ ...l })),
      selectedId: state.selectedId
    };
    history.undoStack.push(current);

    const next = history.redoStack.pop();
    restoreSnapshot(next);
    updateHistoryButtons();
    setStatus("Redo performed.");
  }

  function restoreSnapshot(snap) {
    state.title = snap.title;
    if (projectTitleInput) projectTitleInput.value = snap.title;
    state.format = snap.format;
    state.width = snap.width;
    state.height = snap.height;
    state.background = snap.background;
    state.overlays = snap.overlays;
    state.selectedId = snap.selectedId;

    canvas.width = snap.width;
    canvas.height = snap.height;
    overlayCanvas.width = snap.width;
    overlayCanvas.height = snap.height;

    // Restore layers & re-attach HTMLImageElements for image layers
    state.layers = snap.layers.map(l => {
      const copy = { ...l };
      if (copy.type === "image" && (copy.imgSrc || copy.src)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = copy.imgSrc || copy.src;
        copy.img = img;
      }
      return copy;
    });

    if (canvasPresetSelect) canvasPresetSelect.value = snap.format;
    if (canvasDimPill) canvasDimPill.textContent = `${snap.width} × ${snap.height}`;

    render();
    renderLayersList();
    renderContextInspector();
  }

  // Set Status Message
  function setStatus(msg) {
    if (statusText) statusText.textContent = msg;
  }

  // Unique ID generator
  const uid = () => "lyr_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5);

  // Set Canvas Dimensions
  function setCanvasDimensions(w, h, formatKey = "custom") {
    pushHistory("Resize Canvas");
    state.width = w;
    state.height = h;
    state.format = formatKey;

    canvas.width = w;
    canvas.height = h;
    overlayCanvas.width = w;
    overlayCanvas.height = h;

    if (canvasDimPill) canvasDimPill.textContent = `${w} × ${h}`;
    fitZoom();
    render();
  }

  // Zoom Handling
  function setZoom(val) {
    state.zoom = Math.max(0.2, Math.min(2.5, val));
    if (canvasStageWrapper) {
      canvasStageWrapper.style.transform = `scale(${state.zoom})`;
    }
    if (zoomLabel) zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function fitZoom() {
    if (!canvasViewport) return;
    const vpRect = canvasViewport.getBoundingClientRect();
    const availableW = vpRect.width - 80;
    const availableH = vpRect.height - 80;
    if (availableW <= 0 || availableH <= 0) return;

    const scale = Math.min(1.0, availableW / state.width, availableH / state.height);
    setZoom(scale);
  }

  // Pre-generate noise grain canvas
  let noiseCanvas = null;
  function getNoisePattern() {
    if (!noiseCanvas) {
      noiseCanvas = document.createElement("canvas");
      noiseCanvas.width = 256;
      noiseCanvas.height = 256;
      const nctx = noiseCanvas.getContext("2d");
      const imgData = nctx.createImageData(256, 256);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = (Math.random() * 85 + 20) | 0;
      }
      nctx.putImageData(imgData, 0, 0);
    }
    return noiseCanvas;
  }

  // ==========================================================================
  // RENDER ENGINE
  // ==========================================================================
  function render() {
    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Background
    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (state.background.type === "color") {
      ctx.fillStyle = state.background.color || "#050608";
      ctx.fillRect(0, 0, w, h);
    } else if (state.background.type === "gradient") {
      const gradKey = state.background.gradient || "obsidian_noir";
      let grad;
      if (gradKey === "obsidian_noir") {
        grad = ctx.createRadialGradient(w / 2, h * 0.35, w * 0.05, w / 2, h / 2, w * 0.75);
        grad.addColorStop(0, "#181b24");
        grad.addColorStop(1, "#050608");
      } else if (gradKey === "crimson_eclipse") {
        grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "#1d0307");
        grad.addColorStop(0.65, "#050608");
        grad.addColorStop(1, "#680c16");
      } else if (gradKey === "chrome_horizon") {
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#101217");
        grad.addColorStop(0.5, "#2d3340");
        grad.addColorStop(1, "#08090c");
      } else if (gradKey === "blood_moon") {
        grad = ctx.createRadialGradient(w / 2, h * 0.8, w * 0.1, w / 2, h * 0.6, w * 0.85);
        grad.addColorStop(0, "#820f1d");
        grad.addColorStop(1, "#050608");
      } else {
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#12141c");
        grad.addColorStop(1, "#050608");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Pattern Overlays
    if (state.background.pattern === "dots") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      const spacing = 36;
      for (let x = spacing / 2; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (state.background.pattern === "grid") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const step = 48;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    } else if (state.background.pattern === "iso") {
      ctx.strokeStyle = "rgba(200, 16, 36, 0.06)";
      ctx.lineWidth = 1;
      const step = 64;
      for (let d = -w; d < w + h; d += step) {
        ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + h, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(d, h); ctx.lineTo(d + h, 0); ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Draw Layers in Stack Order
    state.layers.forEach(layer => {
      if (!layer.visible) return;

      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity ?? 1));
      ctx.globalCompositeOperation = layer.blendMode || "source-over";

      const halfW = Number.isFinite(layer.width) && layer.width > 0 ? layer.width / 2 : 50;
      const halfH = Number.isFinite(layer.height) && layer.height > 0 ? layer.height / 2 : 25;

      // TEXT LAYER
      if (layer.type === "text") {
        drawTextLayer(ctx, layer);
      }
      // IMAGE LAYER
      else if (layer.type === "image") {
        drawImageLayer(ctx, layer, halfW, halfH);
      }
      // SHAPE LAYER
      else if (layer.type === "shape") {
        drawShapeLayer(ctx, layer, halfW, halfH);
      }
      // STICKER LAYER
      else if (layer.type === "sticker") {
        drawStickerLayer(ctx, layer, halfW, halfH);
      }

      ctx.restore();
    });

    // 3. Draw Canvas-Wide Texture Overlays
    renderCanvasOverlays(ctx, w, h);

    // 4. Draw Overlay Canvas (Selection Box, Handles, Snap Guides)
    renderOverlayCanvas();
  }

  // Draw Text Layer
  function drawTextLayer(tctx, layer) {
    const text = layer.text || "";
    const fontSize = Number(layer.fontSize) || 48;
    const fontFamily = layer.fontFamily || "Sora";
    const fontWeight = layer.fontWeight || "700";

    tctx.font = `${fontWeight} ${fontSize}px '${fontFamily}', sans-serif`;
    tctx.textAlign = layer.textAlign || "center";
    tctx.textBaseline = "middle";

    // Measure text to dynamically fit bounding box if needed
    const metrics = tctx.measureText(text);
    const measuredW = Math.max(30, (metrics.width || 0) + 24);
    const measuredH = Math.max(20, fontSize * (layer.lineHeight || 1.15));
    layer.width = Math.max(Number(layer.width) || 0, measuredW);
    layer.height = Math.max(Number(layer.height) || 0, measuredH);

    const halfW = Math.max(15, layer.width / 2);
    const halfH = Math.max(10, layer.height / 2);

    // Pill Badge Background
    if (layer.badgeEnabled) {
      tctx.save();
      tctx.fillStyle = layer.badgeColor || "rgba(200, 16, 36, 0.9)";
      const padX = layer.badgePadding || 14;
      const padY = (layer.badgePadding || 14) * 0.6;
      const bw = metrics.width + padX * 2;
      const bh = fontSize + padY * 2;
      const r = layer.badgeRadius || 999;

      tctx.beginPath();
      tctx.roundRect(-bw / 2, -bh / 2, bw, bh, r);
      tctx.fill();
      tctx.restore();
    }

    // Drop Shadow
    if (layer.shadowBlur > 0) {
      tctx.shadowColor = layer.shadowColor || "rgba(0,0,0,0.85)";
      tctx.shadowBlur = layer.shadowBlur;
      tctx.shadowOffsetX = layer.shadowOffsetX || 0;
      tctx.shadowOffsetY = layer.shadowOffsetY || 4;
    }

    // Finishes (Chrome, Crimson Glow, Brushed Silver)
    let fill = layer.color || "#FCF6F5";
    if (layer.finish === "chrome") {
      const grad = tctx.createLinearGradient(0, -halfH, 0, halfH);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, "#e2e6f0");
      grad.addColorStop(0.5, "#485265");
      grad.addColorStop(0.7, "#a9b4c8");
      grad.addColorStop(1, "#f8fafc");
      fill = grad;
    } else if (layer.finish === "crimson_glow") {
      tctx.shadowColor = "#e72238";
      tctx.shadowBlur = 24;
      fill = "#ffffff";
    } else if (layer.finish === "silver") {
      const grad = tctx.createLinearGradient(-halfW, 0, halfW, 0);
      grad.addColorStop(0, "#a0a5b2");
      grad.addColorStop(0.5, "#f1f3f8");
      grad.addColorStop(1, "#a0a5b2");
      fill = grad;
    }

    // Stroke Outline
    if (layer.strokeWidth > 0) {
      tctx.lineWidth = layer.strokeWidth;
      tctx.strokeStyle = layer.strokeColor || "#c81024";
      tctx.strokeText(text, 0, 0);
    }

    tctx.fillStyle = fill;
    tctx.fillText(text, 0, 0);
  }

  // Draw Image Layer
  function drawImageLayer(ictx, layer, halfW, halfH) {
    if (!layer.img && layer.src) {
      layer.img = new Image();
      layer.img.crossOrigin = "anonymous";
      layer.img.onload = () => render();
      layer.img.src = layer.src;
      return;
    }
    if (!layer.img || !layer.img.complete || !layer.img.naturalWidth) return;

    ictx.save();

    // Flip H / V
    ictx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);

    // Rounded Corners Clipping Path
    if (layer.borderRadius > 0) {
      ictx.beginPath();
      ictx.roundRect(-halfW, -halfH, layer.width, layer.height, layer.borderRadius);
      ictx.clip();
    }

    // Image Filters
    const b = layer.brightness ?? 100;
    const c = layer.contrast ?? 100;
    const s = layer.saturation ?? 100;
    const g = layer.grayscale ?? 0;
    const inv = layer.invert ?? 0;
    const blr = layer.blur ?? 0;

    ictx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) invert(${inv}%) blur(${blr}px)`;

    ictx.drawImage(layer.img, -halfW, -halfH, layer.width, layer.height);

    // Crimson Duotone Filter
    if (layer.crimsonDuotone) {
      ictx.filter = "none";
      ictx.globalCompositeOperation = "color";
      ictx.fillStyle = "#c81024";
      ictx.fillRect(-halfW, -halfH, layer.width, layer.height);
      ictx.globalCompositeOperation = "multiply";
      ictx.fillStyle = "rgba(100, 10, 20, 0.4)";
      ictx.fillRect(-halfW, -halfH, layer.width, layer.height);
    }

    ictx.restore();
  }

  // Draw Shape Layer
  function drawShapeLayer(sctx, layer, rawHalfW, rawHalfH) {
    sctx.save();
    const halfW = Number.isFinite(rawHalfW) && rawHalfW > 0 ? rawHalfW : Math.max(10, (layer.width || 100) / 2);
    const halfH = Number.isFinite(rawHalfH) && rawHalfH > 0 ? rawHalfH : Math.max(10, (layer.height || 100) / 2);
    const st = layer.shapeType || "rectangle";
    const r = layer.borderRadius || 0;

    // Fill style
    let fill = layer.fillColor || "#c81024";
    if (layer.fillType === "crimson_gradient") {
      const grad = sctx.createLinearGradient(0, -halfH, 0, halfH);
      grad.addColorStop(0, "#e72238");
      grad.addColorStop(1, "#7d0e1b");
      fill = grad;
    } else if (layer.fillType === "chrome_gradient") {
      const grad = sctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, "#485265");
      grad.addColorStop(1, "#c5cedd");
      fill = grad;
    } else if (layer.fillType === "none") {
      fill = "transparent";
    }
    sctx.fillStyle = fill;

    sctx.strokeStyle = layer.strokeColor || "#ffffff";
    sctx.lineWidth = layer.strokeWidth || 0;

    if (st === "rectangle") {
      sctx.beginPath();
      sctx.rect(-halfW, -halfH, layer.width, layer.height);
      if (fill !== "transparent") sctx.fill();
      if (layer.strokeWidth > 0) sctx.stroke();
    } else if (st === "rounded_card" || st === "pill") {
      sctx.beginPath();
      const radius = st === "pill" ? Math.min(halfW, halfH) : (r || 16);
      sctx.roundRect(-halfW, -halfH, layer.width, layer.height, radius);
      if (fill !== "transparent") sctx.fill();
      if (layer.strokeWidth > 0) sctx.stroke();
    } else if (st === "circle") {
      sctx.beginPath();
      sctx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
      if (fill !== "transparent") sctx.fill();
      if (layer.strokeWidth > 0) sctx.stroke();
    } else if (st === "line") {
      sctx.beginPath();
      sctx.moveTo(-halfW, 0);
      sctx.lineTo(halfW, 0);
      sctx.lineWidth = Math.max(2, layer.strokeWidth || 3);
      sctx.stroke();
    } else if (st === "arrow") {
      sctx.beginPath();
      sctx.moveTo(-halfW, 0);
      sctx.lineTo(halfW - 14, 0);
      sctx.lineWidth = Math.max(2, layer.strokeWidth || 3);
      sctx.stroke();
      sctx.beginPath();
      sctx.moveTo(halfW - 16, -10);
      sctx.lineTo(halfW, 0);
      sctx.lineTo(halfW - 16, 10);
      sctx.stroke();
    } else if (st === "starburst") {
      const points = 8;
      const innerR = Math.min(halfW, halfH) * 0.45;
      const outerR = Math.min(halfW, halfH);
      sctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const rad = (i * Math.PI) / points - Math.PI / 2;
        const dist = i % 2 === 0 ? outerR : innerR;
        const px = Math.cos(rad) * dist;
        const py = Math.sin(rad) * dist;
        if (i === 0) sctx.moveTo(px, py);
        else sctx.lineTo(px, py);
      }
      sctx.closePath();
      if (fill !== "transparent") sctx.fill();
      if (layer.strokeWidth > 0) sctx.stroke();
    } else if (st === "reticle") {
      const arm = Math.min(halfW, halfH) * 0.35;
      sctx.lineWidth = Math.max(2, layer.strokeWidth || 2.5);
      sctx.strokeStyle = layer.strokeColor || "#c81024";
      // TL
      sctx.beginPath(); sctx.moveTo(-halfW + arm, -halfH); sctx.lineTo(-halfW, -halfH); sctx.lineTo(-halfW, -halfH + arm); sctx.stroke();
      // TR
      sctx.beginPath(); sctx.moveTo(halfW - arm, -halfH); sctx.lineTo(halfW, -halfH); sctx.lineTo(halfW, -halfH + arm); sctx.stroke();
      // BR
      sctx.beginPath(); sctx.moveTo(halfW - arm, halfH); sctx.lineTo(halfW, halfH); sctx.lineTo(halfW, halfH - arm); sctx.stroke();
      // BL
      sctx.beginPath(); sctx.moveTo(-halfW + arm, halfH); sctx.lineTo(-halfW, halfH); sctx.lineTo(-halfW, halfH - arm); sctx.stroke();
    } else if (st === "grid_block") {
      const cols = 5;
      const rows = 4;
      const stepX = layer.width / (cols - 1);
      const stepY = layer.height / (rows - 1);
      sctx.fillStyle = layer.fillColor || "#ffffff";
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          sctx.beginPath();
          sctx.arc(-halfW + i * stepX, -halfH + j * stepY, 2.5, 0, Math.PI * 2);
          sctx.fill();
        }
      }
    } else if (st === "barcode") {
      sctx.fillStyle = layer.fillColor || "#ffffff";
      const totalBars = 32;
      const barW = layer.width / totalBars;
      for (let i = 0; i < totalBars; i++) {
        const thickness = (i % 3 === 0 || i % 7 === 0) ? barW * 0.8 : barW * 0.35;
        sctx.fillRect(-halfW + i * barW, -halfH, thickness, layer.height * 0.8);
      }
      sctx.font = `600 ${Math.max(10, layer.height * 0.16)}px 'IBM Plex Mono', monospace`;
      sctx.textAlign = "center";
      sctx.textBaseline = "bottom";
      sctx.fillText("MASSYNE // LAB 2026", 0, halfH);
    } else if (st === "glow_orb") {
      const grad = sctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(halfW, halfH));
      grad.addColorStop(0, layer.fillColor || "rgba(200, 16, 36, 0.85)");
      grad.addColorStop(0.5, "rgba(200, 16, 36, 0.3)");
      grad.addColorStop(1, "rgba(200, 16, 36, 0)");
      sctx.fillStyle = grad;
      sctx.beginPath();
      sctx.arc(0, 0, Math.min(halfW, halfH), 0, Math.PI * 2);
      sctx.fill();
    }

    sctx.restore();
  }

  // Draw Sticker Layer
  function drawStickerLayer(sctx, layer, halfW, halfH) {
    if (!layer.stickerImg && layer.stickerSvg) {
      const img = new Image();
      img.src = "data:image/svg+xml;utf8," + encodeURIComponent(layer.stickerSvg);
      img.onload = () => render();
      layer.stickerImg = img;
      return;
    }
    if (layer.stickerImg && layer.stickerImg.complete) {
      sctx.drawImage(layer.stickerImg, -halfW, -halfH, layer.width, layer.height);
    }
  }

  // Canvas-Wide Texture Overlays
  function renderCanvasOverlays(octxRef, w, h) {
    const ov = state.overlays;

    // 1. Film Grain
    if (ov.grain) {
      octxRef.save();
      const patternCanvas = getNoisePattern();
      const pat = octxRef.createPattern(patternCanvas, "repeat");
      octxRef.globalAlpha = (ov.grainDensity || 45) / 100 * 0.35;
      octxRef.globalCompositeOperation = "screen";
      octxRef.fillStyle = pat;
      octxRef.fillRect(0, 0, w, h);
      octxRef.restore();
    }

    // 2. Folded Paper Creases
    if (ov.creases) {
      octxRef.save();
      const alpha = (ov.creasesIntensity || 65) / 100 * 0.45;
      octxRef.globalAlpha = alpha;
      octxRef.strokeStyle = "rgba(255, 255, 255, 0.4)";
      octxRef.lineWidth = 1.8;
      // Horizontal cross-fold
      octxRef.beginPath(); octxRef.moveTo(0, h / 2); octxRef.lineTo(w, h / 2); octxRef.stroke();
      // Vertical cross-fold
      octxRef.beginPath(); octxRef.moveTo(w / 2, 0); octxRef.lineTo(w / 2, h); octxRef.stroke();
      // Shadow complement
      octxRef.strokeStyle = "rgba(0, 0, 0, 0.6)";
      octxRef.lineWidth = 2.2;
      octxRef.beginPath(); octxRef.moveTo(0, h / 2 + 2); octxRef.lineTo(w, h / 2 + 2); octxRef.stroke();
      octxRef.beginPath(); octxRef.moveTo(w / 2 + 2, 0); octxRef.lineTo(w / 2 + 2, h); octxRef.stroke();
      octxRef.restore();
    }

    // 3. Halftone Screen
    if (ov.halftone) {
      octxRef.save();
      octxRef.globalAlpha = (ov.halftoneContrast || 50) / 100 * 0.18;
      octxRef.fillStyle = "#000000";
      const dotSpacing = 8;
      for (let x = 0; x < w; x += dotSpacing) {
        for (let y = 0; y < h; y += dotSpacing) {
          octxRef.beginPath();
          octxRef.arc(x, y, 1.2, 0, Math.PI * 2);
          octxRef.fill();
        }
      }
      octxRef.restore();
    }

    // 4. Plastic Gloss
    if (ov.gloss) {
      octxRef.save();
      const alpha = (ov.glossSheen || 60) / 100 * 0.28;
      octxRef.globalAlpha = alpha;
      const grad = octxRef.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      grad.addColorStop(0.3, "rgba(255, 255, 255, 0.0)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
      grad.addColorStop(0.7, "rgba(255, 255, 255, 0.0)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.45)");
      octxRef.fillStyle = grad;
      octxRef.fillRect(0, 0, w, h);
      octxRef.restore();
    }

    // 5. CRT Scanlines
    if (ov.scanlines) {
      octxRef.save();
      octxRef.globalAlpha = (ov.scanlinesOpacity || 35) / 100 * 0.22;
      octxRef.fillStyle = "rgba(0, 0, 0, 0.75)";
      for (let y = 0; y < h; y += 4) {
        octxRef.fillRect(0, y, w, 1.5);
      }
      octxRef.restore();
    }

    // 6. Dark Radial Vignette
    if (ov.vignette) {
      octxRef.save();
      const alpha = (ov.vignetteIntensity || 50) / 100 * 0.75;
      const vgrad = octxRef.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
      vgrad.addColorStop(0, "rgba(0, 0, 0, 0)");
      vgrad.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
      octxRef.fillStyle = vgrad;
      octxRef.fillRect(0, 0, w, h);
      octxRef.restore();
    }
  }

  // ==========================================================================
  // OVERLAY CANVAS (SELECTION BOUNDING BOX, 8 HANDLES, ROTATION & SNAP GUIDES)
  // ==========================================================================
  function renderOverlayCanvas() {
    octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // 1. Draw Magnetic Snap Guides
    if (state.snapGuides.x !== null) {
      octx.save();
      octx.strokeStyle = "#e72238";
      octx.lineWidth = 1.5;
      octx.setLineDash([4, 4]);
      octx.shadowColor = "rgba(231, 34, 56, 0.8)";
      octx.shadowBlur = 6;
      octx.beginPath();
      octx.moveTo(state.snapGuides.x, 0);
      octx.lineTo(state.snapGuides.x, overlayCanvas.height);
      octx.stroke();
      octx.restore();
    }
    if (state.snapGuides.y !== null) {
      octx.save();
      octx.strokeStyle = "#e72238";
      octx.lineWidth = 1.5;
      octx.setLineDash([4, 4]);
      octx.shadowColor = "rgba(231, 34, 56, 0.8)";
      octx.shadowBlur = 6;
      octx.beginPath();
      octx.moveTo(0, state.snapGuides.y);
      octx.lineTo(overlayCanvas.width, state.snapGuides.y);
      octx.stroke();
      octx.restore();
    }

    // 2. Draw Selection Bounding Box & 8 Handles
    const selected = state.layers.find(l => l.id === state.selectedId && l.visible);
    if (!selected) return;

    octx.save();
    octx.translate(selected.x, selected.y);
    octx.rotate((selected.rotation * Math.PI) / 180);

    const halfW = selected.width / 2;
    const halfH = selected.height / 2;

    // Bounding Box
    octx.strokeStyle = "#c81024";
    octx.lineWidth = 1.5;
    octx.strokeRect(-halfW, -halfH, selected.width, selected.height);

    // Rotation Handle Stalk & Knob
    octx.beginPath();
    octx.moveTo(0, -halfH);
    octx.lineTo(0, -halfH - 24);
    octx.stroke();

    octx.fillStyle = "#ffffff";
    octx.strokeStyle = "#c81024";
    octx.lineWidth = 2;
    octx.beginPath();
    octx.arc(0, -halfH - 24, 5, 0, Math.PI * 2);
    octx.fill();
    octx.stroke();

    // 8 Resize Handles
    const handleSize = 8;
    const halfS = handleSize / 2;
    const handlePositions = [
      { id: "nw", x: -halfW, y: -halfH },
      { id: "n",  x: 0,      y: -halfH },
      { id: "ne", x: halfW,  y: -halfH },
      { id: "e",  x: halfW,  y: 0 },
      { id: "se", x: halfW,  y: halfH },
      { id: "s",  x: 0,      y: halfH },
      { id: "sw", x: -halfW, y: halfH },
      { id: "w",  x: -halfW, y: 0 }
    ];

    handlePositions.forEach(h => {
      octx.fillStyle = "#ffffff";
      octx.strokeStyle = "#c81024";
      octx.lineWidth = 1.5;
      octx.fillRect(h.x - halfS, h.y - halfS, handleSize, handleSize);
      octx.strokeRect(h.x - halfS, h.y - halfS, handleSize, handleSize);
    });

    octx.restore();
  }

  // ==========================================================================
  // DIRECT CANVAS MANIPULATION & HIT TESTING (CANVA UX)
  // ==========================================================================
  let dragMode = null; // "move" | "rotate" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"
  let dragStart = { x: 0, y: 0, layerX: 0, layerY: 0, layerW: 0, layerH: 0, layerRot: 0 };

  function screenToCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function hitTest(x, y) {
    // 1. Check active selection handles first
    const selected = state.layers.find(l => l.id === state.selectedId && l.visible && !l.locked);
    if (selected) {
      const dx = x - selected.x;
      const dy = y - selected.y;
      const rad = (-selected.rotation * Math.PI) / 180;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

      const halfW = selected.width / 2;
      const halfH = selected.height / 2;
      const tol = 12;

      // Rotation handle
      if (Math.hypot(lx - 0, ly - (-halfH - 24)) <= tol) return { handle: "rotate", layer: selected };

      // 8 Resize handles
      if (Math.abs(lx - (-halfW)) <= tol && Math.abs(ly - (-halfH)) <= tol) return { handle: "nw", layer: selected };
      if (Math.abs(lx - halfW) <= tol && Math.abs(ly - (-halfH)) <= tol) return { handle: "ne", layer: selected };
      if (Math.abs(lx - halfW) <= tol && Math.abs(ly - halfH) <= tol) return { handle: "se", layer: selected };
      if (Math.abs(lx - (-halfW)) <= tol && Math.abs(ly - halfH) <= tol) return { handle: "sw", layer: selected };

      if (Math.abs(lx - 0) <= tol && Math.abs(ly - (-halfH)) <= tol) return { handle: "n", layer: selected };
      if (Math.abs(lx - halfW) <= tol && Math.abs(ly - 0) <= tol) return { handle: "e", layer: selected };
      if (Math.abs(lx - 0) <= tol && Math.abs(ly - halfH) <= tol) return { handle: "s", layer: selected };
      if (Math.abs(lx - (-halfW)) <= tol && Math.abs(ly - 0) <= tol) return { handle: "w", layer: selected };

      // Body of selected
      if (lx >= -halfW && lx <= halfW && ly >= -halfH && ly <= halfH) return { handle: "move", layer: selected };
    }

    // 2. Hit test layers top-to-bottom
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const l = state.layers[i];
      if (!l.visible || l.locked) continue;

      const dx = x - l.x;
      const dy = y - l.y;
      const rad = (-l.rotation * Math.PI) / 180;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

      const halfW = l.width / 2;
      const halfH = l.height / 2;
      if (lx >= -halfW && lx <= halfW && ly >= -halfH && ly <= halfH) {
        return { handle: "move", layer: l };
      }
    }

    return null;
  }

  // Pointer Down
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const pt = screenToCanvas(event.clientX, event.clientY);
    const hit = hitTest(pt.x, pt.y);

    if (hit) {
      if (state.selectedId !== hit.layer.id) {
        selectLayer(hit.layer.id);
      }
      dragMode = hit.handle;
      dragStart = {
        x: pt.x,
        y: pt.y,
        layerX: hit.layer.x,
        layerY: hit.layer.y,
        layerW: hit.layer.width,
        layerH: hit.layer.height,
        layerRot: hit.layer.rotation
      };
      try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
    } else {
      selectLayer(null);
    }
  });

  // Pointer Move
  canvas.addEventListener("pointermove", event => {
    const pt = screenToCanvas(event.clientX, event.clientY);

    // When NOT dragging, update cursor style
    if (!dragMode) {
      const hit = hitTest(pt.x, pt.y);
      if (!hit) {
        canvas.style.cursor = "default";
      } else if (hit.handle === "move") {
        canvas.style.cursor = "move";
      } else if (hit.handle === "rotate") {
        canvas.style.cursor = "crosshair";
      } else if (["nw", "se"].includes(hit.handle)) {
        canvas.style.cursor = "nwse-resize";
      } else if (["ne", "sw"].includes(hit.handle)) {
        canvas.style.cursor = "nesw-resize";
      } else if (["n", "s"].includes(hit.handle)) {
        canvas.style.cursor = "ns-resize";
      } else if (["e", "w"].includes(hit.handle)) {
        canvas.style.cursor = "ew-resize";
      }
      return;
    }

    const selected = state.layers.find(l => l.id === state.selectedId);
    if (!selected) return;

    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;

    // 1. Move Element with Magnetic Snap Guides
    if (dragMode === "move") {
      let nextX = dragStart.layerX + dx;
      let nextY = dragStart.layerY + dy;

      state.snapGuides.x = null;
      state.snapGuides.y = null;

      const snapDist = 9;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Center snap
      if (Math.abs(nextX - centerX) < snapDist) {
        nextX = centerX;
        state.snapGuides.x = centerX;
      }
      if (Math.abs(nextY - centerY) < snapDist) {
        nextY = centerY;
        state.snapGuides.y = centerY;
      }

      // Margin snap (10% bounds)
      const marginX = canvas.width * 0.1;
      const marginY = canvas.height * 0.1;
      if (Math.abs(nextX - marginX) < snapDist) { nextX = marginX; state.snapGuides.x = marginX; }
      if (Math.abs(nextX - (canvas.width - marginX)) < snapDist) { nextX = canvas.width - marginX; state.snapGuides.x = canvas.width - marginX; }
      if (Math.abs(nextY - marginY) < snapDist) { nextY = marginY; state.snapGuides.y = marginY; }
      if (Math.abs(nextY - (canvas.height - marginY)) < snapDist) { nextY = canvas.height - marginY; state.snapGuides.y = canvas.height - marginY; }

      selected.x = Math.round(nextX);
      selected.y = Math.round(nextY);
      render();
    }
    // 2. Rotate Element
    else if (dragMode === "rotate") {
      const angleRad = Math.atan2(pt.y - selected.y, pt.x - selected.x);
      let deg = Math.round((angleRad * 180) / Math.PI + 90);
      if (event.shiftKey) deg = Math.round(deg / 15) * 15; // snap 15 deg
      selected.rotation = ((deg % 360) + 360) % 360;
      render();
    }
    // 3. Resize Handles
    else if (["nw", "ne", "se", "sw", "n", "e", "s", "w"].includes(dragMode)) {
      const rad = (-selected.rotation * Math.PI) / 180;
      const ldx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ldy = dx * Math.sin(rad) + dy * Math.cos(rad);

      let newW = dragStart.layerW;
      let newH = dragStart.layerH;

      const isCorner = ["nw", "ne", "se", "sw"].includes(dragMode);
      const aspect = dragStart.layerW / dragStart.layerH;

      if (dragMode === "se") {
        newW = Math.max(30, dragStart.layerW + ldx * 2);
        newH = isCorner && !event.shiftKey ? newW / aspect : Math.max(20, dragStart.layerH + ldy * 2);
      } else if (dragMode === "sw") {
        newW = Math.max(30, dragStart.layerW - ldx * 2);
        newH = isCorner && !event.shiftKey ? newW / aspect : Math.max(20, dragStart.layerH + ldy * 2);
      } else if (dragMode === "ne") {
        newW = Math.max(30, dragStart.layerW + ldx * 2);
        newH = isCorner && !event.shiftKey ? newW / aspect : Math.max(20, dragStart.layerH - ldy * 2);
      } else if (dragMode === "nw") {
        newW = Math.max(30, dragStart.layerW - ldx * 2);
        newH = isCorner && !event.shiftKey ? newW / aspect : Math.max(20, dragStart.layerH - ldy * 2);
      } else if (dragMode === "e") {
        newW = Math.max(30, dragStart.layerW + ldx * 2);
      } else if (dragMode === "w") {
        newW = Math.max(30, dragStart.layerW - ldx * 2);
      } else if (dragMode === "s") {
        newH = Math.max(20, dragStart.layerH + ldy * 2);
      } else if (dragMode === "n") {
        newH = Math.max(20, dragStart.layerH - ldy * 2);
      }

      selected.width = Math.round(newW);
      selected.height = Math.round(newH);
      render();
    }
  });

  // Pointer Up
  function endDrag(event) {
    if (dragMode) {
      pushHistory("Transform Layer");
      dragMode = null;
      state.snapGuides.x = null;
      state.snapGuides.y = null;
      render();
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      } catch (_) {}
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // Selection
  function selectLayer(id) {
    state.selectedId = id;
    render();
    renderLayersList();
    renderContextInspector();
  }

  // ==========================================================================
  // CONTEXT INSPECTOR & LAYERS STACK UI
  // ==========================================================================
  function renderContextInspector() {
    if (!contextInspectorBody) return;
    const selected = state.layers.find(l => l.id === state.selectedId);

    // 1. When NO layer is selected: Show Canvas Properties
    if (!selected) {
      contextInspectorBody.innerHTML = `
        <div class="inspector-section">
          <div class="inspector-section-title">Canvas Stage</div>
          <div class="inspector-field">
            <label>Dimensions <span>${state.width} × ${state.height}</span></label>
          </div>
          <div class="inspector-field">
            <label>Background Fill</label>
            <input type="color" id="insp-bg-color" value="${state.background.color || "#050608"}">
          </div>
        </div>
        <div class="inspector-section">
          <div class="inspector-section-title">Global Overlays</div>
          <p class="drawer-desc">Toggle texture shaders in the Left Textures tab or customize active overlays.</p>
        </div>
      `;
      const bgInput = document.getElementById("insp-bg-color");
      if (bgInput) {
        bgInput.addEventListener("input", e => {
          state.background.color = e.target.value;
          state.background.type = "color";
          render();
        });
        bgInput.addEventListener("change", () => pushHistory("Change Canvas Background"));
      }
      return;
    }

    // 2. When a Layer is selected: Build Context Properties
    let specificHtml = "";

    // TEXT PROPERTIES
    if (selected.type === "text") {
      specificHtml = `
        <div class="inspector-section">
          <div class="inspector-section-title">Text Content</div>
          <div class="inspector-field">
            <textarea id="insp-text-content" rows="2" style="font-size:0.85rem">${selected.text}</textarea>
          </div>
          <div class="inspector-field">
            <label>Font Family</label>
            <select id="insp-text-font">
              ${["Sora", "Anton", "Bebas Neue", "Inter", "Cinzel", "Syne", "JetBrains Mono", "Space Grotesk", "DM Serif Display", "Oswald", "Montserrat", "Playfair Display", "Orbitron", "IBM Plex Mono"]
                .map(f => `<option value="${f}" ${selected.fontFamily === f ? "selected" : ""}>${f}</option>`).join("")}
            </select>
          </div>
          <div class="inspector-row-2">
            <div class="inspector-field">
              <label>Size <span>${selected.fontSize}px</span></label>
              <input id="insp-text-size" type="range" min="16" max="220" value="${selected.fontSize}">
            </div>
            <div class="inspector-field">
              <label>Weight</label>
              <select id="insp-text-weight">
                <option value="400" ${selected.fontWeight === "400" ? "selected" : ""}>Regular 400</option>
                <option value="600" ${selected.fontWeight === "600" ? "selected" : ""}>Medium 600</option>
                <option value="700" ${selected.fontWeight === "700" ? "selected" : ""}>Bold 700</option>
                <option value="900" ${selected.fontWeight === "900" ? "selected" : ""}>Black 900</option>
              </select>
            </div>
          </div>
          <div class="inspector-row-2">
            <div class="inspector-field">
              <label>Color</label>
              <input id="insp-text-color" type="color" value="${selected.color || "#FCF6F5"}">
            </div>
            <div class="inspector-field">
              <label>Align</label>
              <select id="insp-text-align">
                <option value="left" ${selected.textAlign === "left" ? "selected" : ""}>Left</option>
                <option value="center" ${selected.textAlign === "center" ? "selected" : ""}>Center</option>
                <option value="right" ${selected.textAlign === "right" ? "selected" : ""}>Right</option>
              </select>
            </div>
          </div>
          <div class="inspector-field">
            <label>Finish Effect</label>
            <select id="insp-text-finish">
              <option value="none" ${selected.finish === "none" ? "selected" : ""}>None (Solid)</option>
              <option value="chrome" ${selected.finish === "chrome" ? "selected" : ""}>Liquid Chrome</option>
              <option value="crimson_glow" ${selected.finish === "crimson_glow" ? "selected" : ""}>Crimson Glow</option>
              <option value="silver" ${selected.finish === "silver" ? "selected" : ""}>Brushed Silver</option>
            </select>
          </div>
          <div class="inspector-field">
            <label>Outline Stroke <span>${selected.strokeWidth || 0}px</span></label>
            <input id="insp-text-stroke-w" type="range" min="0" max="16" value="${selected.strokeWidth || 0}">
          </div>
        </div>
      `;
    }
    // IMAGE PROPERTIES
    else if (selected.type === "image") {
      specificHtml = `
        <div class="inspector-section">
          <div class="inspector-section-title">Image Adjustments</div>
          <div class="inspector-row-2">
            <div class="inspector-field">
              <label>Width <span>${selected.width}px</span></label>
              <input id="insp-img-w" type="range" min="50" max="1600" value="${selected.width}">
            </div>
            <div class="inspector-field">
              <label>Radius <span>${selected.borderRadius || 0}px</span></label>
              <input id="insp-img-radius" type="range" min="0" max="100" value="${selected.borderRadius || 0}">
            </div>
          </div>
          <div class="inspector-field">
            <label>Brightness <span>${selected.brightness ?? 100}%</span></label>
            <input id="insp-img-brightness" type="range" min="20" max="180" value="${selected.brightness ?? 100}">
          </div>
          <div class="inspector-field">
            <label>Contrast <span>${selected.contrast ?? 100}%</span></label>
            <input id="insp-img-contrast" type="range" min="20" max="180" value="${selected.contrast ?? 100}">
          </div>
          <div class="inspector-row-2">
            <button id="insp-img-duotone" type="button" class="secondary-btn" style="width:100%">
              ${selected.crimsonDuotone ? "✓ Crimson Duotone" : "Crimson Duotone"}
            </button>
            <button id="insp-img-fliph" type="button" class="secondary-btn" style="width:100%">Flip H</button>
          </div>
        </div>
      `;
    }
    // SHAPE PROPERTIES
    else if (selected.type === "shape") {
      specificHtml = `
        <div class="inspector-section">
          <div class="inspector-section-title">Shape Properties</div>
          <div class="inspector-row-2">
            <div class="inspector-field">
              <label>Fill Color</label>
              <input id="insp-shape-fill" type="color" value="${selected.fillColor || "#c81024"}">
            </div>
            <div class="inspector-field">
              <label>Stroke Color</label>
              <input id="insp-shape-stroke" type="color" value="${selected.strokeColor || "#ffffff"}">
            </div>
          </div>
          <div class="inspector-field">
            <label>Stroke Width <span>${selected.strokeWidth || 0}px</span></label>
            <input id="insp-shape-stroke-w" type="range" min="0" max="24" value="${selected.strokeWidth || 0}">
          </div>
          <div class="inspector-field">
            <label>Corner Radius <span>${selected.borderRadius || 0}px</span></label>
            <input id="insp-shape-radius" type="range" min="0" max="100" value="${selected.borderRadius || 0}">
          </div>
        </div>
      `;
    }

    // Common Transformation & Appearance Section
    contextInspectorBody.innerHTML = `
      <!-- Quick Action Toolbar -->
      <div class="layer-quick-actions">
        <button id="btn-quick-dup" type="button" title="Duplicate (Ctrl+D)">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button id="btn-quick-lock" type="button" title="${selected.locked ? "Unlock" : "Lock"}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </button>
        <button id="btn-quick-del" type="button" class="danger" title="Delete (Del)">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>

      ${specificHtml}

      <div class="inspector-section">
        <div class="inspector-section-title">Transform &amp; Blending</div>
        <div class="inspector-row-2">
          <div class="inspector-field">
            <label>Opacity <span>${Math.round((selected.opacity ?? 1) * 100)}%</span></label>
            <input id="insp-opacity" type="range" min="5" max="100" value="${Math.round((selected.opacity ?? 1) * 100)}">
          </div>
          <div class="inspector-field">
            <label>Rotation <span>${selected.rotation}°</span></label>
            <input id="insp-rotation" type="range" min="0" max="360" value="${selected.rotation}">
          </div>
        </div>
        <div class="inspector-field">
          <label>Blend Mode</label>
          <select id="insp-blend-mode">
            ${["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "difference"]
              .map(bm => `<option value="${bm}" ${selected.blendMode === bm ? "selected" : ""}>${bm.toUpperCase()}</option>`).join("")}
          </select>
        </div>
      </div>
    `;

    // Wire Up Inspector Inputs
    document.getElementById("btn-quick-dup")?.addEventListener("click", duplicateSelected);
    document.getElementById("btn-quick-del")?.addEventListener("click", deleteSelected);
    document.getElementById("btn-quick-lock")?.addEventListener("click", () => {
      selected.locked = !selected.locked;
      pushHistory("Toggle Lock");
      render();
      renderLayersList();
      renderContextInspector();
    });

    // Opacity
    document.getElementById("insp-opacity")?.addEventListener("input", e => {
      selected.opacity = parseInt(e.target.value, 10) / 100;
      render();
    });
    document.getElementById("insp-opacity")?.addEventListener("change", () => pushHistory("Change Opacity"));

    // Rotation
    document.getElementById("insp-rotation")?.addEventListener("input", e => {
      selected.rotation = parseInt(e.target.value, 10);
      render();
    });
    document.getElementById("insp-rotation")?.addEventListener("change", () => pushHistory("Change Rotation"));

    // Blend Mode
    document.getElementById("insp-blend-mode")?.addEventListener("change", e => {
      selected.blendMode = e.target.value;
      pushHistory("Change Blend Mode");
      render();
    });

    // Text Wireups
    if (selected.type === "text") {
      document.getElementById("insp-text-content")?.addEventListener("input", e => {
        selected.text = e.target.value;
        render();
        renderLayersList();
      });
      document.getElementById("insp-text-content")?.addEventListener("change", () => pushHistory("Edit Text Content"));

      document.getElementById("insp-text-font")?.addEventListener("change", e => {
        selected.fontFamily = e.target.value;
        pushHistory("Change Font");
        render();
      });
      document.getElementById("insp-text-size")?.addEventListener("input", e => {
        selected.fontSize = parseInt(e.target.value, 10);
        render();
      });
      document.getElementById("insp-text-size")?.addEventListener("change", () => pushHistory("Change Font Size"));

      document.getElementById("insp-text-weight")?.addEventListener("change", e => {
        selected.fontWeight = e.target.value;
        pushHistory("Change Font Weight");
        render();
      });
      document.getElementById("insp-text-color")?.addEventListener("input", e => {
        selected.color = e.target.value;
        render();
      });
      document.getElementById("insp-text-color")?.addEventListener("change", () => pushHistory("Change Text Color"));

      document.getElementById("insp-text-align")?.addEventListener("change", e => {
        selected.textAlign = e.target.value;
        pushHistory("Change Alignment");
        render();
      });
      document.getElementById("insp-text-finish")?.addEventListener("change", e => {
        selected.finish = e.target.value;
        pushHistory("Change Text Finish");
        render();
      });
      document.getElementById("insp-text-stroke-w")?.addEventListener("input", e => {
        selected.strokeWidth = parseInt(e.target.value, 10);
        render();
      });
      document.getElementById("insp-text-stroke-w")?.addEventListener("change", () => pushHistory("Change Text Stroke"));
    }
    // Image Wireups
    else if (selected.type === "image") {
      document.getElementById("insp-img-w")?.addEventListener("input", e => {
        const aspect = selected.naturalWidth / selected.naturalHeight || 1;
        selected.width = parseInt(e.target.value, 10);
        selected.height = Math.round(selected.width / aspect);
        render();
      });
      document.getElementById("insp-img-w")?.addEventListener("change", () => pushHistory("Resize Image"));

      document.getElementById("insp-img-radius")?.addEventListener("input", e => {
        selected.borderRadius = parseInt(e.target.value, 10);
        render();
      });
      document.getElementById("insp-img-brightness")?.addEventListener("input", e => {
        selected.brightness = parseInt(e.target.value, 10);
        render();
      });
      document.getElementById("insp-img-contrast")?.addEventListener("input", e => {
        selected.contrast = parseInt(e.target.value, 10);
        render();
      });
      document.getElementById("insp-img-duotone")?.addEventListener("click", () => {
        selected.crimsonDuotone = !selected.crimsonDuotone;
        pushHistory("Toggle Duotone");
        render();
        renderContextInspector();
      });
      document.getElementById("insp-img-fliph")?.addEventListener("click", () => {
        selected.flipH = !selected.flipH;
        pushHistory("Flip Image");
        render();
      });
    }
    // Shape Wireups
    else if (selected.type === "shape") {
      document.getElementById("insp-shape-fill")?.addEventListener("input", e => {
        selected.fillColor = e.target.value;
        selected.fillType = "solid";
        render();
      });
      document.getElementById("insp-shape-stroke")?.addEventListener("input", e => {
        selected.strokeColor = e.target.value;
        render();
      });
      document.getElementById("insp-shape-stroke-w")?.addEventListener("input", e => {
        selected.strokeWidth = parseInt(e.target.value, 10);
        render();
      });
      document.getElementById("insp-shape-radius")?.addEventListener("input", e => {
        selected.borderRadius = parseInt(e.target.value, 10);
        render();
      });
    }
  }

  // Render Layers Manager List
  function renderLayersList() {
    if (!layersStackList) return;
    layersStackList.innerHTML = "";
    if (layersBadge) layersBadge.textContent = String(state.layers.length);

    const reversed = [...state.layers].reverse(); // top-most first in list

    reversed.forEach(layer => {
      const isSel = layer.id === state.selectedId;
      const row = document.createElement("div");
      row.className = `layer-item-row ${isSel ? "is-selected" : ""}`;

      let typeBadge = "T";
      if (layer.type === "image") typeBadge = "IMG";
      if (layer.type === "shape") typeBadge = "SHP";
      if (layer.type === "sticker") typeBadge = "STK";

      let name = layer.name || layer.text || "Untitled Layer";
      if (name.length > 20) name = name.substring(0, 18) + "…";

      row.innerHTML = `
        <div class="layer-item-left">
          <span class="layer-type-icon">${typeBadge}</span>
          <span class="layer-name-label">${name}</span>
        </div>
        <div class="layer-item-actions">
          <button class="layer-action-icon-btn ${layer.visible ? "is-active" : ""}" data-layer-act="vis" title="Toggle visibility">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="layer-action-icon-btn ${layer.locked ? "is-active" : ""}" data-layer-act="lock" title="Toggle lock">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </button>
          <button class="layer-action-icon-btn" data-layer-act="del" title="Delete layer">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      `;

      row.addEventListener("click", e => {
        const actBtn = e.target.closest("[data-layer-act]");
        if (actBtn) {
          const act = actBtn.dataset.layerAct;
          if (act === "vis") {
            layer.visible = !layer.visible;
            pushHistory("Toggle Layer Visibility");
          } else if (act === "lock") {
            layer.locked = !layer.locked;
            pushHistory("Toggle Layer Lock");
          } else if (act === "del") {
            state.layers = state.layers.filter(l => l.id !== layer.id);
            if (state.selectedId === layer.id) state.selectedId = null;
            pushHistory("Delete Layer");
          }
          render();
          renderLayersList();
          renderContextInspector();
        } else {
          selectLayer(layer.id);
        }
      });

      layersStackList.appendChild(row);
    });

    // Update Quick Layer Order buttons state
    const selIdx = state.layers.findIndex(l => l.id === state.selectedId);
    if (btnLayerUp) btnLayerUp.disabled = selIdx === -1 || selIdx === state.layers.length - 1;
    if (btnLayerDown) btnLayerDown.disabled = selIdx <= 0;
    if (btnLayerTop) btnLayerTop.disabled = selIdx === -1 || selIdx === state.layers.length - 1;
    if (btnLayerBottom) btnLayerBottom.disabled = selIdx <= 0;
  }

  // Layer Reordering
  function moveLayer(dir) {
    const idx = state.layers.findIndex(l => l.id === state.selectedId);
    if (idx === -1) return;

    if (dir === "up" && idx < state.layers.length - 1) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx + 1];
      state.layers[idx + 1] = temp;
    } else if (dir === "down" && idx > 0) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx - 1];
      state.layers[idx - 1] = temp;
    } else if (dir === "top") {
      const layer = state.layers.splice(idx, 1)[0];
      state.layers.push(layer);
    } else if (dir === "bottom") {
      const layer = state.layers.splice(idx, 1)[0];
      state.layers.unshift(layer);
    }

    pushHistory("Reorder Layer");
    render();
    renderLayersList();
  }

  if (btnLayerUp) btnLayerUp.addEventListener("click", () => moveLayer("up"));
  if (btnLayerDown) btnLayerDown.addEventListener("click", () => moveLayer("down"));
  if (btnLayerTop) btnLayerTop.addEventListener("click", () => moveLayer("top"));
  if (btnLayerBottom) btnLayerBottom.addEventListener("click", () => moveLayer("bottom"));

  // Duplicate Selected
  function duplicateSelected() {
    const orig = state.layers.find(l => l.id === state.selectedId);
    if (!orig) return;

    const copy = {
      ...orig,
      id: uid(),
      name: (orig.name || "Layer") + " Copy",
      x: orig.x + 24,
      y: orig.y + 24
    };
    state.layers.push(copy);
    state.selectedId = copy.id;
    pushHistory("Duplicate Layer");
    render();
    renderLayersList();
    renderContextInspector();
    setStatus(`Duplicated ${copy.name}.`);
  }

  // Delete Selected
  function deleteSelected() {
    if (!state.selectedId) return;
    state.layers = state.layers.filter(l => l.id !== state.selectedId);
    state.selectedId = null;
    pushHistory("Delete Layer");
    render();
    renderLayersList();
    renderContextInspector();
    setStatus("Layer deleted.");
  }

  // ==========================================================================
  // LEFT TOOL RAIL & DRAWER SYSTEM
  // ==========================================================================
  const drawerPanes = {
    templates: document.getElementById("drawer-pane-templates"),
    text: document.getElementById("drawer-pane-text"),
    elements: document.getElementById("drawer-pane-elements"),
    uploads: document.getElementById("drawer-pane-uploads"),
    textures: document.getElementById("drawer-pane-textures"),
    background: document.getElementById("drawer-pane-background")
  };

  function switchDrawerTab(tabKey) {
    document.querySelectorAll(".rail-item").forEach(item => {
      const match = item.dataset.railTab === tabKey;
      item.classList.toggle("is-active", match);
      item.setAttribute("aria-pressed", String(match));
    });

    Object.keys(drawerPanes).forEach(k => {
      if (drawerPanes[k]) drawerPanes[k].hidden = k !== tabKey;
    });

    if (drawerTitle) {
      const titles = {
        templates: "Templates",
        text: "Typography",
        elements: "Elements & Shapes",
        uploads: "Uploads & Artworks",
        textures: "Textures & Shaders",
        background: "Canvas Backdrop"
      };
      drawerTitle.textContent = titles[tabKey] || "Design Tools";
    }

    if (leftDrawer) leftDrawer.classList.remove("is-collapsed");
  }

  document.querySelectorAll(".rail-item").forEach(item => {
    item.addEventListener("click", () => switchDrawerTab(item.dataset.railTab));
  });

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener("click", () => {
      if (leftDrawer) leftDrawer.classList.add("is-collapsed");
      document.querySelectorAll(".rail-item").forEach(i => i.classList.remove("is-active"));
    });
  }

  // Right Inspector Tabs
  if (tabProperties && tabLayers) {
    tabProperties.addEventListener("click", () => {
      tabProperties.classList.add("is-active");
      tabProperties.setAttribute("aria-selected", "true");
      tabLayers.classList.remove("is-active");
      tabLayers.setAttribute("aria-selected", "false");
      if (panelProperties) panelProperties.hidden = false;
      if (panelLayers) panelLayers.hidden = true;
    });
    tabLayers.addEventListener("click", () => {
      tabLayers.classList.add("is-active");
      tabLayers.setAttribute("aria-selected", "true");
      tabProperties.classList.remove("is-active");
      tabProperties.setAttribute("aria-selected", "false");
      if (panelLayers) panelLayers.hidden = false;
      if (panelProperties) panelProperties.hidden = true;
    });
  }

  // ==========================================================================
  // ELEMENT CREATION CONTROLLERS (TEXT, SHAPES, UPLOADS, STICKERS)
  // ==========================================================================
  // Add Text Box
  function addText(type = "heading", presetStyle = "none") {
    let text = "HEADLINE TEXT";
    let fontSize = 72;
    let fontWeight = "800";
    let fontFamily = "Sora";
    let color = "#FCF6F5";
    let finish = presetStyle;
    let letterSpacing = 2;

    if (type === "subheading") {
      text = "EDITORIAL SUBHEADING";
      fontSize = 42;
      fontWeight = "600";
    } else if (type === "body") {
      text = "High performance visual design created with precision in MASSYNE Lab.";
      fontSize = 24;
      fontWeight = "400";
      fontFamily = "Inter";
    } else if (type === "tech") {
      text = "FIG. 001 // ATELIER MOROCCO · 2026";
      fontSize = 18;
      fontWeight = "600";
      fontFamily = "IBM Plex Mono";
      color = "#c81024";
      letterSpacing = 4;
    }

    const layer = {
      id: uid(),
      type: "text",
      name: text.length > 20 ? text.substring(0, 18) + "…" : text,
      text,
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 480,
      height: fontSize * 1.3,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      blendMode: "normal",
      fontSize,
      fontWeight,
      fontFamily,
      textAlign: "center",
      letterSpacing,
      lineHeight: 1.15,
      color,
      finish,
      strokeWidth: 0,
      strokeColor: "#c81024",
      shadowBlur: 0,
      badgeEnabled: presetStyle === "pill_badge",
      badgeColor: "rgba(200, 16, 36, 0.9)"
    };

    state.layers.push(layer);
    selectLayer(layer.id);
    pushHistory("Add Text Layer");
    render();
    setStatus("Added text box to canvas.");
  }

  document.getElementById("btn-add-text-box")?.addEventListener("click", () => addText("heading"));
  document.querySelectorAll("[data-add-text-type]").forEach(btn => {
    btn.addEventListener("click", () => addText(btn.dataset.addTextType));
  });
  document.querySelectorAll("[data-text-style-preset]").forEach(btn => {
    btn.addEventListener("click", () => addText("heading", btn.dataset.textStylePreset));
  });

  // Add Shape
  function addShape(shapeType) {
    let w = 240;
    let h = 240;
    let fill = "#c81024";
    let strokeW = 0;
    let strokeCol = "#ffffff";
    let radius = 0;

    if (shapeType === "rectangle") { w = 320; h = 180; }
    else if (shapeType === "rounded_card") { w = 340; h = 220; fill = "rgba(18, 20, 28, 0.85)"; strokeW = 1.5; strokeCol = "rgba(255,255,255,0.12)"; radius = 16; }
    else if (shapeType === "circle") { w = 220; h = 220; }
    else if (shapeType === "pill") { w = 280; h = 90; fill = "rgba(200, 16, 36, 0.9)"; radius = 999; }
    else if (shapeType === "line") { w = 400; h = 4; strokeW = 3; }
    else if (shapeType === "arrow") { w = 360; h = 30; strokeW = 3; }
    else if (shapeType === "starburst") { w = 220; h = 220; }
    else if (shapeType === "reticle") { w = 320; h = 320; strokeW = 2.5; strokeCol = "#c81024"; fill = "transparent"; }
    else if (shapeType === "barcode") { w = 380; h = 95; fill = "#ffffff"; }
    else if (shapeType === "glow_orb") { w = 320; h = 320; }

    const layer = {
      id: uid(),
      type: "shape",
      shapeType,
      name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1).replace("_", " "),
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      blendMode: "normal",
      fillColor: fill,
      fillType: fill === "transparent" ? "none" : "solid",
      strokeColor: strokeCol,
      strokeWidth: strokeW,
      borderRadius: radius
    };

    state.layers.push(layer);
    selectLayer(layer.id);
    pushHistory(`Add ${layer.name}`);
    render();
    setStatus(`Added ${layer.name} to canvas.`);
  }

  document.querySelectorAll("[data-create-shape]").forEach(btn => {
    btn.addEventListener("click", () => addShape(btn.dataset.createShape));
  });

  // Add Image File
  function addImageLayer(img, name = "Image") {
    const scale = Math.min(1.0, (canvas.width * 0.65) / img.naturalWidth, (canvas.height * 0.65) / img.naturalHeight);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const layer = {
      id: uid(),
      type: "image",
      name,
      img,
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      blendMode: "normal",
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      crimsonDuotone: false,
      invert: 0,
      blur: 0,
      flipH: false,
      flipV: false,
      borderRadius: 0
    };

    state.layers.push(layer);
    selectLayer(layer.id);
    pushHistory(`Add ${name}`);
    render();
    setStatus(`Added ${name} to canvas.`);
  }

  // Local File Upload
  const imageUploadInput = document.getElementById("image-upload-input");
  if (imageUploadInput) {
    imageUploadInput.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => addImageLayer(img, file.name.replace(/\.[^/.]+$/, ""));
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
      imageUploadInput.value = "";
    });
  }

  // Listen for custom event from poster-portfolio.js
  canvas.addEventListener("poster:image-add-direct", event => {
    const d = event.detail;
    if (!d || !d.src) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => addImageLayer(img, d.name || "Portfolio Artwork");
    img.src = d.src;
  });

  // Background Controls
  const bgColorInput = document.getElementById("bg-color-input");
  if (bgColorInput) {
    bgColorInput.addEventListener("input", e => {
      state.background.color = e.target.value;
      state.background.type = "color";
      render();
    });
    bgColorInput.addEventListener("change", () => pushHistory("Set Background Color"));
  }

  document.querySelectorAll("[data-color]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.background.color = btn.dataset.color;
      state.background.type = "color";
      pushHistory("Select Background Swatch");
      render();
    });
  });

  document.querySelectorAll("[data-bg-gradient]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.background.type = "gradient";
      state.background.gradient = btn.dataset.bgGradient;
      pushHistory("Select Background Gradient");
      render();
    });
  });

  document.querySelectorAll("[data-bg-pattern]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-bg-pattern]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.background.pattern = btn.dataset.bgPattern;
      pushHistory("Select Pattern");
      render();
    });
  });

  // Textures / Overlays Controls
  const overlayMap = [
    { key: "grain", toggle: "overlay-grain-toggle", slider: "overlay-grain-slider", prop: "grainDensity" },
    { key: "creases", toggle: "overlay-creases-toggle", slider: "overlay-creases-slider", prop: "creasesIntensity" },
    { key: "halftone", toggle: "overlay-halftone-toggle", slider: "overlay-halftone-slider", prop: "halftoneContrast" },
    { key: "gloss", toggle: "overlay-gloss-toggle", slider: "overlay-gloss-slider", prop: "glossSheen" },
    { key: "scanlines", toggle: "overlay-scanlines-toggle", slider: "overlay-scanlines-slider", prop: "scanlinesOpacity" },
    { key: "vignette", toggle: "overlay-vignette-toggle", slider: "overlay-vignette-slider", prop: "vignetteIntensity" }
  ];

  overlayMap.forEach(item => {
    const t = document.getElementById(item.toggle);
    const s = document.getElementById(item.slider);
    if (t) {
      t.addEventListener("change", () => {
        state.overlays[item.key] = t.checked;
        pushHistory(`Toggle ${item.key}`);
        render();
      });
    }
    if (s) {
      s.addEventListener("input", () => {
        state.overlays[item.prop] = parseInt(s.value, 10);
        render();
      });
    }
  });

  // ==========================================================================
  // STARTER TEMPLATES SYSTEM (6+ DARK LUXURY CANVA TEMPLATES)
  // ==========================================================================
  const TEMPLATES = [
    {
      id: "streetwear_drop",
      name: "Streetwear Drop Poster",
      format: "3:4",
      w: 1080,
      h: 1440,
      background: { type: "gradient", gradient: "obsidian_noir", pattern: "grid" },
      overlays: { grain: true, grainDensity: 45, creases: true, creasesIntensity: 60 },
      layers: [
        { type: "text", text: "MASSYNE // DROP 01", x: 540, y: 140, fontSize: 24, fontFamily: "IBM Plex Mono", fontWeight: "700", color: "#c81024", letterSpacing: 4 },
        { type: "text", text: "OBSIDIAN FLAME", x: 540, y: 230, fontSize: 88, fontFamily: "Anton", fontWeight: "700", color: "#FCF6F5", finish: "chrome" },
        { type: "shape", shapeType: "reticle", x: 540, y: 700, width: 680, height: 680, strokeWidth: 2, strokeColor: "#c81024", fillType: "none" },
        { type: "image", name: "Veiled Sorrow", src: "https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev/images/featured-project.webp", x: 540, y: 700, width: 600, height: 600, naturalWidth: 800, naturalHeight: 800 },
        { type: "shape", shapeType: "barcode", x: 540, y: 1240, width: 440, height: 75, fillColor: "#ffffff" },
        { type: "text", text: "LIMITED RUN · 50 COPIES · 2026 EDITION", x: 540, y: 1350, fontSize: 16, fontFamily: "IBM Plex Mono", fontWeight: "600", color: "#8b92a0", letterSpacing: 3 }
      ]
    },
    {
      id: "album_cover",
      name: "Album Cover 1:1",
      format: "1:1",
      w: 1080,
      h: 1080,
      background: { type: "gradient", gradient: "blood_moon", pattern: "none" },
      overlays: { grain: true, grainDensity: 50, gloss: true, glossSheen: 70 },
      layers: [
        { type: "text", text: "NOCTURNE", x: 540, y: 180, fontSize: 96, fontFamily: "DM Serif Display", fontWeight: "700", color: "#fcf6f5" },
        { type: "image", name: "The Cursed Crown", src: "https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev/images/optimized/work3-1400.webp", x: 540, y: 560, width: 620, height: 620, naturalWidth: 1000, naturalHeight: 1000, borderRadius: 8 },
        { type: "text", text: "ORIGINAL MOTION SOUNDTRACK · MASTER AUDIO", x: 540, y: 920, fontSize: 18, fontFamily: "IBM Plex Mono", fontWeight: "600", color: "#e72238", letterSpacing: 4 },
        { type: "shape", shapeType: "barcode", x: 880, y: 980, width: 220, height: 50, fillColor: "#ffffff" }
      ]
    },
    {
      id: "magazine_cover",
      name: "Editorial Magazine Cover",
      format: "3:4",
      w: 1080,
      h: 1440,
      background: { type: "color", color: "#08090c", pattern: "none" },
      overlays: { grain: true, grainDensity: 40, halftone: true, halftoneContrast: 45 },
      layers: [
        { type: "text", text: "VISUAL", x: 540, y: 160, fontSize: 140, fontFamily: "Playfair Display", fontWeight: "900", color: "#FCF6F5" },
        { type: "text", text: "ISSUE 04 // AUTUMN 2026", x: 540, y: 270, fontSize: 20, fontFamily: "IBM Plex Mono", fontWeight: "600", color: "#c81024", letterSpacing: 4 },
        { type: "image", name: "The Queen", src: "https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev/images/optimized/work4-1400.webp", x: 540, y: 780, width: 780, height: 780, naturalWidth: 1000, naturalHeight: 1000 },
        { type: "text", text: "THE ANATOMY OF FORM", x: 280, y: 1200, fontSize: 34, fontFamily: "Sora", fontWeight: "800", color: "#ffffff", textAlign: "left" },
        { type: "text", text: "Dark fantasy in contemporary underground culture.", x: 280, y: 1250, fontSize: 20, fontFamily: "Inter", fontWeight: "400", color: "#8b92a0", textAlign: "left" }
      ]
    },
    {
      id: "story_promo",
      name: "Story / Reel Promo 9:16",
      format: "9:16",
      w: 1080,
      h: 1920,
      background: { type: "gradient", gradient: "crimson_eclipse", pattern: "dots" },
      overlays: { grain: true, grainDensity: 45, scanlines: true, scanlinesOpacity: 30 },
      layers: [
        { type: "text", text: "NEW RELEASE", x: 540, y: 220, fontSize: 84, fontFamily: "Anton", fontWeight: "700", color: "#ffffff", finish: "crimson_glow" },
        { type: "text", text: "AVAILABLE WORLDWIDE NOW", x: 540, y: 310, fontSize: 22, fontFamily: "IBM Plex Mono", fontWeight: "600", color: "#c81024", letterSpacing: 4 },
        { type: "image", name: "Ghost Protocol", src: "https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev/images/optimized/work1-1400.webp", x: 540, y: 920, width: 840, height: 840, naturalWidth: 1000, naturalHeight: 1000 },
        { type: "shape", shapeType: "pill", x: 540, y: 1560, width: 440, height: 90, fillColor: "#c81024" },
        { type: "text", text: "SWIPE UP TO VIEW", x: 540, y: 1560, fontSize: 26, fontFamily: "Space Grotesk", fontWeight: "700", color: "#ffffff" },
        { type: "shape", shapeType: "arrow", x: 540, y: 1680, width: 120, height: 40, strokeWidth: 3, rotation: -90 }
      ]
    },
    {
      id: "event_flyer",
      name: "Underground Event Flyer",
      format: "3:4",
      w: 1080,
      h: 1440,
      background: { type: "color", color: "#06070a", pattern: "grid" },
      overlays: { grain: true, grainDensity: 55, creases: true, creasesIntensity: 70 },
      layers: [
        { type: "shape", shapeType: "rounded_card", x: 540, y: 720, width: 960, height: 1320, fillType: "none", strokeWidth: 2, strokeColor: "rgba(255,255,255,0.18)", borderRadius: 12 },
        { type: "text", text: "NIGHT ARCHIVE", x: 540, y: 220, fontSize: 92, fontFamily: "Space Grotesk", fontWeight: "800", color: "#FCF6F5" },
        { type: "text", text: "24.11.2026 // BASEMENT LAB", x: 540, y: 310, fontSize: 24, fontFamily: "IBM Plex Mono", fontWeight: "600", color: "#c81024", letterSpacing: 3 },
        { type: "shape", shapeType: "starburst", x: 540, y: 640, width: 340, height: 340, fillColor: "rgba(200, 16, 36, 0.2)", strokeWidth: 2, strokeColor: "#e72238" },
        { type: "text", text: "LIVE VISUAL EXPLORATION", x: 540, y: 640, fontSize: 28, fontFamily: "Sora", fontWeight: "700", color: "#ffffff" },
        { type: "text", text: "FEATURING ART DIRECTION · 3D ORBITS · PROCEDURAL SHADERS", x: 540, y: 1100, fontSize: 20, fontFamily: "Inter", fontWeight: "500", color: "#a0a5b2" },
        { type: "shape", shapeType: "barcode", x: 540, y: 1220, width: 400, height: 75, fillColor: "#ffffff" }
      ]
    },
    {
      id: "brand_card",
      name: "Minimalist Brand Card",
      format: "4:5",
      w: 1200,
      h: 1500,
      background: { type: "gradient", gradient: "chrome_horizon", pattern: "none" },
      overlays: { grain: true, grainDensity: 30, gloss: true, glossSheen: 50 },
      layers: [
        { type: "shape", shapeType: "reticle", x: 600, y: 750, width: 1040, height: 1340, strokeWidth: 2, strokeColor: "#c81024", fillType: "none" },
        { type: "text", text: "M", x: 600, y: 640, fontSize: 220, fontFamily: "Cinzel", fontWeight: "900", color: "#ffffff", finish: "chrome" },
        { type: "text", text: "MASSYNE DESIGN STUDIO", x: 600, y: 840, fontSize: 32, fontFamily: "Sora", fontWeight: "700", color: "#FCF6F5", letterSpacing: 4 },
        { type: "text", text: "INDEPENDENT GRAPHIC & MOTION DESIGN", x: 600, y: 910, fontSize: 18, fontFamily: "IBM Plex Mono", fontWeight: "500", color: "#8e95a5", letterSpacing: 3 },
        { type: "text", text: "ATELIER MOROCCO · PARIS · WORLDWIDE", x: 600, y: 1300, fontSize: 16, fontFamily: "IBM Plex Mono", fontWeight: "600", color: "#c81024", letterSpacing: 4 }
      ]
    }
  ];

  function loadTemplate(tpl) {
    pushHistory(`Apply ${tpl.name}`);
    state.title = tpl.name;
    if (projectTitleInput) projectTitleInput.value = tpl.name;
    state.format = tpl.format;
    state.width = tpl.w;
    state.height = tpl.h;
    state.background = JSON.parse(JSON.stringify(tpl.background));
    state.overlays = { ...state.overlays, ...tpl.overlays };

    canvas.width = tpl.w;
    canvas.height = tpl.h;
    overlayCanvas.width = tpl.w;
    overlayCanvas.height = tpl.h;

    if (canvasPresetSelect) canvasPresetSelect.value = tpl.format;
    if (canvasDimPill) canvasDimPill.textContent = `${tpl.w} × ${tpl.h}`;

    state.layers = tpl.layers.map(l => {
      const copy = {
        id: uid(),
        name: l.name || l.text || l.shapeType || "Layer",
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        blendMode: "normal",
        ...l
      };
      if (copy.type === "text") {
        const fs = Number(copy.fontSize) || 48;
        if (!Number.isFinite(copy.width) || copy.width <= 0) {
          copy.width = Math.max(120, (copy.text ? copy.text.length * fs * 0.65 : 200) + 40);
        }
        if (!Number.isFinite(copy.height) || copy.height <= 0) {
          copy.height = Math.max(40, fs * 1.3);
        }
      }
      if (copy.type === "image" && copy.src) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => render();
        img.src = copy.src;
        copy.img = img;
      }
      return copy;
    });

    state.selectedId = null;
    fitZoom();
    render();
    renderLayersList();
    renderContextInspector();
    setStatus(`Applied template: ${tpl.name}`);
  }

  function renderTemplatesUI() {
    const grid = document.getElementById("templates-grid");
    if (!grid) return;
    grid.innerHTML = "";

    TEMPLATES.forEach(tpl => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "template-card-btn";
      btn.innerHTML = `
        <div class="template-thumb">
          <div class="template-thumb-inner">
            <span class="template-thumb-title">${tpl.name}</span>
            <span class="template-thumb-badge">${tpl.format}</span>
          </div>
        </div>
        <strong class="template-name">${tpl.name}</strong>
        <span class="template-ratio-tag">${tpl.w} × ${tpl.h}</span>
      `;
      btn.addEventListener("click", () => loadTemplate(tpl));
      grid.appendChild(btn);
    });
  }

  // ==========================================================================
  // PROJECT JSON SAVE / LOAD & EXPORT (PNG / JPG 2X)
  // ==========================================================================
  // Save Project JSON
  function saveProjectJson() {
    const data = {
      version: "2.0-canva",
      title: state.title,
      format: state.format,
      width: state.width,
      height: state.height,
      background: state.background,
      overlays: state.overlays,
      layers: state.layers.map(l => {
        const copy = { ...l };
        if (l.type === "image" && l.img) copy.imgSrc = l.img.src;
        return copy;
      })
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "massyne-design"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Project .json saved.");
  }

  if (btnSaveJson) btnSaveJson.addEventListener("click", saveProjectJson);

  // Open Project JSON
  if (btnOpenJson && projectJsonInput) {
    btnOpenJson.addEventListener("click", () => projectJsonInput.click());
    projectJsonInput.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          pushHistory("Load Project JSON");
          restoreSnapshot(data);
          setStatus(`Loaded project "${data.title || "Design"}".`);
        } catch (err) {
          console.error("Invalid project JSON:", err);
          alert("Could not parse project JSON file.");
        }
      };
      reader.readAsText(file);
      projectJsonInput.value = "";
    });
  }

  // High-Resolution Export
  function exportCanvas(type = "png", scale = 2) {
    const expCanvas = document.createElement("canvas");
    expCanvas.width = state.width * scale;
    expCanvas.height = state.height * scale;
    const ectx = expCanvas.getContext("2d");

    // Scale everything proportionally
    ectx.scale(scale, scale);

    const transparent = exportTransparentBg?.checked && type === "png";

    // 1. Draw Background (unless transparent PNG)
    if (!transparent) {
      if (state.background.type === "color") {
        ectx.fillStyle = state.background.color || "#050608";
        ectx.fillRect(0, 0, state.width, state.height);
      } else if (state.background.type === "gradient") {
        const gradKey = state.background.gradient || "obsidian_noir";
        let grad;
        if (gradKey === "obsidian_noir") {
          grad = ectx.createRadialGradient(state.width / 2, state.height * 0.35, state.width * 0.05, state.width / 2, state.height / 2, state.width * 0.75);
          grad.addColorStop(0, "#181b24");
          grad.addColorStop(1, "#050608");
        } else if (gradKey === "crimson_eclipse") {
          grad = ectx.createLinearGradient(0, 0, state.width, state.height);
          grad.addColorStop(0, "#1d0307");
          grad.addColorStop(0.65, "#050608");
          grad.addColorStop(1, "#680c16");
        } else if (gradKey === "chrome_horizon") {
          grad = ectx.createLinearGradient(0, 0, 0, state.height);
          grad.addColorStop(0, "#101217");
          grad.addColorStop(0.5, "#2d3340");
          grad.addColorStop(1, "#08090c");
        } else if (gradKey === "blood_moon") {
          grad = ectx.createRadialGradient(state.width / 2, state.height * 0.8, state.width * 0.1, state.width / 2, state.height * 0.6, state.width * 0.85);
          grad.addColorStop(0, "#820f1d");
          grad.addColorStop(1, "#050608");
        }
        ectx.fillStyle = grad;
        ectx.fillRect(0, 0, state.width, state.height);
      }
    }

    // 2. Render Layers
    state.layers.forEach(layer => {
      if (!layer.visible) return;
      ectx.save();
      ectx.translate(layer.x, layer.y);
      ectx.rotate((layer.rotation * Math.PI) / 180);
      ectx.globalAlpha = Math.max(0, Math.min(1, layer.opacity ?? 1));
      ectx.globalCompositeOperation = layer.blendMode || "source-over";

      const halfW = Number.isFinite(layer.width) && layer.width > 0 ? layer.width / 2 : 50;
      const halfH = Number.isFinite(layer.height) && layer.height > 0 ? layer.height / 2 : 25;

      if (layer.type === "text") drawTextLayer(ectx, layer);
      else if (layer.type === "image") drawImageLayer(ectx, layer, halfW, halfH);
      else if (layer.type === "shape") drawShapeLayer(ectx, layer, halfW, halfH);
      else if (layer.type === "sticker") drawStickerLayer(ectx, layer, halfW, halfH);

      ectx.restore();
    });

    // 3. Render Texture Overlays
    renderCanvasOverlays(ectx, state.width, state.height);

    // 4. Download file
    const mime = type === "jpg" ? "image/jpeg" : "image/png";
    const quality = type === "jpg" ? 0.94 : undefined;
    const dataUrl = expCanvas.toDataURL(mime, quality);

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${state.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "massyne-design"}-${scale}x.${type}`;
    a.click();
    setStatus(`Exported ${scale}× ${type.toUpperCase()} successfully.`);

    if (exportDropdown) exportDropdown.hidden = true;
  }

  // Export Menu Dropdown Listeners
  if (btnExportMain && exportDropdown) {
    btnExportMain.addEventListener("click", () => {
      exportDropdown.hidden = !exportDropdown.hidden;
      btnExportMain.setAttribute("aria-expanded", String(!exportDropdown.hidden));
    });
    document.addEventListener("click", e => {
      if (!btnExportMain.contains(e.target) && !exportDropdown.contains(e.target)) {
        exportDropdown.hidden = true;
        btnExportMain.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (exportPng2x) exportPng2x.addEventListener("click", () => exportCanvas("png", 2));
  if (exportPng1x) exportPng1x.addEventListener("click", () => exportCanvas("png", 1));
  if (exportJpg2x) exportJpg2x.addEventListener("click", () => exportCanvas("jpg", 2));

  // ==========================================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================================
  window.addEventListener("keydown", event => {
    // Ignore when typing inside an input or textarea
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

    // Undo: Ctrl+Z / Cmd+Z
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      undo();
    }
    // Redo: Ctrl+Y / Cmd+Y / Ctrl+Shift+Z
    else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))) {
      event.preventDefault();
      redo();
    }
    // Duplicate: Ctrl+D / Cmd+D
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelected();
    }
    // Delete: Delete / Backspace
    else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelected();
    }
    // Deselect: Escape
    else if (event.key === "Escape") {
      selectLayer(null);
    }
    // Nudge Arrow Keys
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      const selected = state.layers.find(l => l.id === state.selectedId && !l.locked);
      if (!selected) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      if (event.key === "ArrowLeft") selected.x -= step;
      if (event.key === "ArrowRight") selected.x += step;
      if (event.key === "ArrowUp") selected.y -= step;
      if (event.key === "ArrowDown") selected.y += step;
      render();
    }
  });

  // Zoom Button Listeners
  if (btnZoomIn) btnZoomIn.addEventListener("click", () => setZoom(state.zoom + 0.15));
  if (btnZoomOut) btnZoomOut.addEventListener("click", () => setZoom(state.zoom - 0.15));
  if (btnZoomReset) btnZoomReset.addEventListener("click", () => setZoom(1.0));
  if (btnZoomFit) btnZoomFit.addEventListener("click", fitZoom);

  // Preset Selector Listener
  if (canvasPresetSelect) {
    canvasPresetSelect.addEventListener("change", () => {
      const val = canvasPresetSelect.value;
      if (val === "custom") {
        if (customSizeModal) customSizeModal.showModal();
      } else if (PRESETS[val]) {
        const p = PRESETS[val];
        setCanvasDimensions(p.w, p.h, val);
      }
    });
  }

  // Custom Modal Form Listener
  if (customSizeForm && customSizeModal) {
    customSizeForm.addEventListener("submit", e => {
      e.preventDefault();
      const w = parseInt(customWInput.value, 10) || 1080;
      const h = parseInt(customHInput.value, 10) || 1440;
      setCanvasDimensions(w, h, "custom");
      customSizeModal.close();
    });
    if (btnCloseModal) btnCloseModal.addEventListener("click", () => customSizeModal.close());
    if (btnCancelCustom) btnCancelCustom.addEventListener("click", () => customSizeModal.close());
  }

  // Project Title Input
  if (projectTitleInput) {
    projectTitleInput.addEventListener("input", e => {
      state.title = e.target.value;
    });
    projectTitleInput.addEventListener("change", () => pushHistory("Rename Project"));
  }

  // Undo / Redo Click Handlers
  if (btnUndo) btnUndo.addEventListener("click", undo);
  if (btnRedo) btnRedo.addEventListener("click", redo);

  // Resize Window Listener for Auto-Fit
  window.addEventListener("resize", () => {
    fitZoom();
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  renderTemplatesUI();
  // Load default starter template
  loadTemplate(TEMPLATES[0]);
  setStatus("MASSYNE Lab — Canva Edition ready.");
})();
