/* Smart Discovery filters existing Curated Works without modifying carousel math. */
(() => {
  "use strict";
  const section=document.getElementById("work");
  const grid=section?.querySelector(".project-grid");
  const toolbar=section?.querySelector(".discover-tools");
  if(!grid||!toolbar)return;
  const cards=[...grid.querySelectorAll(":scope > .project")];
  const search=document.getElementById("discover-search");
  const buttons=[...toolbar.querySelectorAll("button[data-discover-category]")];
  const count=document.getElementById("discover-count");
  const empty=document.getElementById("discover-empty");
  const reset=document.getElementById("discover-reset");
  const threeD=section.querySelector('.view-switch [data-view="3d"]');
  const gridButton=section.querySelector('.view-switch [data-view="grid"]');
  const catalog={
    posters:"veiled-sorrow ghost-protocol power-speaks velocity ashes-of-innocence glory envy nocturne-dark-veil nocturne-red-sun",
    identity:"silver-throne mssn-chrome",
    fantasy:"the-cursed-crown the-final-fall legends nyctophile warriors-break the-queen the-last-oath",
    experimental:"veiled-sorrow-surreal design-works8sw designs-works designfd-works2"
  };
  const categories=Object.fromEntries(Object.entries(catalog).map(([key,value])=>[key,new Set(value.split(" "))]));
  const clean=value=>String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  let active="all";
  const matches=card=>{
    const slug=card.dataset.caseStudy||"";
    if(active!=="all"&&!categories[active]?.has(slug))return false;
    const query=clean(search?.value);
    if(!query)return true;
    const description=clean([slug,card.querySelector("h3")?.textContent,card.querySelector("div span")?.textContent].join(" "));
    return query.split(/\s+/).every(word=>description.includes(word));
  };
  const update=()=>{
    const filtered=active!=="all"||Boolean(clean(search?.value));
    // 3D always handles the COMPLETE collection. Switch to grid before applying a filter.
    if(filtered&&grid.dataset.view==="3d")gridButton?.click();
    let visible=0;
    cards.forEach(card=>{
      const show=!filtered||matches(card);
      card.hidden=!show;
      if(!show)card.tabIndex=-1;
      else if(grid.dataset.view!=="3d"&&card.classList.contains("image-open"))card.tabIndex=0;
      if(show)visible++;
    });
    buttons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.discoverCategory===active)));
    if(count)count.textContent=(filtered?(visible+" of "+cards.length):String(cards.length))+" original works";
    if(empty)empty.hidden=visible!==0;
    if(reset)reset.hidden=!filtered;
  };
  const clear=()=>{active="all";if(search)search.value="";update();};
  buttons.forEach(button=>button.addEventListener("click",()=>{active=button.dataset.discoverCategory;update();}));
  search?.addEventListener("input",update);
  search?.addEventListener("keydown",event=>{if(event.key==="Escape"&&search.value){search.value="";update();}});
  reset?.addEventListener("click",()=>{clear();search?.focus();});
  // Restore all cards synchronously when user requests the original 3D carousel.
  threeD?.addEventListener("click",clear,true);
  update();
})();
