/* MASSYNE Lab — Portfolio Artworks Integration
   Browse & 1-Click Add real artworks from studio-content / project-data
   onto the live canvas or test directly in the Live Mockup studio.
*/
(() => {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;

  let allArtworks = [];
  let activeCategory = 'all';

  function normalizeArtUrl(url) {
    if (!url) return '';
    if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && url.includes('r2.dev/images/')) {
      return url.replace(/^https:\/\/[^/]+\.r2\.dev\/images\//, 'images/');
    }
    return url;
  }

  async function loadArtworksData() {
    // 1. Try window.MASSYNE_PROJECTS first
    if (Array.isArray(window.MASSYNE_PROJECTS) && window.MASSYNE_PROJECTS.length) {
      allArtworks = window.MASSYNE_PROJECTS.map(p => ({
        title: p.title,
        category: p.category || 'Posters',
        year: p.year || '2026',
        image: p.image
      }));
    } else {
      // 2. Fetch studio-content.json
      try {
        const res = await fetch('studio-content.json');
        if (res.ok) {
          const data = await res.json();
          const list = [];
          if (Array.isArray(data.curated)) {
            data.curated.forEach(p => {
              if (p.image) list.push({ title: p.title, category: p.category || 'Curated', year: '2026', image: p.image });
            });
          }
          if (Array.isArray(data.archive)) {
            data.archive.forEach(a => {
              if (a.image) list.push({ title: a.title, category: a.category || 'Archive', year: '2026', image: a.image });
            });
          }
          allArtworks = list;
        }
      } catch (err) {
        console.warn('Could not load studio-content.json for poster-portfolio:', err);
      }
    }

    renderPortfolioUI();
  }

  function addArtworkToCanvas(art) {
    const src = normalizeArtUrl(art.image);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, 720 / img.naturalWidth, 900 / img.naturalHeight);
      const width = img.naturalWidth * scale;
      const height = img.naturalHeight * scale;

      const layerData = {
        name: art.title,
        src,
        x: canvas.width / 2,
        y: canvas.height / 2,
        width,
        height,
        angle: 0,
        opacity: 100,
        visible: true
      };

      canvas.dispatchEvent(new CustomEvent('poster:image-add-direct', {
        detail: layerData
      }));

      const status = document.getElementById('lab-status');
      if (status) status.textContent = `Added "${art.title}" to canvas layers.`;
    };
    img.onerror = () => {
      if (img.src.includes('r2.dev/images/')) {
        img.src = img.src.replace(/^https:\/\/[^/]+\.r2\.dev\/images\//, 'images/');
      }
    };
    img.src = src;
  }

  function renderPortfolioUI() {
    const grid = document.getElementById('portfolio-artworks-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = activeCategory === 'all'
      ? allArtworks
      : allArtworks.filter(a => a.category.toLowerCase().includes(activeCategory.toLowerCase()));

    if (!filtered.length) {
      grid.innerHTML = '<p class="dock-hint">No artworks found in this category.</p>';
      return;
    }

    filtered.forEach(art => {
      const card = document.createElement('div');
      card.className = 'portfolio-art-card';
      const safeSrc = normalizeArtUrl(art.image);
      card.innerHTML = `
        <div class="art-thumb-wrap">
          <img src="${safeSrc}" alt="${art.title}" loading="lazy" crossOrigin="anonymous">
          <span class="art-badge">${art.category}</span>
        </div>
        <div class="art-info">
          <strong>${art.title}</strong>
          <span>${art.year}</span>
        </div>
        <div class="art-actions">
          <button type="button" class="art-add-canvas-btn" data-action="canvas">+ Canvas</button>
          <button type="button" class="art-test-mockup-btn" data-action="mockup">Test Mockup</button>
        </div>
      `;

      card.querySelector('[data-action="canvas"]').addEventListener('click', () => {
        addArtworkToCanvas(art);
      });

      card.querySelector('[data-action="mockup"]').addEventListener('click', () => {
        if (window.MASSYNE_MOCKUPS && window.MASSYNE_MOCKUPS.setMockupArtwork) {
          window.MASSYNE_MOCKUPS.setMockupArtwork(safeSrc, art.title);
        }
      });

      grid.appendChild(card);
    });
  }

  function bindPortfolioFilters() {
    document.querySelectorAll('[data-portfolio-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.portfolioFilter;
        document.querySelectorAll('[data-portfolio-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        renderPortfolioUI();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadArtworksData();
      bindPortfolioFilters();
    });
  } else {
    loadArtworksData();
    bindPortfolioFilters();
  }
})();
