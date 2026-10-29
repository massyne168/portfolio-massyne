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
  const context=document.getElementById("discover-context");
  const stage=grid.closest(".curated-stage");
  const heading=section.querySelector(".project-count-label");
  const isMockup=card=>clean(card.dataset.discoverCategories).split(/\s+/).includes("mockups");
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
    const tags=clean(card.dataset.discoverCategories).split(/\s+/);
    // Mockups belong exclusively to their own collection, including during search.
    if(tags.includes("mockups")!==(active==="mockups"))return false;
    if(active!=="all"&&!categories[active]?.has(slug)&&!tags.includes(active))return false;
    const query=clean(search?.value);
    if(!query)return true;
    const description=clean([slug.replace(/-/g," "),tags.join(" "),card.querySelector("h3")?.textContent,card.querySelector("div span")?.textContent].join(" "));
    return query.split(/\s+/).every(word=>description.includes(word));
  };
  const update=()=>{
    const filtered=active!=="all"||Boolean(clean(search?.value));
    const mockups=active==="mockups";
    const total=cards.filter(card=>isMockup(card)===mockups).length;
    const collection=mockups?"mockups":"artwork";
    grid.dataset.discovery=active;
    if(stage)stage.dataset.collection=collection;
    let visible=0;
    cards.forEach(card=>{
      const show=matches(card);
      card.hidden=!show;
      if(!show)card.tabIndex=-1;
      else if(grid.dataset.view!=="3d"&&card.classList.contains("image-open"))card.tabIndex=0;
      if(show)visible++;
    });
    grid.dispatchEvent(new CustomEvent("discoverychange"));
    buttons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.discoverCategory===active)));
    if(context){
      context.hidden=active!=="mockups";
      context.textContent="MOCKUP STUDIO / Apparel in the real world — a dedicated 3D collection of streetwear scenes, outdoor displays and studio presentations.";
    }
    if(heading)heading.textContent=(mockups?"MOCKUP STUDIO":"CURATED ARTWORK")+" — "+String(total).padStart(2,"0")+" WORKS";
    if(search){search.placeholder="Search "+total+" "+collection+"…";search.setAttribute("aria-label","Search "+collection+" by name");}
    grid.setAttribute("aria-label",(mockups?"Mockup Studio":"Curated artwork")+" 3D carousel. Use arrow keys or drag to browse.");
    if(count)count.textContent=(visible!==total?(visible+" of "+total):String(total))+" "+collection;
    if(empty){
      empty.hidden=visible!==0;
      empty.textContent=active==="mockups"&&!clean(search?.value)
        ? "T-shirts, hoodies and more — new mockup projects will appear here as they are added."
        : "No works match your search. Try another name or clear the filters.";
    }
    if(reset)reset.hidden=!filtered;
  };
  const clear=()=>{active="all";if(search)search.value="";update();};
  const showResults=()=>{
    // Wait for the category intro and empty state to settle before scrolling.
    requestAnimationFrame(()=>{
      const destination=empty&&!empty.hidden?empty:grid.closest(".curated-stage");
      if(!destination)return;
      const header=document.querySelector(".site-header");
      const offset=(header?.getBoundingClientRect().height||0)+16;
      const top=destination.getBoundingClientRect().top+window.scrollY-offset;
      window.scrollTo({top:Math.max(0,top),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
    });
  };
  buttons.forEach(button=>button.addEventListener("click",event=>{
    active=button.dataset.discoverCategory;
    update();
    // Keep arrow-key browsing anchored to the filter buttons.
    if(event.detail>0)showResults();
  }));
  // Arrow keys move through the filter group without changing the standard Tab order.
  toolbar.addEventListener("keydown",event=>{
    const index=buttons.indexOf(event.target);
    if(index<0||!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
    event.preventDefault();
    const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:(index+(event.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length;
    buttons[next].focus();
    buttons[next].click();
  });
  search?.addEventListener("input",update);
  search?.addEventListener("keydown",event=>{if(event.key==="Escape"&&search.value){search.value="";update();}});
  reset?.addEventListener("click",()=>{clear();search?.focus();});
  update();
})();
