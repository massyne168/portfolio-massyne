/* Shared header interaction for this self-contained identity presentation. */
(() => {
  const themedArtwork=document.querySelectorAll('.showcase .emblem,.grid-panel .emblem,.concept-card .emblem,.concept-cover .emblem');
  const syncArtwork=()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    themedArtwork.forEach(image=>{
      image.src=dark?'images/red-emblem/Gurzilaf.png':'images/red-emblem/Gurzilafdw.png';
      image.alt='Supplied red emblem on a '+(dark?'dark':'white')+' background';
    });
  };
  syncArtwork();
  new MutationObserver(syncArtwork).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const menu=document.querySelector('.menu'),nav=document.getElementById('nav');
  const close=()=>{nav?.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');};
  menu?.addEventListener('click',()=>{const open=nav?.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(Boolean(open)));});
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('is-open')){close();menu?.focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))close();});
  document.querySelector('.site-header')?.addEventListener('focusout',event=>{if(!event.currentTarget.contains(event.relatedTarget))close();});
  matchMedia('(min-width:851px)').addEventListener('change',close);
})();
