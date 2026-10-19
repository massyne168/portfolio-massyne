/* MASSYNE — Signature Fade v5 / Clean Studio Entrance.
   Display on FIRST ENTRY per tab or explicit browser Reload / F5 only.
   Do not replay on gallery → case study → next/previous → back to home.
   Keep this lightweight, accessible, interruptible and reduced-motion safe. */
(() => {
  "use strict";
  const overlay=document.querySelector(".site-preloader");
  if(!overlay)return;
  const html=document.documentElement,body=document.body;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const navType=window.performance.getEntriesByType?.("navigation")?.[0]?.type || "navigate";
  const storageKey="massyne:studio-intro-seen";
  const navigationKey="massyne:skip-intro-once";
  let seen=false,followingInternalLink=false;
  try {
    seen=window.sessionStorage.getItem(storageKey)==="yes";
    followingInternalLink=window.sessionStorage.getItem(navigationKey)==="yes";
    window.sessionStorage.removeItem(navigationKey);
  }catch(_){}
  // Internal navigation must never trigger the overlay, even if the destination
  // doesn't have the full site's navigational JavaScript.
  let sameSiteReferrer=false;
  try {
    if(document.referrer) sameSiteReferrer=new URL(document.referrer).origin===window.location.origin;
  }catch(_){}
  document.addEventListener("click",event=>{
    const link=event.target?.closest?.("a[href]");
    if(!link||event.defaultPrevented||(event.button!==0&&event.button!==undefined)||
        event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||
        link.target==="_blank"||link.hasAttribute("download"))return;
    try {
      const href=new URL(link.href,window.location.href);
      if(href.origin===window.location.origin){
        window.sessionStorage.setItem(storageKey,"yes");
        window.sessionStorage.setItem(navigationKey,"yes");
      }
    }catch(_){}
  },{capture:true,passive:true});

  // Never interrupt ordinary case-study navigation, even if session storage
  // or referrer metadata is unavailable. Explicit F5 still replays the intro.
  const onProjectPage=body.classList.contains("case-study-page") ||
    !!document.getElementById("case-content") ||
    /^\/projects\//.test(window.location.pathname);
  const shouldSkip=motion.matches ||
    (navType!=="reload"&&(onProjectPage||seen||followingInternalLink||sameSiteReferrer||navType==="back_forward"));
  const blocked=[...document.querySelectorAll("header.site-header,main,footer")];
  const release=()=>{
    overlay.hidden=true;
    overlay.setAttribute("aria-hidden","true");
    html.classList.remove("intro-active");
    body.classList.remove("intro-active");
    blocked.forEach(node=>{node.inert=false});
  };
  if(shouldSkip){release();return}

  try{window.sessionStorage.setItem(storageKey,"yes")}catch(_){}
  const count=overlay.querySelector(".loader-count");
  const bar=overlay.querySelector(".loader-progress-fill");
  const progress=overlay.querySelector('[role="progressbar"]');
  const status=overlay.querySelector(".intro-status");
  const skip=overlay.querySelector(".loader-skip");
  const previousInert=blocked.map(node=>!!node.inert);
  const originalFocus=document.activeElement;
  const duration=5000,fade=340;
  let raf=0,watchdog=0,exitTimer=0,finished=false,lastNumber=-1;

  const render=value=>{
    const percent=Math.max(0,Math.min(100,Math.floor(value)));
    if(percent===lastNumber)return;
    lastNumber=percent;
    if(count)count.textContent=String(percent).padStart(2,"0");
    if(bar)bar.style.transform="scaleX("+(percent/100).toFixed(4)+")";
    if(progress)progress.setAttribute("aria-valuenow",String(percent));
    if(status)status.textContent=percent===100?"WELCOME TO MASSYNE":"OPENING PORTFOLIO";
  };
  const finish=({instant=false}={})=>{
    if(finished)return;
    finished=true;
    window.cancelAnimationFrame(raf);
    window.clearTimeout(watchdog);
    render(100);
    html.classList.remove("intro-active");
    body.classList.remove("intro-active");
    blocked.forEach((node,i)=>{node.inert=previousInert[i]});
    overlay.setAttribute("aria-hidden","true");
    if(document.activeElement===skip){
      const target=originalFocus&&originalFocus!==body?originalFocus:document.querySelector(".site-header .brand-logo");
      target?.focus?.({preventScroll:true});
    }
    if(instant){overlay.hidden=true;return}
    overlay.classList.add("is-leaving");
    exitTimer=window.setTimeout(()=>{overlay.hidden=true},fade);
  };

  overlay.hidden=false;
  overlay.classList.remove("is-leaving");
  overlay.setAttribute("aria-hidden","false");
  html.classList.add("intro-active");
  body.classList.add("intro-active");
  blocked.forEach(node=>{node.inert=true});
  render(0);
  skip?.addEventListener("click",()=>finish());
  overlay.addEventListener("keydown",event=>{if(event.key==="Escape")finish()});
  const start=window.performance.now();
  const tick=now=>{
    if(finished)return;
    render((now-start)/duration*100);
    if(now-start>=duration)finish();
    else raf=window.requestAnimationFrame(tick);
  };
  raf=window.requestAnimationFrame(tick);
  watchdog=window.setTimeout(()=>finish(),duration+1000);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)finish({instant:true})});
  window.addEventListener("pagehide",()=>finish({instant:true}),{once:true});
  window.addEventListener("pageshow",event=>{if(event.persisted)finish({instant:true})});
})();