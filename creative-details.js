/* Three restrained interactions. Nothing is hidden without a working observer. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pointer=matchMedia('(hover: hover) and (pointer: fine)');
 const links=[...document.querySelectorAll('.site-nav a,.service-item>a,.gb-footer>a,.contact-links a,footer>a,.gb-back')];
 links.forEach(link=>{
  link.classList.add('fx-link');
  const origin=event=>{const box=link.getBoundingClientRect();link.style.setProperty('--fx-link-origin',event.clientX<box.left+box.width/2?'left':'right');};
  link.addEventListener('pointerenter',origin,{passive:true});link.addEventListener('pointerleave',origin,{passive:true});
 });
 const magnetic=[...document.querySelectorAll('.gb-discover,.lab-entry-link,.brief-submit,#director-open,.case-contact-link')].filter(el=>!el.hasAttribute('data-magnetic'));
 magnetic.forEach(el=>{
  el.classList.add('fx-magnetic');let frame=0,dx=0,dy=0;
  const reset=()=>{cancelAnimationFrame(frame);frame=0;el.style.removeProperty('translate');};
  el.addEventListener('pointermove',event=>{if(reduced.matches||!pointer.matches||event.pointerType==='touch')return;const box=el.getBoundingClientRect();dx=Math.max(-7,Math.min(7,(event.clientX-box.left-box.width/2)*.1));dy=Math.max(-5,Math.min(5,(event.clientY-box.top-box.height/2)*.1));if(!frame)frame=requestAnimationFrame(()=>{frame=0;el.style.translate=dx.toFixed(1)+'px '+dy.toFixed(1)+'px';});},{passive:true});
  el.addEventListener('pointerleave',reset);el.addEventListener('blur',reset);reduced.addEventListener('change',reset);pointer.addEventListener('change',reset);
 });
 if(reduced.matches||!('IntersectionObserver' in window))return;
 const headings=[...document.querySelectorAll('main h2')].filter(h=>!h.closest('dialog,.site-preloader')&&!h.querySelector('button,a'));
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('fx-heading-visible');observer.unobserve(entry.target);}}),{threshold:0,rootMargin:'0px 0px -30px 0px'});
 headings.forEach(heading=>{
  const nodes=[...heading.childNodes];let group=document.createElement('span'),index=0;const fragment=document.createDocumentFragment();
  const append=()=>{if(!group.childNodes.length)return;const line=document.createElement('span');line.className='fx-heading-line';group.className='fx-heading-inner';group.style.setProperty('--fx-line-index',index++);line.append(group);fragment.append(line);group=document.createElement('span');};
  nodes.forEach(node=>{if(node.nodeName==='BR')append();else group.append(node);});append();heading.replaceChildren(fragment);heading.classList.add('fx-heading');observer.observe(heading);
 });
})();
