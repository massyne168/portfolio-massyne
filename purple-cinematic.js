/* Deliberately lightweight: no animation loops, fixed overlays, or pointer tracking. */
(()=>{'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce)return;
const gallery=document.querySelector('.project-grid');
if(gallery)gallery.classList.add('purple-gallery-ready');
})();