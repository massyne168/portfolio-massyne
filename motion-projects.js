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

  // Helper to determine if #motion is currently the active, visible section
  function isMotionActive() {
    if (document.hidden) return false;
    if (reducedMotion.matches) return false;
    if (dialog.open) return false;

    // 1. Desktop panel navigation check (one panel active at a time)
    const isMobileFlow = window.matchMedia('(max-width: 850px)').matches || document.body.classList.contains('mobile-scroll-flow');
    if (!isMobileFlow) {
      if (section.hidden || section.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      if (document.body.dataset.activePanel && document.body.dataset.activePanel !== 'motion') {
        return false;
      }
      return true;
    }

    // 2. Mobile natural vertical scroll check
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(vh, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    return visibleHeight >= Math.min(vh * 0.15, 120) || (rect.top <= vh * 0.5 && rect.bottom >= vh * 0.25);
  }

  // Play a single card's preview
  function playCard(card) {
    if (!card) return;
    const preview = card.querySelector('.motion-project-preview');
    const source = card.dataset.motionSource;
    if (!preview || !source) return;

    if (card.dataset.motionKind === 'gif') {
      if (preview.getAttribute('src') !== source) preview.src = source;
      card.classList.add('is-previewing');
      return;
    }

    if (preview.tagName === 'VIDEO') {
      // Ensure video flags
      if (!preview.muted) preview.muted = true;
      if (!preview.loop) preview.loop = true;
      if (!preview.playsInline) preview.playsInline = true;

      // Lazy-bind source on first activation
      if (!preview.src || preview.getAttribute('src') !== source) {
        preview.src = source;
        preview.preload = 'auto';
      }

      card.classList.add('is-previewing');

      if (preview.paused) {
        const playPromise = preview.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }
    }
  }

  // Pause a single card's preview without wiping src (keeps buffered frames ready)
  function pauseCard(card) {
    if (!card) return;
    const preview = card.querySelector('.motion-project-preview');
    if (!preview) return;

    if (preview.tagName === 'VIDEO' && !preview.paused) {
      preview.pause();
    }
    card.classList.remove('is-previewing');
  }

  // Immediately pause ALL videos in #motion (0% CPU/GPU overhead)
  function pauseAll() {
    cards.forEach(pauseCard);
  }

  // Check if a card is in viewport
  function isCardInViewport(card) {
    const rect = card.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    // With a comfortable buffer so videos start playing right as they come into view
    return rect.bottom >= -80 && rect.top <= vh + 80 && rect.right >= 0 && rect.left <= vw;
  }

  // Synchronize playback of all cards based on current section & card visibility
  let syncFrame = 0;
  function syncPlayback() {
    if (syncFrame) cancelAnimationFrame(syncFrame);
    syncFrame = requestAnimationFrame(() => {
      syncFrame = 0;
      if (!isMotionActive()) {
        pauseAll();
        return;
      }

      cards.forEach(card => {
        if (isCardInViewport(card)) {
          playCard(card);
        } else {
          pauseCard(card);
        }
      });
    });
  }

  // Card-level IntersectionObserver for efficient viewport tracking
  let cardObserver = null;
  if ('IntersectionObserver' in window) {
    cardObserver = new IntersectionObserver(entries => {
      if (!isMotionActive()) {
        pauseAll();
        return;
      }
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playCard(entry.target);
        } else {
          pauseCard(entry.target);
        }
      });
    }, { rootMargin: '100px 0px', threshold: [0, 0.15] });

    cards.forEach(card => cardObserver.observe(card));
  }

  // Section-level IntersectionObserver for mobile natural scrolling
  let sectionObserver = null;
  if ('IntersectionObserver' in window) {
    sectionObserver = new IntersectionObserver(() => {
      syncPlayback();
    }, { threshold: [0, 0.05, 0.15, 0.3, 0.5] });

    sectionObserver.observe(section);
  }

  // MutationObserver on #motion for desktop panel activation (hidden, aria-hidden, class changes)
  const motionMutationObserver = new MutationObserver(() => {
    syncPlayback();
  });
  motionMutationObserver.observe(section, {
    attributes: true,
    attributeFilter: ['hidden', 'aria-hidden', 'class', 'style']
  });

  // MutationObserver on document.body for active panel tracking (data-active-panel)
  const bodyMutationObserver = new MutationObserver(() => {
    syncPlayback();
  });
  bodyMutationObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-active-panel', 'class']
  });

  // Global listeners for instant pause on leave or tab switch
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseAll();
      if (!player.paused) player.pause();
    } else {
      syncPlayback();
    }
  });

  window.addEventListener('scroll', syncPlayback, { passive: true });
  window.addEventListener('resize', syncPlayback, { passive: true });
  window.addEventListener('hashchange', syncPlayback, { passive: true });
  window.addEventListener('pageshow', syncPlayback);
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) pauseAll();
    else syncPlayback();
  });

  // Modal Dialog Case Study Controller
  const closeCase = () => {
    if (dialog.open) dialog.close();
  };

  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Pause all background cards while modal is active
      pauseAll();

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
        player.playsInline = true;
        player.loop = true;
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

    // Resume grid playback if user is still inside #motion
    syncPlayback();
  });

  // Initial sync check
  syncPlayback();
})();
