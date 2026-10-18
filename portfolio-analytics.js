/* MASSYNE / privacy-aware analytics wiring for Vercel static HTML.
   This is only client integration: the owner must enable Web Analytics
   and Speed Insights in Vercel Dashboard to start collecting metrics.
   No typed form fields, email addresses or visitor identifiers are sent. */
(() => {
  "use strict";
  const host = window.location.hostname;
  if (!host || ["localhost","127.0.0.1"].includes(host)) return;
  const vercelSite = /\.vercel\.app$|\.vercel\.sh$/.test(host);
  if (!vercelSite) return; // Custom domains need Vercel hosting verified first.
  const inject = path => {
    if (document.querySelector('script[src="'+path+'"]')) return;
    const element = document.createElement("script");
    element.src = path;
    element.async = true;
    element.referrerPolicy = "no-referrer-when-downgrade";
    element.onerror = () => element.remove();
    document.head.append(element);
  };
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  window.si = window.si || function () {
    (window.siq = window.siq || []).push(arguments);
  };
  const start = () => {
    inject("/_vercel/insights/script.js");
    inject("/_vercel/speed-insights/script.js");
  };
  if (document.readyState === "complete") {
    if ("requestIdleCallback" in window) window.requestIdleCallback(start,{timeout:2600});
    else window.setTimeout(start,1100);
  } else {
    window.addEventListener("load",()=>{
      if ("requestIdleCallback" in window) window.requestIdleCallback(start,{timeout:2600});
      else window.setTimeout(start,1100);
    },{once:true});
  }
  // Custom events contain only generic categories, never a visitor's form data.
  // Custom event reporting availability depends on the Vercel Analytics plan.
  const track = (name,category) => {
    try { window.va?.("event",{name,data:{category}}); } catch (_) {}
  };
  document.addEventListener("click",event=>{
    const target = event.target.closest("a,button");
    if (!target) return;
    const href = target.getAttribute("href") || "";
    if (/^projects\/[a-z0-9-]+\.html$/.test(href)) track("Project View","portfolio");
    else if (href.includes("MASSYNE-Resume.pdf")) track("Resume Download","resume");
    else if (href === "resume.html") track("Resume Open","resume");
    else if (href.startsWith("mailto:")) track("Email Intent","contact");
    else if (target.id === "showreel-play") track("Showreel Play","motion");
  },{capture:true,passive:true});
  document.addEventListener("submit",event=>{
    if (event.target.id === "project-brief" && event.target.checkValidity()) {
      track("Project Brief Prepared","contact");
    }
  },{capture:true});
})();
