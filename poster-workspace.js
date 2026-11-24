/* MASSYNE Lab — Workspace Controller
   Manages Left Dock (Layers, Templates, Artworks), Right Inspector (Properties, FX),
   Tool Rail actions, Zoom controls, and bidirectional layer selection.
*/
(() => {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;

  // Left Dock Tabs & Panels
  const leftTabLayers = document.getElementById('left-tab-layers');
  const leftTabTemplates = document.getElementById('left-tab-templates');
  const leftTabPortfolio = document.getElementById('left-tab-portfolio');

  const leftPanelLayers = document.getElementById('left-panel-layers');
  const leftPanelTemplates = document.getElementById('left-panel-templates');
  const leftPanelPortfolio = document.getElementById('left-panel-portfolio');

  const leftTabs = [
    { btn: leftTabLayers, panel: leftPanelLayers, name: 'layers' },
    { btn: leftTabTemplates, panel: leftPanelTemplates, name: 'templates' },
    { btn: leftTabPortfolio, panel: leftPanelPortfolio, name: 'portfolio' }
  ];

  function showLeftTab(name) {
    leftTabs.forEach(t => {
      if (!t.btn || !t.panel) return;
      const isMatch = t.name === name;
      t.btn.setAttribute('aria-selected', String(isMatch));
      t.panel.hidden = !isMatch;
    });
  }

  leftTabs.forEach(t => {
    if (t.btn) t.btn.addEventListener('click', () => showLeftTab(t.name));
  });

  // Right Inspector Tabs & Panels
  const rightTabProperties = document.getElementById('right-tab-properties');
  const rightTabFx = document.getElementById('right-tab-fx');
  const rightPanelProperties = document.getElementById('right-panel-properties');
  const rightPanelFx = document.getElementById('right-panel-fx');

  const rightTabs = [
    { btn: rightTabProperties, panel: rightPanelProperties, name: 'properties' },
    { btn: rightTabFx, panel: rightPanelFx, name: 'fx' }
  ];

  function showRightTab(name) {
    rightTabs.forEach(t => {
      if (!t.btn || !t.panel) return;
      const isMatch = t.name === name;
      t.btn.setAttribute('aria-selected', String(isMatch));
      t.panel.hidden = !isMatch;
    });
  }

  rightTabs.forEach(t => {
    if (t.btn) t.btn.addEventListener('click', () => showRightTab(t.name));
  });

  // Backwards compatibility alias for showPanel
  function showPanel(name) {
    if (name === 'layers') {
      showLeftTab('layers');
      showRightTab('properties');
    } else if (name === 'design') {
      showRightTab('properties');
    }
  }

  // Active Layer State
  let active = { type: 'main' };
  const list = document.getElementById('layer-list');
  const count = document.getElementById('layers-count');
  const fire = (name, detail = {}) => canvas.dispatchEvent(new CustomEvent(name, { detail }));

  function updateSelection(type, id) {
    active = { type, id };
    if (list) {
      list.querySelectorAll('[data-layer-select]').forEach(b => {
        b.setAttribute('aria-pressed', String(b.dataset.layerSelect === type && String(b.dataset.layerId || '') === String(id ?? '')));
      });
    }

    const textPanel = document.getElementById('text-layer-properties');
    const imagePanel = document.getElementById('image-layer-properties');
    if (textPanel) textPanel.hidden = type !== 'text';
    if (imagePanel) imagePanel.hidden = type !== 'image';

    const sendBackBtn = document.getElementById('layer-send-back');
    const bringFrontBtn = document.getElementById('layer-bring-front');
    if (sendBackBtn) sendBackBtn.disabled = !['text', 'image'].includes(type);
    if (bringFrontBtn) bringFrontBtn.disabled = !['text', 'image'].includes(type);

    if (type === 'main') {
      showRightTab('properties');
    } else if (type === 'text') {
      showLeftTab('layers');
      showRightTab('properties');
      textPanel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (type === 'image') {
      showLeftTab('layers');
      showRightTab('properties');
      imagePanel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (type === 'shape') {
      showRightTab('properties');
      document.querySelector('.y2k-shapes')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function choose(type, id) {
    updateSelection(type, id);
    if (type === 'main') fire('poster:layerselect', { type: 'main' });
    else if (type === 'text') fire('poster:layerselect', { type: 'text', id });
    else if (type === 'image') fire('poster:layerselect', { type: 'image', id });
    else if (type === 'shape') {
      fire('poster:layerselect', { type: 'shape', index: id });
      fire('poster:shape-select', { index: id });
    } else if (type === 'freehand') {
      document.getElementById('tool-pen')?.click();
    }
  }

  function createLayerRow(name, kind, type, id, isSelected, visibility) {
    const wrap = document.createElement('div');
    wrap.className = 'layer-row';
    wrap.setAttribute('role', 'listitem');

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layer-item';
    b.dataset.layerSelect = type;
    b.dataset.layerId = id ?? '';
    b.setAttribute('aria-pressed', String(isSelected));
    b.setAttribute('aria-label', 'Select ' + name + ' layer');

    const icon = document.createElement('span');
    icon.className = 'layer-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = kind === 'title' ? 'T' : kind === 'shape' ? '◇' : kind === 'draw' ? '✎' : kind === 'image' ? '▧' : 'Aa';

    const title = document.createElement('span');
    title.className = 'layer-item-title';
    title.textContent = name;

    const tag = document.createElement('span');
    tag.className = 'layer-item-kind';
    tag.textContent = kind;

    b.append(icon, title, tag);
    wrap.append(b);

    if (visibility) {
      const eye = document.createElement('button');
      eye.type = 'button';
      eye.className = 'layer-visibility';
      eye.dataset.layerToggle = id;
      eye.dataset.layerKind = kind;
      eye.setAttribute('aria-label', (visibility.visible ? 'Hide ' : 'Show ') + name);
      eye.setAttribute('aria-pressed', String(visibility.visible));
      eye.textContent = visibility.visible ? '◉' : '○';
      wrap.append(eye);
    }
    return wrap;
  }

  function rebuild() {
    if (!list) return;
    const text = canvas.__textLayerData || { layers: [] };
    const image = canvas.__imageLayerData || { layers: [] };
    const shape = canvas.__shapeLayerData || { shapes: [] };
    const rows = [];

    const posterNameInput = document.getElementById('poster-name');
    const title = posterNameInput ? posterNameInput.value.trim() : '';
    if (title) {
      rows.push({ name: title, kind: 'title', type: 'main', id: '', selected: active.type === 'main' });
    }

    for (let i = shape.shapes.length - 1; i >= 0; i--) {
      rows.push({
        name: shape.shapes[i].type + ' ' + String(i + 1).padStart(2, '0'),
        kind: 'shape',
        type: 'shape',
        id: i,
        selected: active.type === 'shape' && Number(active.id) === i
      });
    }

    for (let i = image.layers.length - 1; i >= 0; i--) {
      const item = image.layers[i];
      rows.push({
        name: item.name || 'Image',
        kind: 'image',
        type: 'image',
        id: item.id,
        selected: active.type === 'image' && Number(active.id) === item.id,
        visibility: { visible: item.visible }
      });
    }

    for (let i = text.layers.length - 1; i >= 0; i--) {
      const item = text.layers[i];
      rows.push({
        name: item.text.trim() || 'Untitled text',
        kind: 'text',
        type: 'text',
        id: item.id,
        selected: active.type === 'text' && Number(active.id) === item.id,
        visibility: { visible: item.visible }
      });
    }

    if (Number(canvas.dataset.freehandCount) > 0) {
      rows.push({ name: 'Freehand marks', kind: 'draw', type: 'freehand', id: '', selected: active.type === 'freehand' });
    }

    list.replaceChildren(...rows.map(x => createLayerRow(x.name, x.kind, x.type, x.id, x.selected, x.visibility)));
    if (count) count.textContent = String(rows.length).padStart(2, '0');
  }

  canvas.addEventListener('poster:textlayerschange', e => {
    canvas.__textLayerData = e.detail;
    rebuild();
  });

  canvas.addEventListener('poster:imagelayerschange', e => {
    canvas.__imageLayerData = e.detail;
    if (e.detail.selectedId !== null) {
      active = { type: 'image', id: e.detail.selectedId };
      showLeftTab('layers');
      showRightTab('properties');
    } else if (active.type === 'image') {
      active = { type: 'main' };
    }
    rebuild();

    if (active.type === 'image') {
      const item = e.detail.layers.find(x => x.id === Number(active.id));
      if (item) {
        const wField = document.getElementById('image-layer-width');
        const aField = document.getElementById('image-layer-angle');
        const xField = document.getElementById('image-layer-x');
        const yField = document.getElementById('image-layer-y');
        const oField = document.getElementById('image-layer-opacity');
        if (wField) wField.value = item.width;
        if (aField) aField.value = item.angle;
        if (xField) xField.value = Math.round(item.x / canvas.width * 100);
        if (yField) yField.value = Math.round(item.y / canvas.height * 100);
        if (oField) oField.value = item.opacity;
      }
    }
  });

  canvas.addEventListener('poster:layerschange', e => {
    canvas.__shapeLayerData = e.detail;
    if (e.detail.selected >= 0) {
      active = { type: 'shape', id: e.detail.selected };
      showRightTab('properties');
    } else if (active.type === 'shape') {
      active = { type: 'main' };
    }
    rebuild();
  });

  canvas.addEventListener('poster:freehandchange', rebuild);

  canvas.addEventListener('poster:layerselect', e => {
    const d = e.detail || {};
    const type = d.type || 'main', id = d.id ?? d.index;
    updateSelection(type, id);

    if (type === 'image') {
      const item = (canvas.__imageLayerData?.layers || []).find(x => x.id === Number(id));
      if (item) {
        const wField = document.getElementById('image-layer-width');
        const aField = document.getElementById('image-layer-angle');
        const xField = document.getElementById('image-layer-x');
        const yField = document.getElementById('image-layer-y');
        const oField = document.getElementById('image-layer-opacity');
        const wVal = document.getElementById('image-layer-width-value');
        const aVal = document.getElementById('image-layer-angle-value');
        const oVal = document.getElementById('image-layer-opacity-value');

        if (wField) wField.value = item.width;
        if (aField) aField.value = item.angle;
        if (xField) xField.value = Math.round(item.x / canvas.width * 100);
        if (yField) yField.value = Math.round(item.y / canvas.height * 100);
        if (oField) oField.value = item.opacity;
        if (wVal) wVal.textContent = Math.round(item.width) + ' px';
        if (aVal) aVal.textContent = item.angle + '°';
        if (oVal) oVal.textContent = item.opacity + '%';
      }
    }

    if (type === 'text') {
      const item = (canvas.__textLayerData?.layers || []).find(x => x.id === Number(id));
      if (item) {
        for (const [field, key] of [
          ['extra-text-content', 'text'],
          ['extra-text-font', 'font'],
          ['extra-text-weight', 'weight'],
          ['extra-text-color', 'color'],
          ['extra-text-align', 'align'],
          ['extra-text-size', 'size'],
          ['extra-text-angle', 'angle'],
          ['extra-text-x', 'x'],
          ['extra-text-y', 'y']
        ]) {
          const el = document.getElementById(field);
          if (el) el.value = item[key];
        }
        const sVal = document.getElementById('extra-text-size-value');
        const aVal = document.getElementById('extra-text-angle-value');
        if (sVal) sVal.textContent = item.size + ' px';
        if (aVal) aVal.textContent = item.angle + '°';
      }
    }
    rebuild();
  });

  if (list) {
    list.addEventListener('click', e => {
      const eye = e.target.closest('[data-layer-toggle]');
      if (eye) {
        fire(eye.dataset.layerKind === 'image' ? 'poster:image-visibility' : 'poster:text-visibility', {
          id: Number(eye.dataset.layerToggle)
        });
        return;
      }
      const b = e.target.closest('[data-layer-select]');
      if (!b) return;
      choose(b.dataset.layerSelect, b.dataset.layerSelect === 'shape' ? Number(b.dataset.layerId) : b.dataset.layerSelect === 'text' ? Number(b.dataset.layerId) : b.dataset.layerSelect === 'image' ? Number(b.dataset.layerId) : null);
    });
  }

  // Tool Rail Buttons
  document.querySelectorAll('[data-tool-target]').forEach(b => {
    b.addEventListener('click', () => {
      const tool = b.dataset.toolTarget;
      document.querySelector('[data-draw-tool="' + tool + '"]')?.click();
      document.querySelectorAll('[data-tool-target]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  document.querySelectorAll('[data-tool-command]').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.toolCommand === 'add-text') {
        fire('poster:text-add');
        showLeftTab('layers');
        showRightTab('properties');
      }
      if (b.dataset.toolCommand === 'upload-image') {
        document.getElementById('image-upload')?.click();
      }
      if (b.dataset.toolCommand === 'open-shapes') {
        showRightTab('properties');
        document.querySelector('.y2k-shapes')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('[data-editor-action="add-text"]').forEach(b => {
    b.addEventListener('click', () => {
      fire('poster:text-add');
      showLeftTab('layers');
      showRightTab('properties');
    });
  });

  canvas.addEventListener('poster:toolchange', e => {
    document.querySelectorAll('[data-tool-target]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.toolTarget === e.detail.tool));
    });
  });

  // Text layer updates
  function updateTextLayer(updates) {
    if (active.type === 'text') fire('poster:text-update', { id: Number(active.id), updates });
  }

  const extraContent = document.getElementById('extra-text-content');
  if (extraContent) {
    extraContent.addEventListener('input', e => updateTextLayer({ text: e.target.value }));
  }

  for (const [id, key, convert] of [
    ['extra-text-font', 'font', v => v],
    ['extra-text-weight', 'weight', v => v],
    ['extra-text-color', 'color', v => v],
    ['extra-text-align', 'align', v => v],
    ['extra-text-size', 'size', Number],
    ['extra-text-angle', 'angle', Number],
    ['extra-text-x', 'x', Number],
    ['extra-text-y', 'y', Number]
  ]) {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', () => {
        const value = convert(field.value);
        if (key === 'size') {
          const sVal = document.getElementById('extra-text-size-value');
          if (sVal) sVal.textContent = value + ' px';
        }
        if (key === 'angle') {
          const aVal = document.getElementById('extra-text-angle-value');
          if (aVal) aVal.textContent = value + '°';
        }
        updateTextLayer({ [key]: value });
      });
    }
  }

  const delTextBtn = document.getElementById('delete-text-layer');
  if (delTextBtn) delTextBtn.addEventListener('click', () => {
    if (active.type === 'text') fire('poster:text-delete', { id: Number(active.id) });
  });

  const delImgBtn = document.getElementById('delete-image-layer');
  if (delImgBtn) delImgBtn.addEventListener('click', () => {
    if (active.type === 'image') fire('poster:image-delete', { id: Number(active.id) });
  });

  const sendBackBtn = document.getElementById('layer-send-back');
  if (sendBackBtn) sendBackBtn.addEventListener('click', () => {
    if (active.type === 'text') fire('poster:text-reorder', { id: Number(active.id), direction: -1 });
    if (active.type === 'image') fire('poster:image-reorder', { id: Number(active.id), direction: -1 });
  });

  const bringFrontBtn = document.getElementById('layer-bring-front');
  if (bringFrontBtn) bringFrontBtn.addEventListener('click', () => {
    if (active.type === 'text') fire('poster:text-reorder', { id: Number(active.id), direction: 1 });
    if (active.type === 'image') fire('poster:image-reorder', { id: Number(active.id), direction: 1 });
  });

  // Image layer updates
  function updateImageLayer(updates) {
    if (active.type === 'image') fire('poster:image-update', { id: Number(active.id), updates });
  }

  for (const [id, key, convert] of [
    ['image-layer-width', 'width', Number],
    ['image-layer-angle', 'angle', Number],
    ['image-layer-opacity', 'opacity', Number]
  ]) {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', () => {
        const value = convert(field.value);
        const suffix = key === 'width' ? ' px' : key === 'angle' ? '°' : '%';
        const valOut = document.getElementById(id + '-value');
        if (valOut) valOut.textContent = value + suffix;
        updateImageLayer({ [key]: value });
      });
    }
  }

  const imgX = document.getElementById('image-layer-x');
  const imgY = document.getElementById('image-layer-y');
  if (imgX) imgX.addEventListener('input', e => updateImageLayer({ x: Number(e.target.value) / 100 * canvas.width }));
  if (imgY) imgY.addEventListener('input', e => updateImageLayer({ y: Number(e.target.value) / 100 * canvas.height }));

  // Zoom controls
  let zoom = 1;
  const zoomOutput = document.getElementById('canvas-zoom-value');
  function setZoom(value) {
    zoom = Math.max(0.6, Math.min(1.4, Math.round(value * 10) / 10));
    canvas.style.transform = 'scale(' + zoom + ')';
    if (zoomOutput) {
      zoomOutput.value = Math.round(zoom * 100) + '%';
      zoomOutput.textContent = zoomOutput.value;
    }
  }

  document.getElementById('canvas-zoom-out')?.addEventListener('click', () => setZoom(zoom - 0.1));
  document.getElementById('canvas-zoom-in')?.addEventListener('click', () => setZoom(zoom + 0.1));
  document.getElementById('canvas-fit')?.addEventListener('click', () => setZoom(1));

  document.getElementById('reset-poster')?.addEventListener('click', () => {
    active = { type: 'main' };
    showLeftTab('layers');
    showRightTab('properties');
    updateSelection('main');
    setZoom(1);
  });

  document.getElementById('poster-name')?.addEventListener('input', rebuild);

  canvas.addEventListener('poster:snapshot', e => {
    e.detail.workspaceActive = { ...active };
  });

  canvas.addEventListener('poster:restore', e => {
    active = e.detail.workspaceActive || { type: 'main' };
    updateSelection(active.type, active.id);
    rebuild();
  });

  rebuild();
  setZoom(1);
})();
