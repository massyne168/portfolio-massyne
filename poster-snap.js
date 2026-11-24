/* MASSYNE Lab — Magnetic Crimson Snap Guides
   Snaps layers to Center-X, Center-Y, and Margins with visual crimson hairline guides.
*/
(() => {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let activeGuides = {
    xCenter: false,
    yCenter: false,
    xMarginLeft: false,
    xMarginRight: false,
    yMarginTop: false,
    yMarginBottom: false
  };

  const THRESHOLD = 14; // pixels distance to snap

  // Calculate snap for an X coordinate
  function checkSnapX(x, width) {
    const cWidth = canvas.width;
    const center = cWidth / 2;
    const mLeft = cWidth * 0.1;
    const mRight = cWidth * 0.9;

    let snappedX = x;
    activeGuides.xCenter = false;
    activeGuides.xMarginLeft = false;
    activeGuides.xMarginRight = false;

    if (Math.abs(x - center) <= THRESHOLD) {
      snappedX = center;
      activeGuides.xCenter = true;
    } else if (Math.abs(x - mLeft) <= THRESHOLD) {
      snappedX = mLeft;
      activeGuides.xMarginLeft = true;
    } else if (Math.abs(x - mRight) <= THRESHOLD) {
      snappedX = mRight;
      activeGuides.xMarginRight = true;
    }

    return snappedX;
  }

  // Calculate snap for a Y coordinate
  function checkSnapY(y, height) {
    const cHeight = canvas.height;
    const center = cHeight / 2;
    const mTop = cHeight * 0.1;
    const mBottom = cHeight * 0.9;

    let snappedY = y;
    activeGuides.yCenter = false;
    activeGuides.yMarginTop = false;
    activeGuides.yMarginBottom = false;

    if (Math.abs(y - center) <= THRESHOLD) {
      snappedY = center;
      activeGuides.yCenter = true;
    } else if (Math.abs(y - mTop) <= THRESHOLD) {
      snappedY = mTop;
      activeGuides.yMarginTop = true;
    } else if (Math.abs(y - mBottom) <= THRESHOLD) {
      snappedY = mBottom;
      activeGuides.yMarginBottom = true;
    }

    return snappedY;
  }

  function clearGuides() {
    activeGuides.xCenter = false;
    activeGuides.yCenter = false;
    activeGuides.xMarginLeft = false;
    activeGuides.xMarginRight = false;
    activeGuides.yMarginTop = false;
    activeGuides.yMarginBottom = false;
  }

  // Draw the active crimson guidelines onto the canvas
  function drawGuides() {
    const w = canvas.width;
    const h = canvas.height;
    const centerColor = '#c81024';
    const marginColor = 'rgba(200, 16, 36, 0.45)';

    ctx.save();
    ctx.lineWidth = 1.5;

    // Center X Vertical Guide
    if (activeGuides.xCenter) {
      ctx.strokeStyle = centerColor;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      // Center mark
      ctx.setLineDash([]);
      ctx.fillStyle = centerColor;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center Y Horizontal Guide
    if (activeGuides.yCenter) {
      ctx.strokeStyle = centerColor;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Center mark
      ctx.setLineDash([]);
      ctx.fillStyle = centerColor;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Margin Guides
    ctx.strokeStyle = marginColor;
    ctx.setLineDash([4, 6]);
    if (activeGuides.xMarginLeft) {
      ctx.beginPath();
      ctx.moveTo(w * 0.1, 0);
      ctx.lineTo(w * 0.1, h);
      ctx.stroke();
    }
    if (activeGuides.xMarginRight) {
      ctx.beginPath();
      ctx.moveTo(w * 0.9, 0);
      ctx.lineTo(w * 0.9, h);
      ctx.stroke();
    }
    if (activeGuides.yMarginTop) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.1);
      ctx.lineTo(w, h * 0.1);
      ctx.stroke();
    }
    if (activeGuides.yMarginBottom) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.9);
      ctx.lineTo(w, h * 0.9);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw snap guides on poster:draw if any are active
  canvas.addEventListener('poster:draw', () => {
    if (
      activeGuides.xCenter ||
      activeGuides.yCenter ||
      activeGuides.xMarginLeft ||
      activeGuides.xMarginRight ||
      activeGuides.yMarginTop ||
      activeGuides.yMarginBottom
    ) {
      drawGuides();
    }
  });

  // Clear guides on pointerup
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => {
    window.addEventListener(ev, () => {
      clearGuides();
    });
  });

  window.MASSYNE_SNAP = {
    checkSnapX,
    checkSnapY,
    clearGuides,
    drawGuides,
    activeGuides
  };
})();
