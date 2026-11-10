(() => {
  'use strict';

  const section = document.getElementById('motion');
  const dialog = document.getElementById('motion-case-dialog');
  const player = document.getElementById('motion-case-player');
  const gifViewer = document.getElementById('motion-case-gif');
  const title = document.getElementById('motion-case-title');
  const label = document.getElementById('motion-case-label');
  const process = dialog?.querySelector('.motion-case-process');
  const closeButton = document.getElementById('motion-case-close');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!section || !dialog || !player || !gifViewer || !title || !label || !process || !closeButton) return;

  const cards = [...section.querySelectorAll('[data-motion-case]')];
  let motionIsVisible = false;

  const stopPreview = card => {
    const preview = card?.querySelector('.motion-project-preview');
    if (!preview) return;
    if (preview.tagName === 'VIDEO') preview.pause();
    preview.removeAttribute('src');
    if (preview.tagName === 'VIDEO') preview.load();
    card.classList.remove('is-previewing');
  };

  const stopAllPreviews = () => cards.forEach(stopPreview);

  const canPlayPreviews = () => motionIsVisible
    && !document.hidden
    && !dialog.open
    && !reducedMotion.matches
    && !navigator.connection?.saveData;

  const startPreview = card => {
    if (!canPlayPreviews() || !card) return;
    const preview = card.querySelector('.motion-project-preview');
    const source = card.dataset.motionSource;
    if (!preview || !source) return;

    if (card.dataset.motionKind === 'gif') {
      if (preview.getAttribute('src') !== source) preview.src = source;
      card.classList.add('is-previewing');
      return;
    }

    if (preview.getAttribute('src') !== source) {
      preview.src = source;
      preview.loop = true;
      preview.muted = true;
      preview.playsInline = true;
      preview.load();
    }
    if (!preview.paused) return;

    const playing = preview.play();
    if (playing && typeof playing.then === 'function') {
      playing.then(() => {
        if (canPlayPreviews() && !preview.paused) card.classList.add('is-previewing');
        else stopPreview(card);
      }).catch(() => stopPreview(card));
    } else {
      card.classList.add('is-previewing');
    }
  };

  const refreshVisiblePreviews = () => {
    if (!canPlayPreviews()) return;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < viewportHeight
        && rect.right > 0 && rect.left < viewportWidth;
      if (visible) startPreview(card);
    });
  };

  const cardObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && canPlayPreviews()) startPreview(entry.target);
        else if (!entry.isIntersecting) stopPreview(entry.target);
      });
    }, { rootMargin: '0px', threshold: 0.01 })
    : null;

  const sectionObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      motionIsVisible = entry.isIntersecting;
      if (motionIsVisible) refreshVisiblePreviews();
      else stopAllPreviews();
    }, { threshold: 0.01 })
    : null;

  if (cardObserver && sectionObserver) {
    cards.forEach(card => cardObserver.observe(card));
    sectionObserver.observe(section);
  }

  const closeCase = () => {
    if (dialog.open) dialog.close();
  };

  cards.forEach(card => {
    card.addEventListener('click', () => {
      stopAllPreviews();
      const projectName = card.dataset.projectName || 'Motion study';
      const source = card.dataset.motionSource;
      const isGif = card.dataset.motionKind === 'gif';
      title.textContent = projectName;
      label.textContent = card.dataset.projectLabel || 'MOTION / SELECTED WORK';
      process.hidden = card.dataset.hideProcess === 'true';
      if (isGif) {
        player.pause();
        player.removeAttribute('src');
        player.load();
        player.hidden = true;
        gifViewer.alt = `${projectName} animation`;
        gifViewer.src = source;
        gifViewer.hidden = false;
      } else {
        gifViewer.removeAttribute('src');
        gifViewer.hidden = true;
        player.hidden = false;
        player.src = source;
        player.muted = true;
        player.load();
      }
      dialog.showModal();
      if (!isGif) {
        const playing = player.play();
        if (playing && typeof playing.catch === 'function') playing.catch(() => {});
      }
    });
  });

  closeButton.addEventListener('click', closeCase);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeCase();
  });
  dialog.addEventListener('close', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    player.hidden = false;
    gifViewer.removeAttribute('src');
    gifViewer.hidden = true;
    process.hidden = false;
    refreshVisiblePreviews();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAllPreviews();
      player.pause();
    } else {
      refreshVisiblePreviews();
    }
  });
  reducedMotion.addEventListener?.('change', event => {
    if (event.matches) stopAllPreviews();
    else refreshVisiblePreviews();
  });
  window.addEventListener('pageshow', refreshVisiblePreviews);
})();
