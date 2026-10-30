/* Native range supports touch, pointer and keyboard without animation. */
(() => {
  'use strict';
  document.querySelectorAll('.comparison').forEach(comparison => {
    const range = comparison.querySelector('.comparison-range');
    if (!range) return;
    const update = () => {
      comparison.style.setProperty('--reveal', range.value + '%');
      range.setAttribute('aria-valuetext', range.value + '% metal finish revealed');
    };
    range.addEventListener('input', update);
    update();
  });
})();
