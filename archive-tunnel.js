/* Progressive Archive tunnel. No autoplay; vertical page scrolling remains native. */
(() => {
 'use strict';
 const grid=document.querySelector('#archive .archive-grid');
 if(!grid)return;
 const all=[...grid.querySelectorAll('.archive-item')];
 if(!all.length)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const wrap=document.createElement('div');wrap.className='archive-tunnel';
 grid.before(wrap);wrap.append(grid);
 grid.classList.add('archive-tunnel-stage');grid.tabIndex=0;
 grid.setAttribute('role','region');grid.setAttribute('aria-roledescription','carousel');
 grid.setAttribute('aria-label','Archive design tunnel. Drag horizontally or use left and right arrow keys to explore.');
 const controls=document.createElement('div');controls.className='tunnel-controls';
 controls.innerHTML='<button type="button" class="tunnel-prev" aria-label="Previous archive pair">←</button><div><span class="tunnel-kicker">THE DESIGN TUNNEL</span><strong class="tunnel-count" role="status" aria-live="polite" aria-atomic="true"></strong><span class="tunnel-hint">DRAG TO EXPLORE / CLICK ARTWORK TO OPEN</span></div><button type="button" class="tunnel-next" aria-label="Next archive pair">→</button>';
 wrap.after(controls);
 const prev=controls.querySelector('.tunnel-prev'),next=controls.querySelector('.tunnel-next'),count=controls.querySelector('.tunnel-count');
 let cards=[],position=0,pairs=0,drag=null,offset=0,raf=0,suppressUntil=0;
 const clamp=value=>Math.max(0,Math.min(Math.max(0,pairs-1),value));
 const render=()=>{
  raf=0;
  const camera=clamp(position+offset);
  const narrow=grid.clientWidth<650;
  const x=narrow?grid.clientWidth*.24:Math.min(320,grid.clientWidth*.25);
  grid.style.setProperty("--tunnel-card-width",narrow?Math.min(170,grid.clientWidth*.36)+"px":"clamp(170px,23vw,280px)");
  const zStep=narrow?300:360;
  cards.forEach((card,i)=>{
   const depth=Math.floor(i/2)-camera,side=i%2===0?-1:1;
   const outside=depth<-.8||depth>3.6;
   const front=Math.floor(i/2)===position;
   card.style.setProperty('--tunnel-x',side*x+'px');
   card.style.setProperty('--tunnel-z',-depth*zStep+'px');
   card.style.setProperty('--tunnel-angle',side*(narrow?-20:-32)+'deg');
   card.style.setProperty('--tunnel-opacity',outside?'0':String(Math.max(.18,1-Math.max(0,depth)*.23)));
   card.style.zIndex=String(50-Math.floor(depth*10));
   card.classList.toggle('tunnel-outside',outside);
   card.classList.toggle('tunnel-front',front);
   card.inert=!front;card.tabIndex=front?0:-1;
   card.setAttribute('aria-hidden',String(!front));
   if(depth>=0&&depth<=3.6)card.querySelector('img')?.setAttribute('loading','eager');
  });
  prev.disabled=position===0;next.disabled=position>=pairs-1;
  count.textContent=cards.length?`${String(position*2+1).padStart(2,'0')}–${String(Math.min(position*2+2,cards.length)).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')} WORKS`:'NO WORKS';
  grid.dataset.tunnelPosition=String(position);
 };
 const schedule=()=>{if(!raf)raf=requestAnimationFrame(render)};
 const go=value=>{position=clamp(value);offset=0;render()};
 const refresh=()=>{
  all.forEach(card=>{card.inert=false;card.removeAttribute('aria-hidden');card.classList.remove('tunnel-outside','tunnel-front')});
  cards=all.filter(card=>!card.hidden&&!card.classList.contains('is-hidden'));pairs=Math.ceil(cards.length/2);position=0;offset=0;drag=null;grid.classList.remove('is-tunnel-dragging');render();
 };
 prev.addEventListener('click',()=>go(position-1));next.addEventListener('click',()=>go(position+1));
 grid.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();go(position+(event.key==='ArrowRight'?1:-1))}
  if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:pairs-1)}
 });
 grid.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
 grid.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('button,a'))return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,moving:false}});
 grid.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moving&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.15){drag.moving=true;grid.classList.add('is-tunnel-dragging');try{grid.setPointerCapture(event.pointerId)}catch{}}
  if(!drag.moving)return;
  drag.dx=dx;offset=motion.matches?0:-dx/(grid.clientWidth<650?170:300);schedule();
 });
 const finish=(event,cancelled=false)=>{
  if(!drag||drag.id!==event.pointerId)return;
  const old=drag;drag=null;grid.classList.remove('is-tunnel-dragging');offset=0;
  if(old.moving){suppressUntil=performance.now()+350;go(position+(!cancelled&&Math.abs(old.dx)>40?(old.dx<0?1:-1):0))}
  else schedule();
  try{if(grid.hasPointerCapture(event.pointerId))grid.releasePointerCapture(event.pointerId)}catch{}
 };
 grid.addEventListener('pointerup',event=>finish(event));grid.addEventListener('pointercancel',event=>finish(event,true));grid.addEventListener('lostpointercapture',event=>finish(event,true));
 let wheelAt=0;
 grid.addEventListener('wheel',event=>{
  const horizontal=Math.abs(event.deltaX)>Math.abs(event.deltaY)*1.1;
  if(!horizontal&&!event.shiftKey)return;
  event.preventDefault();const now=performance.now();if(now-wheelAt<400)return;wheelAt=now;
  go(position+Math.sign(horizontal?event.deltaX:event.deltaY));
 },{passive:false});
 grid.addEventListener('archivefilterchange',refresh);window.addEventListener('resize',schedule,{passive:true});motion.addEventListener('change',()=>{offset=0;schedule()});
 refresh();
})();
