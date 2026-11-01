/* Lightweight reveal and pointer motion shared by the portfolio and case studies. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (reduced.matches) return;

  const revealSelector = 'main > section, .section-flow, .project-grid > .project, .spotlight-card, .service-item, .about-v2-stats > div, .tools > li, .case-related-card, .case-chapter-link';
  const revealTargets = [...document.querySelectorAll(revealSelector)]
    .filter(el => !el.closest('dialog,.site-preloader,[hidden]'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('motion-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    revealTargets.forEach((el, index) => {
      el.dataset.motionReveal = '';
      const siblingIndex = [...el.parentElement.children].filter(node => node.matches(revealSelector)).indexOf(el);
      el.style.setProperty('--motion-delay', `${Math.min(Math.max(siblingIndex, 0) * 65, 260)}ms`);
      observer.observe(el);
    });
  }

  document.querySelectorAll('.project-grid .project, .spotlight-art, .case-related-art').forEach(el => {
    if (el.querySelector('img')) el.dataset.motionImage = '';
  });

  if (!finePointer.matches) return;
  const magneticTargets = document.querySelectorAll('[data-magnetic],.hero-v2-actions a,.contact-v2-button,.brief-actions button');
  magneticTargets.forEach(el => {
    let frame = 0, x = 0, y = 0;
    const reset = () => { cancelAnimationFrame(frame); frame = 0; el.style.removeProperty('transform'); };
    el.addEventListener('pointermove', event => {
      if (reduced.matches || event.pointerType === 'touch') return;
      const box = el.getBoundingClientRect();
      x = Math.max(-5, Math.min(5, (event.clientX - box.left - box.width / 2) * .07));
      y = Math.max(-4, Math.min(4, (event.clientY - box.top - box.height / 2) * .08));
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; });
    }, { passive: true });
    el.addEventListener('pointerleave', reset);
    el.addEventListener('blur', reset);
    reduced.addEventListener('change', reset);
  });
})();
