/* Shared accessible theme disclosure on home, project, resume and fallback pages. */
(() => {
 const root=document.documentElement;
 const isPosterLab=Boolean(document.querySelector(".editor-main"));
 const navStyles=document.createElement("link");
 navStyles.rel="stylesheet";
 navStyles.href="/mobile-nav.css";
 document.head.appendChild(navStyles);

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

 if(isPosterLab)return;
 const control=document.createElement("div");
 control.className="theme-control";
 control.setAttribute("role","group");
 control.setAttribute("aria-label","Color theme");
 control.innerHTML='<button type="button" data-theme-choice="light" aria-label="Use light theme"><span aria-hidden="true">☀</span> Clair</button><button type="button" data-theme-choice="dark" aria-label="Use dark theme"><span aria-hidden="true">☾</span> Sombre</button>';
 const header=document.querySelector(".site-header");
 if(header)header.insertBefore(control,header.querySelector(".menu"));
 else {control.classList.add("theme-control--standalone");(document.querySelector(".resume-topbar")||document.body).appendChild(control);}
 const sync=theme=>{
  root.dataset.theme=theme;
  root.style.colorScheme=theme;
  control.querySelectorAll("button").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.themeChoice===theme)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="light"?"#F8FAED":"#110d10");
 };
 control.querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
  const theme=button.dataset.themeChoice;
  sync(theme);
  try {localStorage.setItem("massyne:theme",theme);}catch{}
 }));
 window.addEventListener("storage",event=>{if(event.key==="massyne:theme")sync(event.newValue==="dark"?"dark":"light");});
 matchMedia("(min-width:1101px)").addEventListener("change",()=>{
  document.getElementById("nav")?.classList.remove("is-open");
  document.querySelector(".menu")?.setAttribute("aria-expanded","false");
 });
 sync(root.dataset.theme==="dark"?"dark":"light");
})();

