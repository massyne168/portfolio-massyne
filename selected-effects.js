/* Selected effects 6 / 7 / 13 / 18 / 20, with bounded work and static fallbacks. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const scene=document.querySelector('#identity.gb-teaser');
 const chapters=[...document.querySelectorAll('#process,#services')];
 let frame=0;
 function update(){frame=0;if(reduced.matches){scene?.style.setProperty('--scene-shift','0');chapters.forEach(el=>el.style.setProperty('--chapter-progress','1'));return;}if(scene){const r=scene.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)scene.style.setProperty('--scene-shift',String(Math.max(-24,Math.min(24,((r.top+r.height/2-innerHeight/2)/innerHeight)*40))));}chapters.forEach(el=>{const r=el.getBoundingClientRect();const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight*.7)));el.style.setProperty('--chapter-progress',String(p));});}
 const queue=()=>{if(!frame)frame=requestAnimationFrame(update);};addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);reduced.addEventListener('change',queue);update();
 document.querySelectorAll('.spotlight-card').forEach(card=>{let pending=0,x=0,y=0;const reset=()=>{cancelAnimationFrame(pending);pending=0;card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');};card.classList.add('selected-tilt');card.addEventListener('pointermove',event=>{if(reduced.matches||!fine.matches||event.pointerType==='touch')return;const r=card.getBoundingClientRect();x=Math.max(-4,Math.min(4,-((event.clientY-r.top)/r.height-.5)*8));y=Math.max(-4,Math.min(4,((event.clientX-r.left)/r.width-.5)*8));if(!pending)pending=requestAnimationFrame(()=>{pending=0;card.style.setProperty('--tilt-x',x+'deg');card.style.setProperty('--tilt-y',y+'deg');});},{passive:true});card.addEventListener('pointerleave',reset);card.addEventListener('blur',reset);fine.addEventListener('change',reset);reduced.addEventListener('change',reset);});
 const cycle=document.querySelector('.discipline-cycle'),strip=cycle?.querySelector('.discipline-strip');let timer=null,word=0;
 function stop(){clearInterval(timer);timer=null;}
 function start(){if(timer||reduced.matches||document.hidden)return;timer=setInterval(()=>{word=(word+1)%3;strip.style.setProperty('--discipline-index',String(word));},2700);}
 if(cycle&&'IntersectionObserver'in window){let visible=false;const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();});observer.observe(cycle);document.addEventListener('visibilitychange',()=>{if(visible&&!document.hidden)start();else stop();});reduced.addEventListener('change',()=>{stop();if(reduced.matches){word=0;strip.style.setProperty('--discipline-index','0');}else if(visible)start();});}
 const shell=document.querySelector('.footer-reveal-shell'),footer=shell?.querySelector('footer');
 if(shell&&footer&&CSS.supports('clip-path','inset(0)')){shell.classList.add('footer-reveal-ready');const measure=()=>shell.style.setProperty('--footer-height',Math.max(180,footer.scrollHeight)+'px');measure();if('ResizeObserver'in window)new ResizeObserver(measure).observe(footer);}
})();
