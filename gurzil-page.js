(() => {
  const menu=document.querySelector('.menu'),nav=document.getElementById('nav');
  const close=()=>{nav?.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');};
  menu?.addEventListener('click',()=>menu.setAttribute('aria-expanded',String(Boolean(nav?.classList.toggle('is-open')))));
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('is-open')){close();menu?.focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))close();});
  document.querySelector('.site-header')?.addEventListener('focusout',event=>{if(!event.currentTarget.contains(event.relatedTarget))close();});
  matchMedia('(min-width:1101px)').addEventListener('change',close);
})();
