/* Native range supports touch, pointer and keyboard without animation. */
(() => {
  'use strict';
  document.querySelectorAll('.comparison').forEach(comparison => {
    const range = comparison.querySelector('.comparison-range');
    if (!range) return;
    const update = () => {
      comparison.style.setProperty('--reveal', range.value + '%');
      range.setAttribute('aria-valuetext', range.value + '% final identity revealed');
    };
    range.addEventListener('input', update);
    update();
  });

  // Fade the real identity comparison into view once, with a static fallback.
  const process = document.getElementById('process');
  const revealItems = [...(process?.querySelectorAll('[data-process-reveal]') || [])];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (process && revealItems.length && !reducedMotion.matches && 'IntersectionObserver' in window) {
    process.classList.add('process-motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(item => observer.observe(item));
  }
})();
