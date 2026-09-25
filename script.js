const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu(){navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const filters = document.querySelectorAll('[data-archive-filter]');
filters.forEach(button=>{button.setAttribute('aria-pressed',String(button.classList.contains('is-active')));button.addEventListener('click',()=>{filters.forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});document.querySelectorAll('.archive-card').forEach(card=>{card.hidden=button.dataset.archiveFilter!=='all'&&!card.dataset.category.split(' ').includes(button.dataset.archiveFilter);});});});
const dialog=document.querySelector('#artwork-dialog');
const preview=dialog.querySelector('.preview-image');
const title=dialog.querySelector('#preview-title');
const images=[...document.querySelectorAll('.project-image img,.archive-card img,.gurzil-image-card img,.gurzil-logo-card img')].filter(img=>!img.closest('[data-lightbox-disabled]'));
let current=0;
let opener;
function available(){return images.filter(img=>!img.closest('[hidden]'));}
function render(index){const list=available();current=(index+list.length)%list.length;const img=list[current];preview.src=img.src;preview.alt=img.alt;title.textContent=img.closest('.project-card')?.querySelector('dd')?.textContent||img.alt;dialog.querySelector('.preview-count').textContent=`${current+1} / ${list.length}`;}
images.forEach(img=>{const button=document.createElement('button');button.type='button';button.className='artwork-open';button.setAttribute('aria-label',`View ${img.closest('.project-card')?.querySelector('dd')?.textContent||img.alt}`);img.before(button);button.append(img);button.addEventListener('click',()=>{opener=button;render(available().indexOf(img));dialog.showModal();});});
dialog.querySelector('.preview-close').addEventListener('click',()=>dialog.close());
dialog.querySelector('.preview-prev').addEventListener('click',()=>render(current-1));
dialog.querySelector('.preview-next').addEventListener('click',()=>render(current+1));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();render(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();render(current-1);}});
dialog.addEventListener('close',()=>{preview.removeAttribute('src');opener?.focus({preventScroll:true});});
const videos=[...document.querySelectorAll('video')];
videos.forEach(video=>video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause();})));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)entry.target.pause();}),{threshold:0});videos.forEach(video=>observer.observe(video));}

// Motion is progressive enhancement: content never waits for animation to appear.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
const runningEffects = new Set();
function animateDetail(element, frames, options = {}) {
  if (motionPreference.matches || !element.animate) return;
  const effect = element.animate(frames, { duration: 550, easing: 'cubic-bezier(.2,.7,.2,1)', ...options });
  runningEffects.add(effect);
  effect.finished.catch(() => {}).finally(() => runningEffects.delete(effect));
}
// A brief editorial entrance, with no loading screen or blocked navigation.
document.querySelectorAll('.hero-topline, .hero h1, .hero-intro > *').forEach((element, index) => {
  animateDetail(element, [{ opacity: .65, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { delay: Math.min(index * 45, 180) });
});
if ('IntersectionObserver' in window) {
  const textReveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateDetail(entry.target, [{ opacity: .65, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }]);
      textReveal.unobserve(entry.target);
    });
  }, { threshold: .15 });
  document.querySelectorAll('.section-heading h2, .section-heading .kicker, .about-layout h2, .contact-invitation h2, .chapter-break').forEach(element => textReveal.observe(element));
}
// Native hash navigation retains browser history, keyboard behavior and smooth scrolling.
// Dialog and filter changes get short local transitions, never a full-page overlay.
new MutationObserver(() => {
  if (dialog.open) animateDetail(dialog, [{ opacity: .8, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
}).observe(dialog, { attributes: true, attributeFilter: ['open'] });
filters.forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.archive-card:not([hidden])').forEach((card, index) => {
    animateDetail(card, [{ opacity: .75, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: Math.min(index * 15, 90) });
  });
}));
// Only visible images move, at most 7px inside their existing generous matting.
// No perpetual animation loop, wheel interception, or scroll-position writes.
const driftTargets = [...document.querySelectorAll('.hero-art > img, .project-card:not([data-lightbox-disabled]) .project-image img')];
const visibleDrift = new Set();
let driftObserver;
let driftFrame = 0;
function paintDrift() {
  driftFrame = 0;
  const height = innerHeight;
  const positions = [...visibleDrift].map(img => ({ img, rect: img.closest('.hero-art, .project-image').getBoundingClientRect() }));
  positions.forEach(({ img, rect }) => {
    const progress = Math.max(-1, Math.min(1, (height / 2 - rect.top - rect.height / 2) / height));
    img.style.setProperty('--image-drift', `${(progress * 7).toFixed(2)}px`);
  });
}
function requestDrift() {
  if (!driftFrame && visibleDrift.size && !document.hidden) driftFrame = requestAnimationFrame(paintDrift);
}
function configureDrift() {
  driftObserver?.disconnect();
  visibleDrift.clear();
  cancelAnimationFrame(driftFrame);
  driftFrame = 0;
  window.removeEventListener('scroll', requestDrift);
  window.removeEventListener('resize', requestDrift);
  driftTargets.forEach(img => img.style.removeProperty('--image-drift'));
  if (motionPreference.matches || !finePointer.matches || !('IntersectionObserver' in window)) return;
  driftObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visibleDrift.add(entry.target) : visibleDrift.delete(entry.target));
    requestDrift();
  });
  driftTargets.forEach(img => driftObserver.observe(img));
  window.addEventListener('scroll', requestDrift, { passive: true });
  window.addEventListener('resize', requestDrift, { passive: true });
}
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) runningEffects.forEach(effect => effect.cancel());
  configureDrift();
});
finePointer.addEventListener('change', configureDrift);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(driftFrame); driftFrame = 0; }
  else requestDrift();
});
configureDrift();