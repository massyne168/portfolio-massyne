(()=>{'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const body=document.body;
const orb=document.createElement('div');orb.className='cinema-orb';orb.setAttribute('aria-hidden','true');body.appendChild(orb);
const grain=document.createElement('div');grain.className='cinema-grain';grain.setAttribute('aria-hidden','true');body.appendChild(grain);
let tx=innerWidth*.72,ty=innerHeight*.3,x=tx,y=ty;
if(!reduce){window.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY},{passive:true});const move=()=>{x+=(tx-x)*.075;y+=(ty-y)*.075;orb.style.left=x+'px';orb.style.top=y+'px';requestAnimationFrame(move)};move();}
const reveal=document.querySelectorAll('.hero-meta,.hero-title,.hero-image,.hero-footer,.section-head,.project,.identity-top,.about,.contact,.service-card');
reveal.forEach(el=>el.setAttribute('data-cinema-reveal',''));
if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -35px 0px'});reveal.forEach(el=>io.observe(el))}else reveal.forEach(el=>el.classList.add('is-visible'));
const cards=document.querySelectorAll('.project,.hero-image');
if(!reduce&&matchMedia('(pointer:fine)').matches){cards.forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;card.style.transform='perspective(900px) rotateY('+px*4+'deg) rotateX('+(-py*3)+'deg) translateY(-3px)'},{passive:true});card.addEventListener('pointerleave',()=>{card.style.transform=''})})}
const hero=document.querySelector('.hero-title h1');if(hero&&!reduce){hero.animate([{opacity:0,filter:'blur(12px)',transform:'translateY(24px)'},{opacity:1,filter:'blur(0)',transform:'translateY(0)'}],{duration:1300,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'})}
})();