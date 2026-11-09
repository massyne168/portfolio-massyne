(() => {
  'use strict';

  const section = document.getElementById('motion');
  const dialog = document.getElementById('motion-case-dialog');
  const player = document.getElementById('motion-case-player');
  const title = document.getElementById('motion-case-title');
  const label = document.getElementById('motion-case-label');
  const closeButton = document.getElementById('motion-case-close');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (!section || !dialog || !player || !title || !label || !closeButton) return;

  const cards = [...section.querySelectorAll('[data-motion-case]')];
  let activePreview = null;

  const stopPreview = card => {
    const preview = card?.querySelector('.motion-project-preview');
    if (!preview) return;
    preview.pause();
    preview.removeAttribute('src');
    preview.load();
    card.classList.remove('is-previewing');
    if (activePreview === card) activePreview = null;
  };

  const stopAllPreviews = () => cards.forEach(stopPreview);

  const startPreview = card => {
    if (reducedMotion.matches || !finePointer.matches || !card) return;
    if (activePreview && activePreview !== card) stopPreview(activePreview);
    const preview = card.querySelector('.motion-project-preview');
    if (!preview || preview.hasAttribute('src')) return;
    preview.src = card.dataset.motionSource;
    preview.load();
    activePreview = card;
    const playing = preview.play();
    if (playing && typeof playing.then === 'function') {
      playing.then(() => card.classList.add('is-previewing')).catch(() => {
        card.classList.remove('is-previewing');
      });
    }
  };

  const closeCase = () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    dialog.close();
  };

  cards.forEach(card => {
    card.addEventListener('pointerenter', () => startPreview(card));
    card.addEventListener('pointerleave', () => stopPreview(card));
    card.addEventListener('focus', () => startPreview(card));
    card.addEventListener('blur', () => stopPreview(card));
    card.addEventListener('click', () => {
      stopAllPreviews();
      const projectName = card.dataset.projectName || 'Motion study';
      title.textContent = projectName;
      label.textContent = card.dataset.projectLabel || 'MOTION / SELECTED WORK';
      player.src = card.dataset.motionSource;
      player.muted = true;
      player.load();
      dialog.showModal();
      const playing = player.play();
      if (playing && typeof playing.catch === 'function') playing.catch(() => {});
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
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAllPreviews();
      player.pause();
    }
  });
  reducedMotion.addEventListener?.('change', event => {
    if (event.matches) stopAllPreviews();
  });
})();
