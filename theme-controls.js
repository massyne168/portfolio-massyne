/* Shared accessible theme disclosure on home, project, resume and fallback pages. */
(() => {
 const root=document.documentElement;
 const isPosterLab=Boolean(document.querySelector(".editor-main"));
 const navStyles=document.createElement("link");
 navStyles.rel="stylesheet";
 navStyles.href="/mobile-nav.css";
 document.head.appendChild(navStyles);
 const paletteStyles=document.createElement("link");
 paletteStyles.rel="stylesheet";
 paletteStyles.href="/site-theme.css?studio="+Date.now();
 paletteStyles.dataset.sitePalette="true";
 document.head.appendChild(paletteStyles);
 let siteAppearance=null;
 const safeHex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(String(value||"").trim())?String(value).trim().toUpperCase():fallback;
 const safeMediaUrl=value=>{
  const source=String(value||"").trim();
  if(!source)return "";
  if(/^https:\/\//i.test(source)){try{return new URL(source).protocol==="https:"?new URL(source).href:"";}catch{return "";}}
  const path=source.replace(/^\/+/,"");
  return /^(images|assets)\//i.test(path)&&!/(?:^|\/)(?:\.{1,2}|%2e%2e)(?:\/|$)/i.test(path)&&!/[<>"'\\\s]/.test(path)?"/"+path:"";
 };
 const syncBackgroundColor=()=>{
  root.style.setProperty("--site-background-color","#050608");
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute("content","#050608");
 };
 const applySiteAppearance=config=>{
  siteAppearance=config&&typeof config==="object"?config:null;
  if(!siteAppearance)return;
  const colors=siteAppearance.colors||{};
  root.style.setProperty("--site-accent",safeHex(colors.accent,"#990011"));
  root.style.setProperty("--site-light",safeHex(colors.light,"#FCF6F5"));
  const background=siteAppearance.background||{};
  const type=["theme","color","image","gif","video"].includes(background.type)?background.type:"theme";
  const fit=["cover","contain"].includes(background.fit)?background.fit:"cover";
  const position=["center","top","bottom","left","right"].includes(background.position)?background.position:"center";
  const overlay=Math.min(70,Math.max(0,Number(background.overlay)||0));
  root.style.setProperty("--site-background-fit",fit);
  root.style.setProperty("--site-background-position",position);
  root.style.setProperty("--site-background-overlay",String(overlay/100));
  let layer=document.getElementById("site-background-layer");
  if(!layer){
   layer=document.createElement("div");
   layer.id="site-background-layer";
   layer.setAttribute("aria-hidden","true");
   document.body.insertBefore(layer,document.body.firstChild);
  }
  layer.replaceChildren();
  const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const source=safeMediaUrl(background.src);
  if(source&&["image","gif","video"].includes(type)&&!(reducedMotion&&(type==="video"||type==="gif"))){
   const media=document.createElement(type==="video"?"video":"img");
   media.className="site-background-media"+(type==="video"?" site-background-video":"");
   if(type==="video"){
    media.muted=true;
    media.loop=true;
    media.autoplay=true;
    media.playsInline=true;
    media.preload="metadata";
    media.src=source;
   }else{
    media.alt="";
    media.decoding="async";
    media.fetchPriority="low";
    media.src=source;
   }
   layer.append(media);
   if(type==="video")media.play().catch(()=>{});
  }
  const tint=document.createElement("div");
  tint.className="site-background-overlay";
  layer.append(tint);
  syncBackgroundColor();
 };
 fetch("/site-theme.json?studio="+Date.now(),{cache:"no-store"})
  .then(response=>response.ok?response.json():null)
  .then(applySiteAppearance)
  .catch(()=>{});

 const onHome=location.pathname==="/"||/\/index\.html$/i.test(location.pathname);
 const mobileNav=document.createElement("nav");
 mobileNav.className="mobile-bottom-nav";
 mobileNav.setAttribute("aria-label","Primary navigation");
 const items=[
  {id:"top",label:"Home",icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/></svg>'},
  {id:"about",label:"About",icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.3"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>'},
  {id:"work",label:"Projects",icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>'},
  {id:"contact",label:"Contact",icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10h8M8 13h5"/></svg>'}
 ];
 const mobileBase=onHome?"":"/index.html";
 mobileNav.innerHTML=items.map(item=>'<a href="'+(onHome?"#"+item.id:mobileBase+"#"+item.id)+'" data-mobile-target="'+item.id+'">'+item.icon+'<span>'+item.label+'</span></a>').join("");
 document.body.appendChild(mobileNav);
 document.body.classList.add("mobile-bottom-nav-active");

 if(onHome){
  const syncNav=()=>{
   const links=[...mobileNav.querySelectorAll("a[data-mobile-target]")];
   const sections=[
    {id:"top",element:document.querySelector(".hero")||document.getElementById("top")},
    {id:"about",element:document.getElementById("about")},
    {id:"work",element:document.getElementById("work")},
    {id:"contact",element:document.getElementById("contact")}
   ].filter(item=>item.element);
   if(!sections.length)return;
   let frame=0;
   const update=()=>{
    frame=0;
    const marker=Math.min(window.innerHeight*.38,260);
    let current=sections[0].id;
    for(const item of sections){
     const rect=item.element.getBoundingClientRect();
     if(rect.top<=marker)current=item.id;
    }
    links.forEach(link=>{
     if(link.dataset.mobileTarget===current)link.setAttribute("aria-current","location");
     else link.removeAttribute("aria-current");
    });
    const activeIndex=items.findIndex(item=>item.id===current);
    links.forEach(link=>{
     const index=items.findIndex(item=>item.id===link.dataset.mobileTarget);
     link.classList.toggle("is-previous",index===(activeIndex-1+items.length)%items.length);
     link.classList.toggle("is-next",index===(activeIndex+1)%items.length);
    });
   };
   const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
   mobileNav.addEventListener("click",event=>{
    const link=event.target.closest("a[data-mobile-target]");
    if(link)link.setAttribute("aria-current","location");
   });
   window.addEventListener("scroll",schedule,{passive:true});
   window.addEventListener("resize",schedule,{passive:true});
   window.addEventListener("hashchange",schedule);
   update();
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncNav,{once:true});
  else syncNav();
 }

  root.dataset.theme="dark";
  root.style.colorScheme="dark";
  try{localStorage.setItem("massyne:theme","dark");}catch{}
  matchMedia("(min-width:1101px)").addEventListener("change",()=>{
   document.getElementById("nav")?.classList.remove("is-open");
   document.querySelector(".menu")?.setAttribute("aria-expanded","false");
  });
  syncBackgroundColor();
})();
