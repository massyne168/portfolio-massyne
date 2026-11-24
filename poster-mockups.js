/* MASSYNE Lab — Live Mockup Studio Engine
   Heavyweight Hoodie, Oversized T-Shirt, CD Jewel Case, and Wall Frame mockups.
   Supports live 2D canvas source or any selected Portfolio Artwork.
   Includes 2x HD Mockup PNG export with realistic fabric shading & acrylic reflections.
*/
(() => {
  const mockupCanvas = document.getElementById('mockup-canvas');
  const posterCanvas = document.getElementById('poster-canvas');
  if (!mockupCanvas || !posterCanvas) return;
  const ctx = mockupCanvas.getContext('2d');

  // Mockup State
  const state = {
    model: 'hoodie', // 'hoodie' | 'tshirt' | 'cd' | 'frame'
    colorway: 'obsidian', // 'obsidian' | 'charcoal' | 'bone' | 'crimson'
    scale: 75, // 30 - 120%
    placementY: 0, // -50 to 50
    blendMode: 'normal', // 'normal' | 'multiply' | 'screen'
    externalArtwork: null // null (uses posterCanvas) or Image object
  };

  const COLOR_PALETTES = {
    obsidian: { base: '#0b0c10', shadow: 'rgba(0,0,0,0.85)', highlight: 'rgba(255,255,255,0.08)', stitch: '#16181f' },
    charcoal: { base: '#252830', shadow: 'rgba(5,7,10,0.78)', highlight: 'rgba(255,255,255,0.15)', stitch: '#353a45' },
    bone:     { base: '#e4e1d7', shadow: 'rgba(50,45,40,0.48)', highlight: 'rgba(255,255,255,0.65)', stitch: '#cac5b8' },
    crimson:  { base: '#680c16', shadow: 'rgba(20,2,5,0.85)', highlight: 'rgba(255,100,120,0.22)', stitch: '#8a1523' }
  };

  // Get current artwork image source (either 2D poster canvas or loaded portfolio artwork)
  function getArtworkSource() {
    if (state.externalArtwork && state.externalArtwork.complete && state.externalArtwork.naturalWidth) {
      return state.externalArtwork;
    }
    return posterCanvas;
  }

  // Draw Heavyweight Streetwear Hoodie Mockup
  function drawHoodie(targetCtx, w, h) {
    const pal = COLOR_PALETTES[state.colorway];
    targetCtx.save();

    // 1. Studio backdrop & floor drop shadow
    const bgGrad = targetCtx.createRadialGradient(w / 2, h * 0.45, w * 0.1, w / 2, h * 0.5, w * 0.7);
    bgGrad.addColorStop(0, '#101217');
    bgGrad.addColorStop(1, '#050608');
    targetCtx.fillStyle = bgGrad;
    targetCtx.fillRect(0, 0, w, h);

    // Floor contact shadow
    targetCtx.fillStyle = 'rgba(0,0,0,0.6)';
    targetCtx.beginPath();
    targetCtx.ellipse(w / 2, h * 0.92, w * 0.38, h * 0.06, 0, 0, Math.PI * 2);
    targetCtx.fill();

    // 2. Hoodie Body Silhouette Path
    targetCtx.beginPath();
    // Neck base
    targetCtx.moveTo(w * 0.41, h * 0.22);
    // Left shoulder (boxy drop shoulder)
    targetCtx.lineTo(w * 0.22, h * 0.26);
    // Left sleeve outer
    targetCtx.lineTo(w * 0.13, h * 0.52);
    targetCtx.lineTo(w * 0.18, h * 0.55);
    // Left underarm
    targetCtx.lineTo(w * 0.27, h * 0.44);
    // Left torso side
    targetCtx.lineTo(w * 0.27, h * 0.84);
    // Bottom ribbing
    targetCtx.lineTo(w * 0.73, h * 0.84);
    // Right torso side
    targetCtx.lineTo(w * 0.73, h * 0.44);
    // Right underarm & sleeve outer
    targetCtx.lineTo(w * 0.82, h * 0.55);
    targetCtx.lineTo(w * 0.87, h * 0.52);
    // Right shoulder
    targetCtx.lineTo(w * 0.78, h * 0.26);
    // Neck right
    targetCtx.lineTo(w * 0.59, h * 0.22);
    targetCtx.closePath();

    targetCtx.fillStyle = pal.base;
    targetCtx.fill();

    // 3. Hoodie Hood (behind/around neck)
    targetCtx.beginPath();
    targetCtx.moveTo(w * 0.38, h * 0.23);
    targetCtx.bezierCurveTo(w * 0.35, h * 0.08, w * 0.65, h * 0.08, w * 0.62, h * 0.23);
    targetCtx.bezierCurveTo(w * 0.54, h * 0.27, w * 0.46, h * 0.27, w * 0.38, h * 0.23);
    targetCtx.fillStyle = pal.base;
    targetCtx.fill();
    targetCtx.strokeStyle = pal.shadow;
    targetCtx.lineWidth = 4;
    targetCtx.stroke();

    // Hood inside cavity shadow
    targetCtx.beginPath();
    targetCtx.ellipse(w * 0.5, h * 0.22, w * 0.11, h * 0.045, 0, 0, Math.PI * 2);
    targetCtx.fillStyle = '#020304';
    targetCtx.fill();

    // Drawstring eyelets and hanging cords
    targetCtx.strokeStyle = pal.highlight;
    targetCtx.lineWidth = 3;
    // Left cord
    targetCtx.beginPath();
    targetCtx.moveTo(w * 0.46, h * 0.25);
    targetCtx.bezierCurveTo(w * 0.45, h * 0.34, w * 0.44, h * 0.37, w * 0.44, h * 0.42);
    targetCtx.stroke();
    // Right cord
    targetCtx.beginPath();
    targetCtx.moveTo(w * 0.54, h * 0.25);
    targetCtx.bezierCurveTo(w * 0.55, h * 0.33, w * 0.56, h * 0.38, w * 0.55, h * 0.43);
    targetCtx.stroke();

    // Kangaroo Pocket outline & shadow
    targetCtx.beginPath();
    targetCtx.moveTo(w * 0.34, h * 0.64);
    targetCtx.lineTo(w * 0.66, h * 0.64);
    targetCtx.lineTo(w * 0.69, h * 0.78);
    targetCtx.lineTo(w * 0.31, h * 0.78);
    targetCtx.closePath();
    targetCtx.strokeStyle = pal.shadow;
    targetCtx.lineWidth = 3;
    targetCtx.stroke();

    // 4. Artwork Chest Print
    const art = getArtworkSource();
    if (art) {
      targetCtx.save();
      // Clip to hoodie chest boundary
      targetCtx.beginPath();
      targetCtx.rect(w * 0.31, h * 0.27, w * 0.38, h * 0.36);
      targetCtx.clip();

      const scaleFactor = state.scale / 100;
      const baseW = w * 0.35 * scaleFactor;
      const aspect = art.naturalHeight ? (art.naturalHeight / art.naturalWidth) : (art.height / art.width);
      const baseH = baseW * aspect;

      const centerX = w * 0.5;
      const centerY = h * 0.44 + (state.placementY / 100) * (h * 0.12);

      // Handle realistic print blend mode
      if (state.blendMode === 'multiply') {
        targetCtx.globalCompositeOperation = 'multiply';
      } else if (state.blendMode === 'screen') {
        targetCtx.globalCompositeOperation = 'screen';
      } else {
        targetCtx.globalCompositeOperation = state.colorway === 'bone' ? 'multiply' : 'source-over';
      }

      targetCtx.drawImage(art, centerX - baseW / 2, centerY - baseH / 2, baseW, baseH);
      targetCtx.restore();
    }

    // 5. Fabric Lighting & Crease Overlay (folds over artwork)
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'overlay';

    // Vertical drape shadow 1 (left chest)
    const fold1 = targetCtx.createLinearGradient(w * 0.35, 0, w * 0.44, 0);
    fold1.addColorStop(0, pal.shadow);
    fold1.addColorStop(0.5, 'rgba(0,0,0,0)');
    fold1.addColorStop(1, pal.highlight);
    targetCtx.fillStyle = fold1;
    targetCtx.fillRect(w * 0.32, h * 0.28, w * 0.15, h * 0.5);

    // Vertical drape shadow 2 (right chest)
    const fold2 = targetCtx.createLinearGradient(w * 0.56, 0, w * 0.65, 0);
    fold2.addColorStop(0, pal.highlight);
    fold2.addColorStop(0.5, 'rgba(0,0,0,0)');
    fold2.addColorStop(1, pal.shadow);
    targetCtx.fillStyle = fold2;
    targetCtx.fillRect(w * 0.53, h * 0.28, w * 0.15, h * 0.5);

    // Kangaroo pocket top fold shadow
    const pocketGrad = targetCtx.createLinearGradient(0, h * 0.62, 0, h * 0.66);
    pocketGrad.addColorStop(0, pal.shadow);
    pocketGrad.addColorStop(1, 'rgba(0,0,0,0)');
    targetCtx.fillStyle = pocketGrad;
    targetCtx.fillRect(w * 0.3, h * 0.62, w * 0.4, h * 0.05);

    targetCtx.restore();

    // Brand tag on bottom hem
    targetCtx.fillStyle = '#c81024';
    targetCtx.fillRect(w * 0.31, h * 0.825, w * 0.035, h * 0.022);
    targetCtx.fillStyle = '#ffffff';
    targetCtx.font = `600 ${Math.round(w * 0.009)}px 'IBM Plex Mono', monospace`;
    targetCtx.fillText('MSN', w * 0.315, h * 0.84);

    targetCtx.restore();
  }

  // Draw Oversized Streetwear T-Shirt Mockup
  function drawTShirt(targetCtx, w, h) {
    const pal = COLOR_PALETTES[state.colorway];
    targetCtx.save();

    // Studio backdrop
    const bgGrad = targetCtx.createRadialGradient(w / 2, h * 0.48, w * 0.1, w / 2, h * 0.5, w * 0.7);
    bgGrad.addColorStop(0, '#111319');
    bgGrad.addColorStop(1, '#050608');
    targetCtx.fillStyle = bgGrad;
    targetCtx.fillRect(0, 0, w, h);

    // Floor drop shadow
    targetCtx.fillStyle = 'rgba(0,0,0,0.6)';
    targetCtx.beginPath();
    targetCtx.ellipse(w / 2, h * 0.94, w * 0.35, h * 0.05, 0, 0, Math.PI * 2);
    targetCtx.fill();

    // T-Shirt Body Outline
    targetCtx.beginPath();
    // Collar left
    targetCtx.moveTo(w * 0.42, h * 0.18);
    // Left boxy shoulder
    targetCtx.lineTo(w * 0.18, h * 0.26);
    // Left sleeve outer
    targetCtx.lineTo(w * 0.15, h * 0.46);
    targetCtx.lineTo(w * 0.25, h * 0.48);
    // Left underarm
    targetCtx.lineTo(w * 0.28, h * 0.38);
    // Left torso side
    targetCtx.lineTo(w * 0.28, h * 0.88);
    // Bottom hem
    targetCtx.lineTo(w * 0.72, h * 0.88);
    // Right torso side
    targetCtx.lineTo(w * 0.72, h * 0.38);
    // Right underarm & sleeve outer
    targetCtx.lineTo(w * 0.75, h * 0.48);
    targetCtx.lineTo(w * 0.85, h * 0.46);
    // Right shoulder
    targetCtx.lineTo(w * 0.82, h * 0.26);
    // Collar right
    targetCtx.lineTo(w * 0.58, h * 0.18);
    targetCtx.closePath();

    targetCtx.fillStyle = pal.base;
    targetCtx.fill();

    // Thick Ribbed Crewneck Collar
    targetCtx.beginPath();
    targetCtx.moveTo(w * 0.42, h * 0.18);
    targetCtx.bezierCurveTo(w * 0.46, h * 0.24, w * 0.54, h * 0.24, w * 0.58, h * 0.18);
    targetCtx.bezierCurveTo(w * 0.54, h * 0.21, w * 0.46, h * 0.21, w * 0.42, h * 0.18);
    targetCtx.fillStyle = pal.base;
    targetCtx.fill();
    targetCtx.strokeStyle = pal.shadow;
    targetCtx.lineWidth = 3;
    targetCtx.stroke();

    // Collar inner shadow
    targetCtx.beginPath();
    targetCtx.ellipse(w * 0.5, h * 0.185, w * 0.075, h * 0.02, 0, 0, Math.PI * 2);
    targetCtx.fillStyle = '#020304';
    targetCtx.fill();

    // Artwork Front Print
    const art = getArtworkSource();
    if (art) {
      targetCtx.save();
      // Clip to T-shirt printable zone
      targetCtx.beginPath();
      targetCtx.rect(w * 0.31, h * 0.24, w * 0.38, h * 0.56);
      targetCtx.clip();

      const scaleFactor = state.scale / 100;
      const baseW = w * 0.35 * scaleFactor;
      const aspect = art.naturalHeight ? (art.naturalHeight / art.naturalWidth) : (art.height / art.width);
      const baseH = baseW * aspect;

      const centerX = w * 0.5;
      const centerY = h * 0.48 + (state.placementY / 100) * (h * 0.16);

      if (state.blendMode === 'multiply') {
        targetCtx.globalCompositeOperation = 'multiply';
      } else if (state.blendMode === 'screen') {
        targetCtx.globalCompositeOperation = 'screen';
      } else {
        targetCtx.globalCompositeOperation = state.colorway === 'bone' ? 'multiply' : 'source-over';
      }

      targetCtx.drawImage(art, centerX - baseW / 2, centerY - baseH / 2, baseW, baseH);
      targetCtx.restore();
    }

    // Fabric folds and drape shading
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'overlay';

    // Left chest fold
    const tfold1 = targetCtx.createLinearGradient(w * 0.32, 0, w * 0.42, 0);
    tfold1.addColorStop(0, pal.shadow);
    tfold1.addColorStop(0.5, 'rgba(0,0,0,0)');
    tfold1.addColorStop(1, pal.highlight);
    targetCtx.fillStyle = tfold1;
    targetCtx.fillRect(w * 0.3, h * 0.25, w * 0.14, h * 0.6);

    // Right chest fold
    const tfold2 = targetCtx.createLinearGradient(w * 0.58, 0, w * 0.68, 0);
    tfold2.addColorStop(0, pal.highlight);
    tfold2.addColorStop(0.5, 'rgba(0,0,0,0)');
    tfold2.addColorStop(1, pal.shadow);
    targetCtx.fillStyle = tfold2;
    targetCtx.fillRect(w * 0.56, h * 0.25, w * 0.14, h * 0.6);

    targetCtx.restore();

    targetCtx.restore();
  }

  // Draw Dark Acrylic CD Jewel Case Mockup
  function drawCDCase(targetCtx, w, h) {
    targetCtx.save();

    // Studio backdrop
    const bgGrad = targetCtx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, '#12141a');
    bgGrad.addColorStop(1, '#050608');
    targetCtx.fillStyle = bgGrad;
    targetCtx.fillRect(0, 0, w, h);

    // Case drop shadow
    targetCtx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    targetCtx.shadowBlur = 45;
    targetCtx.shadowOffsetY = 25;

    const caseX = w * 0.2;
    const caseY = h * 0.2;
    const caseW = w * 0.6;
    const caseH = caseW * 0.88;

    // CD Case Base Plate
    targetCtx.fillStyle = '#0a0b0e';
    targetCtx.fillRect(caseX, caseY, caseW, caseH);
    targetCtx.shadowColor = 'transparent';

    // Ribbed Spine on the Left
    const spineW = caseW * 0.085;
    targetCtx.fillStyle = '#14161c';
    targetCtx.fillRect(caseX, caseY, spineW, caseH);

    // Spine traction ridges
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    targetCtx.lineWidth = 1.5;
    for (let sy = caseY + 12; sy < caseY + caseH - 12; sy += 8) {
      targetCtx.beginPath();
      targetCtx.moveTo(caseX + 4, sy);
      targetCtx.lineTo(caseX + spineW - 4, sy);
      targetCtx.stroke();
    }

    // Inlay Card / Booklet Area
    const bookX = caseX + spineW + 8;
    const bookY = caseY + 8;
    const bookW = caseW - spineW - 16;
    const bookH = caseH - 16;

    // Draw artwork as CD Booklet
    const art = getArtworkSource();
    if (art) {
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.rect(bookX, bookY, bookW, bookH);
      targetCtx.clip();

      const scaleFactor = state.scale / 100;
      const baseW = bookW * scaleFactor;
      const aspect = art.naturalHeight ? (art.naturalHeight / art.naturalWidth) : (art.height / art.width);
      const baseH = baseW * aspect;

      const centerX = bookX + bookW / 2;
      const centerY = bookY + bookH / 2 + (state.placementY / 100) * (bookH * 0.25);

      targetCtx.drawImage(art, centerX - baseW / 2, centerY - baseH / 2, baseW, baseH);
      targetCtx.restore();
    }

    // Clear Acrylic Front Jewel Cover Glass & Refraction
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';

    // Diagonal specular glass glare
    const glare = targetCtx.createLinearGradient(caseX, caseY, caseX + caseW, caseY + caseH);
    glare.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glare.addColorStop(0.38, 'rgba(255, 255, 255, 0)');
    glare.addColorStop(0.42, 'rgba(220, 240, 255, 0.45)');
    glare.addColorStop(0.46, 'rgba(255, 255, 255, 0.7)');
    glare.addColorStop(0.5, 'rgba(200, 230, 255, 0.35)');
    glare.addColorStop(0.58, 'rgba(255, 255, 255, 0)');
    glare.addColorStop(0.78, 'rgba(255, 230, 240, 0.25)');
    glare.addColorStop(0.82, 'rgba(255, 255, 255, 0.45)');
    glare.addColorStop(0.86, 'rgba(255, 255, 255, 0)');
    glare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    targetCtx.fillStyle = glare;
    targetCtx.fillRect(caseX, caseY, caseW, caseH);

    // Acrylic bevel outer borders
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    targetCtx.lineWidth = 2;
    targetCtx.strokeRect(caseX, caseY, caseW, caseH);

    // Top and bottom hinge tabs
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    targetCtx.fillRect(caseX + spineW, caseY + 2, 14, 18);
    targetCtx.fillRect(caseX + spineW, caseY + caseH - 20, 14, 18);

    targetCtx.restore();

    targetCtx.restore();
  }

  // Draw Obsidian Gallery Wall Frame Mockup
  function drawWallFrame(targetCtx, w, h) {
    targetCtx.save();

    // Dark gallery wall background
    targetCtx.fillStyle = '#08090d';
    targetCtx.fillRect(0, 0, w, h);

    // Overhead spotlight beam cone
    const spot = targetCtx.createRadialGradient(w / 2, h * 0.12, w * 0.05, w / 2, h * 0.45, w * 0.55);
    spot.addColorStop(0, 'rgba(255, 250, 240, 0.22)');
    spot.addColorStop(0.4, 'rgba(255, 240, 220, 0.08)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    targetCtx.fillStyle = spot;
    targetCtx.fillRect(0, 0, w, h);

    // Frame Dimensions
    const frameW = w * 0.52;
    const frameH = frameW * 1.25;
    const frameX = (w - frameW) / 2;
    const frameY = (h - frameH) / 2 + 10;

    // Heavy frame wall drop shadow
    targetCtx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    targetCtx.shadowBlur = 55;
    targetCtx.shadowOffsetY = 35;

    // Outer Obsidian Moulding
    targetCtx.fillStyle = '#0b0c10';
    targetCtx.fillRect(frameX, frameY, frameW, frameH);
    targetCtx.shadowColor = 'transparent';

    // Moulding Bevel Rim
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    targetCtx.lineWidth = 2.5;
    targetCtx.strokeRect(frameX, frameY, frameW, frameH);

    // Inner Pass-partout (Matting board)
    const matBorder = frameW * 0.08;
    const matX = frameX + matBorder;
    const matY = frameY + matBorder;
    const matW = frameW - matBorder * 2;
    const matH = frameH - matBorder * 2;

    targetCtx.fillStyle = '#14161d';
    targetCtx.fillRect(matX, matY, matW, matH);

    // Artwork Inside Frame
    const art = getArtworkSource();
    if (art) {
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.rect(matX, matY, matW, matH);
      targetCtx.clip();

      const scaleFactor = state.scale / 100;
      const baseW = matW * scaleFactor;
      const aspect = art.naturalHeight ? (art.naturalHeight / art.naturalWidth) : (art.height / art.width);
      const baseH = baseW * aspect;

      const centerX = matX + matW / 2;
      const centerY = matY + matH / 2 + (state.placementY / 100) * (matH * 0.2);

      targetCtx.drawImage(art, centerX - baseW / 2, centerY - baseH / 2, baseW, baseH);
      targetCtx.restore();
    }

    // Glass Reflection & Glare
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';
    const glassGlare = targetCtx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
    glassGlare.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glassGlare.addColorStop(0.35, 'rgba(255, 255, 255, 0.12)');
    glassGlare.addColorStop(0.42, 'rgba(255, 255, 255, 0.35)');
    glassGlare.addColorStop(0.48, 'rgba(255, 255, 255, 0.08)');
    glassGlare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    targetCtx.fillStyle = glassGlare;
    targetCtx.fillRect(matX, matY, matW, matH);
    targetCtx.restore();

    targetCtx.restore();
  }

  // Render the currently selected mockup
  function renderMockup() {
    const w = mockupCanvas.width;
    const h = mockupCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (state.model === 'hoodie') {
      drawHoodie(ctx, w, h);
    } else if (state.model === 'tshirt') {
      drawTShirt(ctx, w, h);
    } else if (state.model === 'cd') {
      drawCDCase(ctx, w, h);
    } else if (state.model === 'frame') {
      drawWallFrame(ctx, w, h);
    }
  }

  // Export 2x HD Mockup PNG
  async function exportMockup2x() {
    const exportBtn = document.getElementById('export-mockup-btn');
    if (exportBtn) exportBtn.disabled = true;

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 2400;
      exportCanvas.height = 2400;
      const expCtx = exportCanvas.getContext('2d');

      if (state.model === 'hoodie') {
        drawHoodie(expCtx, 2400, 2400);
      } else if (state.model === 'tshirt') {
        drawTShirt(expCtx, 2400, 2400);
      } else if (state.model === 'cd') {
        drawCDCase(expCtx, 2400, 2400);
      } else if (state.model === 'frame') {
        drawWallFrame(expCtx, 2400, 2400);
      }

      const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Mockup export failed');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `massyne-mockup-${state.model}-${state.colorway}-2x.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      const status = document.getElementById('lab-status');
      if (status) status.textContent = `Exported 2× HD Mockup (${state.model.toUpperCase()}) successfully.`;
    } catch (err) {
      console.error(err);
      const status = document.getElementById('lab-status');
      if (status) status.textContent = 'Could not export mockup. Please try again.';
    } finally {
      if (exportBtn) exportBtn.disabled = false;
    }
  }

  // Listen for canvas redraws to automatically update mockup in real-time
  posterCanvas.addEventListener('poster:draw', () => {
    // Only re-render mockup if in mockup mode or visible
    if (document.body.dataset.editorMode === 'mockup') {
      renderMockup();
    }
  });

  // UI Bindings for Mockup Controls
  function bindMockupUI() {
    // Mode Switcher: 2D Canvas vs Live Mockup
    const modeCanvasBtn = document.getElementById('mode-canvas');
    const modeMockupBtn = document.getElementById('mode-mockup');
    const canvasWorkarea = document.querySelector('.canvas-workarea');
    const mockupWorkarea = document.getElementById('mockup-workarea');

    function setMode(mode) {
      document.body.dataset.editorMode = mode;
      if (modeCanvasBtn) modeCanvasBtn.setAttribute('aria-pressed', String(mode === 'canvas'));
      if (modeMockupBtn) modeMockupBtn.setAttribute('aria-pressed', String(mode === 'mockup'));

      if (canvasWorkarea) canvasWorkarea.hidden = (mode === 'mockup');
      if (mockupWorkarea) mockupWorkarea.hidden = (mode !== 'mockup');

      // Sync Topbar Export Button
      const exportCanvasBtn = document.getElementById('download-poster');
      const exportMockupBtn = document.getElementById('export-mockup-topbar-btn');
      if (exportCanvasBtn) exportCanvasBtn.hidden = (mode === 'mockup');
      if (exportMockupBtn) exportMockupBtn.hidden = (mode !== 'mockup');

      if (mode === 'mockup') {
        renderMockup();
      }
    }

    if (modeCanvasBtn) modeCanvasBtn.addEventListener('click', () => setMode('canvas'));
    if (modeMockupBtn) modeMockupBtn.addEventListener('click', () => setMode('mockup'));

    // Model Selector Buttons
    document.querySelectorAll('[data-mockup-model]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.model = btn.dataset.mockupModel;
        document.querySelectorAll('[data-mockup-model]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        renderMockup();
      });
    });

    // Colorway Selector Buttons
    document.querySelectorAll('[data-mockup-colorway]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.colorway = btn.dataset.mockupColorway;
        document.querySelectorAll('[data-mockup-colorway]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        renderMockup();
      });
    });

    // Scale Slider
    const scaleSlider = document.getElementById('mockup-scale');
    const scaleValue = document.getElementById('mockup-scale-value');
    if (scaleSlider) {
      scaleSlider.addEventListener('input', e => {
        state.scale = Number(e.target.value);
        if (scaleValue) scaleValue.textContent = state.scale + '%';
        renderMockup();
      });
    }

    // Placement Y Slider
    const placeYSlider = document.getElementById('mockup-placement-y');
    const placeYValue = document.getElementById('mockup-placement-y-value');
    if (placeYSlider) {
      placeYSlider.addEventListener('input', e => {
        state.placementY = Number(e.target.value);
        if (placeYValue) placeYValue.textContent = (state.placementY > 0 ? '+' : '') + state.placementY + '%';
        renderMockup();
      });
    }

    // Blend Mode Select
    const blendSelect = document.getElementById('mockup-blend-mode');
    if (blendSelect) {
      blendSelect.addEventListener('change', e => {
        state.blendMode = e.target.value;
        renderMockup();
      });
    }

    // Reset to Canvas Source Button
    const resetSourceBtn = document.getElementById('mockup-reset-source');
    if (resetSourceBtn) {
      resetSourceBtn.addEventListener('click', () => {
        state.externalArtwork = null;
        const sourceIndicator = document.getElementById('mockup-source-indicator');
        if (sourceIndicator) sourceIndicator.textContent = 'Live 2D Canvas';
        resetSourceBtn.hidden = true;
        renderMockup();
      });
    }

    // Export Mockup Buttons
    const exportBtn1 = document.getElementById('export-mockup-btn');
    const exportBtn2 = document.getElementById('export-mockup-topbar-btn');
    if (exportBtn1) exportBtn1.addEventListener('click', exportMockup2x);
    if (exportBtn2) exportBtn2.addEventListener('click', exportMockup2x);
  }

  function normalizeMockupUrl(url) {
    if (!url) return '';
    if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && url.includes('r2.dev/images/')) {
      return url.replace(/^https:\/\/[^/]+\.r2\.dev\/images\//, 'images/');
    }
    return url;
  }

  // Set External Artwork from Portfolio Artworks tab
  function setMockupArtwork(imgUrl, title) {
    const finalUrl = normalizeMockupUrl(imgUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.externalArtwork = img;
      const sourceIndicator = document.getElementById('mockup-source-indicator');
      const resetSourceBtn = document.getElementById('mockup-reset-source');
      if (sourceIndicator) sourceIndicator.textContent = title || 'Portfolio Artwork';
      if (resetSourceBtn) resetSourceBtn.hidden = false;

      // Switch to Mockup mode automatically
      const modeMockupBtn = document.getElementById('mode-mockup');
      if (modeMockupBtn) modeMockupBtn.click();
      renderMockup();
    };
    img.onerror = () => {
      if (img.src.includes('r2.dev/images/')) {
        img.src = img.src.replace(/^https:\/\/[^/]+\.r2\.dev\/images\//, 'images/');
      }
    };
    img.src = finalUrl;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindMockupUI);
  } else {
    bindMockupUI();
  }

  window.MASSYNE_MOCKUPS = {
    state,
    renderMockup,
    exportMockup2x,
    setMockupArtwork
  };
})();
