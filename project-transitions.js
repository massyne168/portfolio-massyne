/* Same-origin project link transitions. No navigation trapping or loader replay. */
(() => {
 "use strict";
 if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 let navigating=false;
 document.addEventListener("click",event=>{
   const link=event.target.closest?.("a[href]");
   if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.download||link.target==="_blank"||navigating)return;
   const url=new URL(link.href,location.href);
   if(url.origin!==location.origin||url.pathname===location.pathname||url.protocol!=="https:"&&url.protocol!=="http:")return;
   const route=/\/projects\/[^/]+\.html$/.test(url.pathname);
   const backToGallery=url.pathname==="/"&&url.hash==="#work";
   if(!route&&!backToGallery)return;
   event.preventDefault();
   navigating=true;
   document.documentElement.classList.add("project-is-leaving");
   const go=()=>location.assign(url.href);
   setTimeout(go,180);
   window.addEventListener("pageshow",()=>{navigating=false;document.documentElement.classList.remove("project-is-leaving")},{once:true});
 },true);
})();