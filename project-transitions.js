/* Image-led project navigation with an ordinary-link fallback. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let navigating=false;
 const clear=()=>{document.querySelectorAll('.takeover-panel').forEach(e=>e.remove());document.documentElement.classList.remove('project-is-leaving');navigating=false};
 window.addEventListener('pageshow',clear);
 let arrival;
 try{arrival=JSON.parse(sessionStorage.getItem('massyne:takeover')||'null');sessionStorage.removeItem('massyne:takeover')}catch{}
 if(arrival&&!reduced.matches&&arrival.path===location.pathname&&Date.now()-arrival.time<10000){
   const panel=document.createElement('div');panel.className='takeover-panel';panel.setAttribute('aria-hidden','true');
   const img=document.createElement('img');img.src=arrival.src;img.alt='';panel.append(img);document.body.append(panel);
   panel.animate([{opacity:1},{opacity:0}],{duration:650,easing:'ease-out',fill:'forwards'}).finished.then(()=>panel.remove());
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.download||link.target==='_blank'||navigating||reduced.matches)return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||url.pathname===location.pathname||!/^https?:$/.test(url.protocol))return;
  const route=/\/projects\/[^/]+\.html$/.test(url.pathname);
  const backToGallery=url.pathname==='/'&&url.hash==='#work';
  if(!route&&!backToGallery)return;
  const source=link.querySelector('img')||link.closest('.project,.spotlight-card')?.querySelector('img')||link.closest('.director-dialog')?.querySelector('img');
  if(!source||!source.complete||!source.naturalWidth)return;
  const rect=source.getBoundingClientRect();
  if(rect.width<5||rect.height<5)return;
  event.preventDefault();navigating=true;
  try{sessionStorage.setItem('massyne:takeover',JSON.stringify({path:url.pathname,src:source.currentSrc||source.src,time:Date.now()}))}catch{}
  const panel=document.createElement('div');panel.className='takeover-panel';panel.setAttribute('aria-hidden','true');panel.style.background='transparent';
  const img=document.createElement('img');img.src=source.currentSrc||source.src;img.alt='';
  Object.assign(img.style,{position:'absolute',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',objectFit:'contain'});
  panel.append(img);document.body.append(panel);
  panel.animate([{backgroundColor:'transparent'},{backgroundColor:'#09090c'}],{duration:450,fill:'forwards'});
  img.animate([{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'},{left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px'}],{duration:450,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
  setTimeout(()=>location.assign(url.href),460);
 },true);
})();
