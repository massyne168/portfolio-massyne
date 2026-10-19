/* MASSYNE visible desktop creative cursor — no drag interception. */
(() => {
 "use strict";
 const fine=matchMedia("(hover: hover) and (pointer: fine)");
 const reduced=matchMedia("(prefers-reduced-motion: reduce)");
 if(!fine.matches||reduced.matches)return;
 const cursor=document.createElement("div");
 cursor.className="creative-cursor";
 cursor.setAttribute("aria-hidden","true");
 cursor.innerHTML='<span class="creative-cursor-dot"></span><span class="creative-cursor-label">VIEW PROJECT ↗</span>';
 document.body.appendChild(cursor);
 let raf=0,x=-90,y=-90;
 const paint=()=>{raf=0;cursor.style.transform=`translate3d(${x}px,${y}px,0)`};
 document.addEventListener("pointermove",event=>{
   if(event.pointerType==="touch"||reduced.matches)return;
   x=event.clientX;y=event.clientY;
   if(!raf)raf=requestAnimationFrame(paint);
   cursor.classList.toggle("is-visible",!document.documentElement.classList.contains("intro-active"));
   const card=event.target.closest?.(".project.image-open, .archive-item.image-open");
   const dragging=Boolean(event.buttons||document.querySelector(".project-grid.is-dragging"));
   cursor.classList.toggle("is-project",Boolean(card&&!dragging));
 },{passive:true});
 document.addEventListener("pointerdown",()=>cursor.classList.remove("is-project"),{passive:true});
 document.addEventListener("pointerout",event=>{if(!event.relatedTarget)cursor.classList.remove("is-visible")},{passive:true});
 window.addEventListener("blur",()=>cursor.classList.remove("is-visible"));
 reduced.addEventListener?.("change",()=>{cursor.hidden=reduced.matches});
})();