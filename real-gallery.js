/* MASSYNE / product visualization gallery — accessible, lightweight, no dependencies. */
(() => {
 "use strict";
 const gallery = document.getElementById("real-gallery-grid");
 if (!gallery) return;
 const cards = [...gallery.querySelectorAll("[data-gallery-item]")];
 const tabs = [...document.querySelectorAll("[data-gallery-mode]")];
 const more = document.getElementById("real-gallery-more");
 const windowSize = 8;
 let expanded = false;

 const showItems = () => {
   cards.forEach((card,i)=>{card.hidden = !expanded && i >= windowSize;});
   if(more) {
     more.hidden = cards.length <= windowSize;
     more.setAttribute("aria-expanded",String(expanded));
     more.textContent = expanded ? "SHOW FEWER PROJECTS ↑" : "EXPLORE ALL " + cards.length + " MOCKUPS ↓";
   }
 };
 tabs.forEach(button=>button.addEventListener("click",()=>{
   const type=button.dataset.galleryMode;
   if(!["mix","frame","wear"].includes(type))return;
   tabs.forEach(t=>t.setAttribute("aria-pressed",String(t===button)));
   cards.forEach(card=>{card.dataset.mode=type;});
 }));
 more?.addEventListener("click",()=>{
   expanded=!expanded;
   showItems();
   if(!expanded){
     const section=document.getElementById("presentation");
     if(section && section.getBoundingClientRect().top < -60) section.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
   }
 });
 showItems();
})();