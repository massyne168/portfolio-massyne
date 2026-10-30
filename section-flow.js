(() => {
  'use strict';
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const dividers=[...document.querySelectorAll('.section-flow')];
  if(!dividers.length)return;
  const sections=dividers.map(divider=>document.getElementById(divider.dataset.flowTarget)).filter(Boolean);
  sections.forEach(section=>section.classList.add('flow-section'));
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});
  },{threshold:0,rootMargin:'0px 0px -45px 0px'});
  [...dividers,...sections].forEach(el=>{
    // Keep an initial deep link or restored scroll position immediately visible.
    if(el.getBoundingClientRect().top<innerHeight-45){el.classList.add('is-visible');}
    else observer.observe(el);
  });
  document.documentElement.classList.add('flow-enabled');
})();
