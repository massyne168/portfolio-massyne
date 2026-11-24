/* MASSYNE Lab — Streetwear Graphic Sticker Library & 1-Click Starter Templates */
(() => {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;

  // Crisp Vector Stickers (Inline SVG data URLs for instant zero-dependency rendering)
  const STICKERS = {
    barcode_h: {
      name: 'Barcode / H',
      category: 'technical',
      width: 480,
      height: 160,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160">
        <rect width="480" height="160" fill="transparent"/>
        <g fill="#ffffff">
          <rect x="20" y="15" width="6" height="95"/>
          <rect x="32" y="15" width="12" height="95"/>
          <rect x="52" y="15" width="4" height="95"/>
          <rect x="62" y="15" width="16" height="95"/>
          <rect x="86" y="15" width="8" height="95"/>
          <rect x="100" y="15" width="4" height="95"/>
          <rect x="110" y="15" width="14" height="95"/>
          <rect x="132" y="15" width="6" height="95"/>
          <rect x="144" y="15" width="18" height="95"/>
          <rect x="170" y="15" width="8" height="95"/>
          <rect x="184" y="15" width="4" height="95"/>
          <rect x="194" y="15" width="12" height="95"/>
          <rect x="214" y="15" width="16" height="95"/>
          <rect x="238" y="15" width="6" height="95"/>
          <rect x="250" y="15" width="10" height="95"/>
          <rect x="268" y="15" width="4" height="95"/>
          <rect x="278" y="15" width="14" height="95"/>
          <rect x="300" y="15" width="8" height="95"/>
          <rect x="314" y="15" width="18" height="95"/>
          <rect x="340" y="15" width="6" height="95"/>
          <rect x="352" y="15" width="12" height="95"/>
          <rect x="372" y="15" width="4" height="95"/>
          <rect x="382" y="15" width="16" height="95"/>
          <rect x="406" y="15" width="8" height="95"/>
          <rect x="420" y="15" width="14" height="95"/>
          <rect x="442" y="15" width="8" height="95"/>
          <rect x="456" y="15" width="4" height="95"/>
        </g>
        <text x="240" y="142" fill="#ffffff" font-family="'IBM Plex Mono', monospace" font-size="19" font-weight="600" text-anchor="middle" letter-spacing="4">MASSYNE // 09148-2026</text>
      </svg>`
    },
    barcode_v: {
      name: 'Barcode / V',
      category: 'technical',
      width: 140,
      height: 480,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 480">
        <rect width="140" height="480" fill="transparent"/>
        <g fill="#ffffff">
          <rect x="15" y="20" width="85" height="5"/>
          <rect x="15" y="32" width="85" height="12"/>
          <rect x="15" y="52" width="85" height="4"/>
          <rect x="15" y="62" width="85" height="15"/>
          <rect x="15" y="85" width="85" height="8"/>
          <rect x="15" y="99" width="85" height="4"/>
          <rect x="15" y="110" width="85" height="13"/>
          <rect x="15" y="131" width="85" height="6"/>
          <rect x="15" y="144" width="85" height="18"/>
          <rect x="15" y="170" width="85" height="7"/>
          <rect x="15" y="184" width="85" height="5"/>
          <rect x="15" y="196" width="85" height="13"/>
          <rect x="15" y="217" width="85" height="16"/>
          <rect x="15" y="241" width="85" height="6"/>
          <rect x="15" y="254" width="85" height="10"/>
          <rect x="15" y="271" width="85" height="4"/>
          <rect x="15" y="282" width="85" height="14"/>
          <rect x="15" y="304" width="85" height="8"/>
          <rect x="15" y="318" width="85" height="17"/>
          <rect x="15" y="343" width="85" height="6"/>
          <rect x="15" y="356" width="85" height="12"/>
          <rect x="15" y="375" width="85" height="4"/>
          <rect x="15" y="386" width="85" height="16"/>
          <rect x="15" y="410" width="85" height="8"/>
          <rect x="15" y="424" width="85" height="14"/>
          <rect x="15" y="445" width="85" height="6"/>
          <rect x="15" y="458" width="85" height="4"/>
        </g>
        <text x="122" y="240" fill="#ffffff" font-family="'IBM Plex Mono', monospace" font-size="15" font-weight="600" text-anchor="middle" transform="rotate(90, 122, 240)" letter-spacing="3">MSN-LAB-2026</text>
      </svg>`
    },
    stamp_archive: {
      name: 'Rubber Stamp / Archive 26',
      category: 'stamps',
      width: 280,
      height: 280,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280">
        <rect width="280" height="280" fill="transparent"/>
        <circle cx="140" cy="140" r="126" fill="none" stroke="#c81024" stroke-width="6" stroke-dasharray="14 7"/>
        <circle cx="140" cy="140" r="106" fill="none" stroke="#c81024" stroke-width="2.5"/>
        <text x="140" y="105" fill="#c81024" font-family="'Anton', sans-serif" font-size="28" font-weight="700" text-anchor="middle" letter-spacing="6">ARCHIVE</text>
        <rect x="75" y="124" width="130" height="34" fill="#c81024"/>
        <text x="140" y="149" fill="#050608" font-family="'Anton', sans-serif" font-size="26" font-weight="700" text-anchor="middle" letter-spacing="5">2026</text>
        <text x="140" y="188" fill="#c81024" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="3">AUTHENTIC STUDIO</text>
      </svg>`
    },
    stamp_morocco: {
      name: 'Rubber Stamp / Morocco',
      category: 'stamps',
      width: 290,
      height: 190,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 190">
        <rect width="290" height="190" fill="transparent"/>
        <rect x="10" y="10" width="270" height="170" fill="none" stroke="#c81024" stroke-width="5" rx="14"/>
        <rect x="20" y="20" width="250" height="150" fill="none" stroke="#c81024" stroke-width="1.8" stroke-dasharray="6 4" rx="8"/>
        <text x="145" y="65" fill="#c81024" font-family="'Space Grotesk', sans-serif" font-size="17" font-weight="700" text-anchor="middle" letter-spacing="5">ATELIER DU DESIGN</text>
        <text x="145" y="112" fill="#c81024" font-family="'Anton', sans-serif" font-size="44" font-weight="700" text-anchor="middle" letter-spacing="6">MOROCCO</text>
        <text x="145" y="148" fill="#c81024" font-family="'IBM Plex Mono', monospace" font-size="13" font-weight="600" text-anchor="middle" letter-spacing="3">LAT 33.5731Â° N Â· 7.5898Â° W</text>
      </svg>`
    },
    stamp_limited: {
      name: 'Rubber Stamp / Limited Drop',
      category: 'stamps',
      width: 320,
      height: 140,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140">
        <rect width="320" height="140" fill="transparent"/>
        <polygon points="12,12 308,12 296,128 24,128" fill="#c81024"/>
        <text x="160" y="58" fill="#ffffff" font-family="'Anton', sans-serif" font-size="34" font-weight="700" text-anchor="middle" letter-spacing="4">LIMITED DROP</text>
        <text x="160" y="96" fill="#050608" font-family="'Space Grotesk', sans-serif" font-size="18" font-weight="800" text-anchor="middle" letter-spacing="6">EDITION // 01 OF 50</text>
      </svg>`
    },
    crosshair_target: {
      name: 'Target Crosshair',
      category: 'hud',
      width: 220,
      height: 220,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
        <rect width="220" height="220" fill="transparent"/>
        <circle cx="110" cy="110" r="88" fill="none" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="110" cy="110" r="54" fill="none" stroke="#c81024" stroke-width="1.8" stroke-dasharray="6 5"/>
        <circle cx="110" cy="110" r="5" fill="#c81024"/>
        <line x1="110" y1="8" x2="110" y2="212" stroke="#ffffff" stroke-width="2"/>
        <line x1="8" y1="110" x2="212" y2="110" stroke="#ffffff" stroke-width="2"/>
        <rect x="100" y="100" width="20" height="20" fill="none" stroke="#c81024" stroke-width="1.5"/>
        <text x="110" y="206" fill="#ffffff" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="600" text-anchor="middle" letter-spacing="2">SYS.TARGET.26</text>
      </svg>`
    },
    corner_reticles: {
      name: '3D Corner Reticles',
      category: 'hud',
      width: 480,
      height: 600,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600">
        <rect width="480" height="600" fill="transparent"/>
        <!-- Top Left -->
        <path d="M 20 70 L 20 20 L 70 20" fill="none" stroke="#c81024" stroke-width="4.5" stroke-linecap="square"/>
        <!-- Top Right -->
        <path d="M 410 20 L 460 20 L 460 70" fill="none" stroke="#c81024" stroke-width="4.5" stroke-linecap="square"/>
        <!-- Bottom Left -->
        <path d="M 20 530 L 20 580 L 70 580" fill="none" stroke="#c81024" stroke-width="4.5" stroke-linecap="square"/>
        <!-- Bottom Right -->
        <path d="M 410 580 L 460 580 L 460 530" fill="none" stroke="#c81024" stroke-width="4.5" stroke-linecap="square"/>
        <!-- Subtle center tick -->
        <circle cx="240" cy="300" r="3" fill="#c81024"/>
      </svg>`
    },
    emblem_gurzil: {
      name: 'Emblem / Gurzil Gothic',
      category: 'emblems',
      width: 320,
      height: 320,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
        <rect width="320" height="320" fill="transparent"/>
        <g stroke="#ffffff" stroke-width="3" fill="none" stroke-linejoin="round">
          <!-- Central Gothic Star -->
          <path d="M160 25 L178 120 L270 120 L195 175 L225 265 L160 210 L95 265 L125 175 L50 120 L142 120 Z" fill="rgba(200,16,36,0.2)" stroke="#c81024" stroke-width="3.5"/>
          <circle cx="160" cy="160" r="42" fill="none" stroke="#ffffff" stroke-width="2"/>
          <circle cx="160" cy="160" r="16" fill="#c81024"/>
        </g>
        <text x="160" y="305" fill="#ffffff" font-family="'Anton', sans-serif" font-size="20" font-weight="700" text-anchor="middle" letter-spacing="6">GURZIL</text>
      </svg>`
    },
    emblem_massyne: {
      name: 'MASSYNE Metallic Wordmark',
      category: 'emblems',
      width: 460,
      height: 120,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 120">
        <defs>
          <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#242830"/>
            <stop offset="25%" stop-color="#b8c2ce"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="53%" stop-color="#363d47"/>
            <stop offset="78%" stop-color="#c5d0dc"/>
            <stop offset="100%" stop-color="#1f232a"/>
          </linearGradient>
        </defs>
        <rect width="460" height="120" fill="transparent"/>
        <text x="230" y="82" fill="url(#chromeGrad)" stroke="#ffffff" stroke-width="1.2" font-family="'Anton', sans-serif" font-size="78" font-weight="700" text-anchor="middle" letter-spacing="8">MASSYNE</text>
        <text x="230" y="110" fill="#c81024" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="600" text-anchor="middle" letter-spacing="5">CREATIVE STUDIO // 2026</text>
      </svg>`
    }
  };

  // Convert SVG string to data URL
  function svgToDataUrl(svgString) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString.trim());
  }

  // Add any sticker directly as an Image Layer onto the canvas
  function addStickerToCanvas(stickerKey) {
    const sticker = STICKERS[stickerKey];
    if (!sticker) return;

    const dataUrl = svgToDataUrl(sticker.svg);
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      // Scale sticker appropriately relative to canvas width
      const scale = Math.min(1, 460 / sticker.width);
      const width = sticker.width * scale;
      const height = sticker.height * scale;

      const layerData = {
        name: sticker.name,
        src: dataUrl,
        x: canvas.width / 2,
        y: canvas.height / 2,
        width,
        height,
        angle: 0,
        opacity: 100,
        visible: true
      };

      // Dispatch to poster-image-layers
      canvas.dispatchEvent(new CustomEvent('poster:image-add-direct', {
        detail: layerData
      }));
    };
    image.src = dataUrl;
  }

  // 4 Curated 1-Click Starter Templates
  const TEMPLATES = {
    streetwear_drop: {
      name: 'Streetwear Drop',
      desc: 'Heavyweight streetwear poster with liquid chrome type, barcode, and folded creases.',
      ratio: '4:5',
      background: '#050608',
      title: 'MASSYNE',
      titleColor: '#ffffff',
      titleFont: 'Anton',
      titleWeight: '700',
      titleScale: 115,
      titleX: 0,
      titleY: -180,
      fx: {
        foldedPaper: true,
        foldedPaperIntensity: 65,
        filmGrain: true,
        filmGrainIntensity: 40,
        halftone: false,
        plasticGloss: false,
        activeTextFinish: 'liquid-chrome'
      },
      textLayers: [
        { text: 'HEAVYWEIGHT OVERSIZED // 2026 DROP', font: 'Space Grotesk', weight: '700', color: '#c81024', align: 'center', size: 36, angle: 0, x: 50, y: 32, visible: true },
        { text: 'ATELIER MOROCCO Â· WORLDWIDE SHIP', font: 'IBM Plex Mono', weight: '500', color: '#a0a5b0', align: 'center', size: 28, angle: 0, x: 50, y: 88, visible: true }
      ],
      stickers: ['barcode_h', 'corner_reticles', 'stamp_limited']
    },
    dark_key_art: {
      name: 'Dark Key Art',
      desc: 'Cinematic obsidian poster with glowing crimson typography and precision crosshairs.',
      ratio: '4:5',
      background: '#090a0f',
      title: 'CYBER MOTION',
      titleColor: '#ff2a4b',
      titleFont: 'Orbitron',
      titleWeight: '700',
      titleScale: 105,
      titleX: 0,
      titleY: -120,
      fx: {
        foldedPaper: false,
        filmGrain: true,
        filmGrainIntensity: 55,
        halftone: false,
        plasticGloss: false,
        activeTextFinish: 'crimson-glow'
      },
      textLayers: [
        { text: 'EXPERIMENT 009 // SYSTEM VISUALS', font: 'IBM Plex Mono', weight: '600', color: '#c81024', align: 'center', size: 32, angle: 0, x: 50, y: 34, visible: true },
        { text: '3D ORBITAL DISPLACEMENT STUDY', font: 'Space Grotesk', weight: '700', color: '#e0e4ec', align: 'center', size: 34, angle: 0, x: 50, y: 78, visible: true }
      ],
      stickers: ['crosshair_target', 'stamp_archive']
    },
    album_cover: {
      name: 'Album Cover 1:1',
      desc: 'Square CD/Vinyl format with shrinkwrap plastic gloss sheen, gothic emblem, and barcode.',
      ratio: '1:1',
      background: '#07080a',
      title: 'FREQUENCY CORE',
      titleColor: '#e8edf5',
      titleFont: 'Bebas Neue',
      titleWeight: '700',
      titleScale: 120,
      titleX: 0,
      titleY: -110,
      fx: {
        foldedPaper: false,
        filmGrain: true,
        filmGrainIntensity: 35,
        halftone: false,
        plasticGloss: true,
        plasticGlossIntensity: 75,
        activeTextFinish: 'brushed-silver'
      },
      textLayers: [
        { text: 'ORIGINAL MOTION SOUNDTRACK', font: 'IBM Plex Mono', weight: '600', color: '#9098a5', align: 'center', size: 30, angle: 0, x: 50, y: 34, visible: true },
        { text: '12 TRACKS // MASTER STEREO 24-BIT', font: 'Space Grotesk', weight: '700', color: '#c81024', align: 'center', size: 28, angle: 0, x: 50, y: 84, visible: true }
      ],
      stickers: ['emblem_gurzil', 'barcode_v', 'stamp_morocco']
    },
    swiss_editorial: {
      name: 'Swiss Editorial',
      desc: 'Refined high-contrast grid, serif typography, Xerox halftone dots, and technical markings.',
      ratio: '4:5',
      background: '#0e1014',
      title: 'DIFFERENT BY DESIGN',
      titleColor: '#f5f7fa',
      titleFont: 'DM Serif Display',
      titleWeight: '400',
      titleScale: 90,
      titleX: 0,
      titleY: -160,
      fx: {
        foldedPaper: true,
        foldedPaperIntensity: 45,
        filmGrain: false,
        halftone: true,
        halftoneIntensity: 40,
        plasticGloss: false,
        activeTextFinish: 'brutalist-outline'
      },
      textLayers: [
        { text: 'MASSYNE ATELIER // EDITION 2026', font: 'IBM Plex Mono', weight: '500', color: '#c81024', align: 'center', size: 26, angle: 0, x: 50, y: 26, visible: true },
        { text: 'VISUAL STORIES THAT DON\'T DISAPPEAR INTO THE SCROLL', font: 'Manrope', weight: '600', color: '#9ca3af', align: 'center', size: 28, angle: 0, x: 50, y: 82, visible: true }
      ],
      stickers: ['emblem_massyne', 'stamp_archive']
    }
  };

  // Load template into the canvas
  function applyTemplate(templateKey) {
    const tmpl = TEMPLATES[templateKey];
    if (!tmpl) return;

    // 1. Set Aspect Ratio if needed
    if (tmpl.ratio && window.MASSYNE_SET_RATIO) {
      window.MASSYNE_SET_RATIO(tmpl.ratio);
    }

    // 2. Set Quick Text & Background
    const nameInput = document.getElementById('poster-name');
    const pageBg = document.getElementById('page-background');
    if (nameInput) nameInput.value = tmpl.title;
    if (pageBg) pageBg.value = tmpl.background;

    // Dispatch text edit to update core state
    canvas.dispatchEvent(new CustomEvent('poster:text-edit', {
      detail: {
        background: tmpl.background,
        font: tmpl.titleFont,
        titleColor: tmpl.titleColor,
        titleWeight: tmpl.titleWeight,
        textScale: tmpl.titleScale,
        textX: tmpl.titleX,
        textY: tmpl.titleY
      }
    }));

    // Update active font button
    document.querySelectorAll('[data-font]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.font === tmpl.titleFont));
    });

    // 3. Set FX State
    if (tmpl.fx) {
      canvas.dispatchEvent(new CustomEvent('poster:fx-update', {
        detail: tmpl.fx
      }));
    }

    // 4. Clear and add Extra Text Layers
    canvas.dispatchEvent(new CustomEvent('poster:text-layers-set', {
      detail: { layers: tmpl.textLayers }
    }));

    // 5. Clear and add template stickers
    canvas.dispatchEvent(new CustomEvent('poster:images-clear'));
    if (Array.isArray(tmpl.stickers)) {
      tmpl.stickers.forEach(sKey => addStickerToCanvas(sKey));
    }

    // Announce to status
    const status = document.getElementById('lab-status');
    if (status) status.textContent = `Loaded template: ${tmpl.name}.`;

    canvas.dispatchEvent(new Event('poster:render'));
  }

  // Populate Templates & Stickers UI Tab
  function renderStickersAndTemplatesUI() {
    const templatesContainer = document.getElementById('templates-grid');
    const stickersContainer = document.getElementById('stickers-grid');

    // 1. Render Starter Templates
    if (templatesContainer) {
      templatesContainer.innerHTML = '';
      Object.entries(TEMPLATES).forEach(([key, tmpl]) => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
          <div class="template-card-preview" data-template="${key}">
            <span class="template-badge">${tmpl.ratio}</span>
            <strong class="template-title">${tmpl.name}</strong>
          </div>
          <p class="template-desc">${tmpl.desc}</p>
          <button type="button" class="template-load-btn" data-load-template="${key}">Load Template â†’</button>
        `;
        templatesContainer.appendChild(card);
      });

      templatesContainer.querySelectorAll('[data-load-template]').forEach(btn => {
        btn.addEventListener('click', () => applyTemplate(btn.dataset.loadTemplate));
      });
    }

    // 2. Render Sticker Pack
    if (stickersContainer) {
      stickersContainer.innerHTML = '';
      Object.entries(STICKERS).forEach(([key, sticker]) => {
        const item = document.createElement('div');
        item.className = 'sticker-item';
        item.innerHTML = `
          <div class="sticker-thumb" data-add-sticker="${key}">
            ${sticker.svg}
          </div>
          <span class="sticker-name">${sticker.name}</span>
          <button type="button" class="sticker-add-btn" data-add-sticker="${key}">+ Add to Canvas</button>
        `;
        stickersContainer.appendChild(item);
      });

      stickersContainer.querySelectorAll('[data-add-sticker]').forEach(el => {
        el.addEventListener('click', () => addStickerToCanvas(el.dataset.addSticker));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderStickersAndTemplatesUI);
  } else {
    renderStickersAndTemplatesUI();
  }

  window.MASSYNE_STICKERS = {
    STICKERS,
    TEMPLATES,
    addStickerToCanvas,
    applyTemplate
  };
})();
