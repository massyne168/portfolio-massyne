/* MASSYNE Signature Opening / 2026 V3
   Intro only on first external entry or explicit browser Reload/F5.
   Internal navigations, carousel-to-project changes and back/forward stay instant. */
(() => {
 "use strict";
 const overlay=document.querySelector(".site-preloader");
 if(!overlay)return;

 const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
 const nav=window.performance.getEntriesByType?.("navigation")?.[0];
 const navType=nav?.type||"navigate";
 let explicitProjectClick=false;
 try {
   explicitProjectClick=window.sessionStorage.getItem("massyne:skip-intro-once")==="yes";
   window.sessionStorage.removeItem("massyne:skip-intro-once");
 } catch(_){}
 let sameSiteReferrer=false;
 try {
   if(document.referrer) sameSiteReferrer=new URL(document.referrer).origin===window.location.origin;
 }catch(_){}
 // Catch all ordinary in-site link navigation (including gallery and resume).
 // The one-use flag is ignored on F5/Reload and cleared immediately on the next page.
 document.addEventListener("click", event => {
   const link=event.target?.closest?.("a[href]");
   if (!link || (event.button !== 0 && event.button !== undefined) ||
       event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
       link.target === "_blank" || link.hasAttribute("download")) return;
   try {
     const url=new URL(link.href,window.location.href);
     if (url.origin === window.location.origin) {
       window.sessionStorage.setItem("massyne:skip-intro-once","yes");
     }
   } catch (_) {}
 }, {capture:true,passive:true});
 const internalNavigation=(navType!=="reload")&&(explicitProjectClick||sameSiteReferrer||navType==="back_forward");
 if(motion.matches||internalNavigation)return;

 const count=overlay.querySelector(".loader-count");
 const bar=overlay.querySelector(".loader-progress-fill");
 const progress=overlay.querySelector('[role="progressbar"]');
 const status=overlay.querySelector(".intro-status");
 const skip=overlay.querySelector(".loader-skip");
 const initialFocus=document.activeElement;
 const blocked=[...document.querySelectorAll("header.site-header,main,footer")];
 const originalInert=blocked.map(element=>!!element.inert);
 const DURATION=1880;
 const LEAVE=490;
 let raf=0,watchdog=0,done=false,previous=-1;

 const setProgress=(value)=>{
   const bounded=Math.max(0,Math.min(100,Math.floor(value)));
   if(bounded===previous)return;
   previous=bounded;
   if(count)count.textContent=String(bounded).padStart(2,"0");
   if(bar)bar.style.transform="scaleX("+(bounded/100).toFixed(4)+")";
   if(progress)progress.setAttribute("aria-valuenow",String(bounded));
   if(status)status.textContent=bounded===100?"READY / ENTER THE WORK":bounded>=63?"COMPOSING THE EXPERIENCE":bounded>=26?"SELECTING THE VISUALS":"OPENING THE STUDIO";
 };
 const finish=()=>{
   if(done)return;
   done=true;
   window.cancelAnimationFrame(raf);
   window.clearTimeout(watchdog);
   setProgress(100);
   document.documentElement.classList.remove("intro-active");
   document.body.classList.remove("intro-active");
   blocked.forEach((node,i)=>{node.inert=originalInert[i];});
   overlay.classList.add("is-leaving");
   overlay.setAttribute("aria-hidden","true");
   if(document.activeElement===skip){
     if(initialFocus && initialFocus!==document.body && typeof initialFocus.focus==="function") initialFocus.focus({preventScroll:true});
     else document.querySelector(".site-header .brand-logo")?.focus({preventScroll:true});
   }
   window.setTimeout(()=>{overlay.hidden=true;},LEAVE);
 };
 overlay.hidden=false;
 overlay.setAttribute("aria-hidden","false");
 document.documentElement.classList.add("intro-active");
 document.body.classList.add("intro-active");
 blocked.forEach(el=>{el.inert=true});
 setProgress(0);
 skip?.addEventListener("click",finish);
 const start=window.performance.now();
 const tick=now=>{
   if(done)return;
   setProgress((now-start)/DURATION*100);
   if(now-start>=DURATION)finish();
   else raf=window.requestAnimationFrame(tick);
 };
 raf=window.requestAnimationFrame(tick);
 watchdog=window.setTimeout(finish,DURATION+1200);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)finish()});
 window.addEventListener("pagehide",finish,{once:true});
})();
