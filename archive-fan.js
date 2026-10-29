/* Archive Artwork Fan. 2-second autoplay with pause and original image viewer. */
(() => {
 'use strict';
 const grid=document.querySelector('#archive .archive-grid');
 if(!grid)return;
 const all=[...grid.querySelectorAll('.archive-item')];
 if(!all.length)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const wrap=document.createElement('div');wrap.className='archive-fan';
 grid.before(wrap);wrap.append(grid);
 grid.classList.add('archive-fan-stage');grid.tabIndex=0;
 grid.setAttribute('role','region');grid.setAttribute('aria-roledescription','carousel');
 grid.setAttribute('aria-label','Archive design fan. Drag horizontally or use left and right arrow keys to explore.');
 const controls=document.createElement('div');controls.className='fan-controls';
 controls.innerHTML='<button type="button" class="fan-prev" aria-label="Previous archive artwork">←</button><div><span class="fan-kicker">THE ARTWORK FAN</span><strong class="fan-count" role="status" aria-live="polite" aria-atomic="true"></strong><span class="fan-hint">DRAG TO EXPLORE / CLICK ARTWORK TO OPEN</span></div><button type="button" class="fan-next" aria-label="Next archive artwork">→</button>';
 wrap.after(controls);
 const prev=controls.querySelector('.fan-prev'),next=controls.querySelector('.fan-next'),count=controls.querySelector('.fan-count');
 let cards=[],position=0,pairs=0,drag=null,offset=0,raf=0,suppressUntil=0;
 const clamp=value=>pairs?(value%pairs+pairs)%pairs:0;
 const render=()=>{
  raf=0;
  const camera=clamp(position+offset);
  const narrow=grid.clientWidth<650;
  grid.style.setProperty('--fan-card-width',narrow?'min(48vw,185px)':'clamp(210px,22vw,280px)');
  cards.forEach((card,i)=>{
   let distance=i-camera;
   if(distance>pairs/2)distance-=pairs;
   if(distance<-pairs/2)distance+=pairs;
   const amount=Math.abs(distance),outside=amount>3.45,front=i===position;
   card.style.setProperty('--fan-x',distance*(narrow?24:48)+'px');
   card.style.setProperty('--fan-y',(front?-18:amount*(narrow?8:12))+'px');
   card.style.setProperty('--fan-z',(front?45:-amount*35)+'px');
   card.style.setProperty('--fan-angle',distance*(narrow?14:12)+'deg');
   card.style.setProperty('--fan-scale',front?'1.04':'.96');
   card.style.setProperty('--fan-opacity',outside?'0':String(Math.max(.45,1-amount*.12)));
   card.style.zIndex=String(100-Math.round(amount*20));
   card.classList.toggle('fan-outside',outside);card.classList.toggle('fan-front',front);
   card.inert=outside;card.tabIndex=front?0:-1;
   card.setAttribute('aria-hidden',String(!front));
   if(!outside)card.querySelector('img')?.setAttribute('loading','eager');
  });
  prev.disabled=cards.length<2;next.disabled=cards.length<2;
  count.textContent=cards.length?`${String(position+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')} WORKS`:'NO WORKS';
  grid.dataset.fanPosition=String(position);
 };
 const schedule=()=>{if(!raf)raf=requestAnimationFrame(render)};
 const go=value=>{position=clamp(value);offset=0;render()};
 const refresh=()=>{
  all.forEach(card=>{card.inert=false;card.removeAttribute('aria-hidden');card.classList.remove('fan-outside','fan-front')});
  cards=all.filter(card=>!card.hidden&&!card.classList.contains('is-hidden'));pairs=cards.length;position=0;offset=0;drag=null;grid.classList.remove('is-fan-dragging');render();
 };
 prev.addEventListener('click',()=>go(position-1));next.addEventListener('click',()=>go(position+1));
 grid.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();go(position+(event.key==='ArrowRight'?1:-1))}
  if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:pairs-1)}
 });
 grid.addEventListener('click',event=>{
  if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();return}
  const card=event.target.closest('.archive-item'),index=cards.indexOf(card);
  if(index>=0&&index!==position){event.preventDefault();event.stopImmediatePropagation();go(index)}
 },true);
 grid.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('button,a'))return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,moving:false}});
 grid.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moving&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.15){drag.moving=true;grid.classList.add('is-fan-dragging');try{grid.setPointerCapture(event.pointerId)}catch{}}
  if(!drag.moving)return;
  drag.dx=dx;offset=motion.matches?0:-dx/(grid.clientWidth<650?170:300);schedule();
 });
 const finish=(event,cancelled=false)=>{
  if(!drag||drag.id!==event.pointerId)return;
  const old=drag;drag=null;grid.classList.remove('is-fan-dragging');offset=0;
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
 const playback=document.createElement('button');
 playback.type='button';playback.className='fan-playback';
 controls.querySelector('div').append(playback);
 let paused=false,hovering=false,visible=false,timer=null;
 const syncPlayback=()=>{
  playback.textContent=paused?'PLAY / 2s':'PAUSE / 2s';
  playback.setAttribute('aria-label',paused?'Resume automatic archive playback':'Pause automatic archive playback');
  playback.setAttribute('aria-pressed',String(paused));
  playback.hidden=motion.matches;
  count.setAttribute('aria-live',paused?'polite':'off');
 };
 const tick=()=>{
  if(paused||hovering||drag||motion.matches||document.hidden||!visible||cards.length<2||document.querySelector('.lightbox')?.open||grid.contains(document.activeElement))return;
  go(position+1);
 };
 const updateTimer=()=>{
  if(timer){clearInterval(timer);timer=null;}
  if(visible&&!document.hidden&&!motion.matches&&!paused)timer=setInterval(tick,2000);
 };
 playback.addEventListener('click',()=>{paused=!paused;syncPlayback();updateTimer()});
 wrap.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hovering=true});
 wrap.addEventListener('pointerleave',()=>{hovering=false});
 document.addEventListener('visibilitychange',updateTimer);
 motion.addEventListener('change',()=>{syncPlayback();updateTimer()});
 if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);updateTimer()},{threshold:.25}).observe(wrap)}
 else{visible=true;updateTimer()}
 refresh();syncPlayback();
})();
