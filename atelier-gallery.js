/* MASSYNE / Artwork-first studio showcase.
   Reuses the real project imagery, no fake product photos or heavyweight dependencies. */
(() => {
  "use strict";
  const stage=document.getElementById("atelier-stage");
  const rail=document.getElementById("atelier-rail");
  if(!stage||!rail)return;
  const items=[...rail.querySelectorAll("[data-atelier-item]")];
  const modes=[...document.querySelectorAll("[data-atelier-mode]")];
  const images=[...stage.querySelectorAll("[data-atelier-image]")];
  const title=document.getElementById("atelier-title");
  const category=document.getElementById("atelier-category");
  const year=document.getElementById("atelier-year");
  const desc=document.getElementById("atelier-description");
  const link=document.getElementById("atelier-open-project");
  const count=document.getElementById("atelier-index");
  const projects=Array.isArray(window.MASSYNE_PROJECTS)?window.MASSYNE_PROJECTS:[];
  const projectBySlug=new Map(projects.map(item=>[item.slug,item]));
  let selected=0;
  let mode="frame";
  let hasRendered=false;
  const choose=(index,{moveFocus=false}={})=>{
    if(!items.length)return;
    selected=(index+items.length)%items.length;
    const btn=items[selected],slug=btn.dataset.slug,meta=projectBySlug.get(slug);
    const artwork=meta?.image||btn.dataset.image;
    const name=meta?.title||btn.dataset.title||"Original artwork";
    const genre=meta?.category||btn.dataset.category||"Original design";
    if(!artwork||!slug)return;
    if(title)title.textContent=name;
    if(category)category.textContent=genre;
    if(year)year.textContent=(meta?.year||btn.dataset.year||"2026")+" / ARTWORK";
    if(desc)desc.textContent=meta?.summary||btn.dataset.summary||"An original visual design by MASSYNE.";
    if(count)count.textContent=String(selected+1).padStart(2,"0")+" / "+items.length;
    if(link){
      link.href="projects/"+encodeURIComponent(slug)+".html";
      link.setAttribute("aria-label","Explore "+name+" case study");
    }
    images.forEach(img=>{
      if(img.getAttribute("src")!==artwork)img.setAttribute("src",artwork);
      if(img.classList.contains("atelier-original"))img.alt=name+" — original design artwork by MASSYNE";
      img.decoding="async";
    });
    items.forEach((item,i)=>{
      const active=i===selected;
      item.classList.toggle("is-selected",active);
      item.setAttribute("aria-pressed",String(active));
    });
    if(moveFocus)btn.focus({preventScroll:true});
    // Do not auto-scroll the visitor to the gallery on initial page load.
    // Scroll the thumbnail rail only after a deliberate user selection.
    if(hasRendered) btn.scrollIntoView?.({block:"nearest",inline:"nearest",behavior:"auto"});
    hasRendered=true;
    stage.setAttribute("aria-label","Large glass frame displaying "+name+" — original artwork");
  };
  const switchMode=(next)=>{
    if(!["frame","textile","original"].includes(next))return;
    mode=next;
    stage.dataset.mode=next;
    modes.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.atelierMode===next)));
    const selectedButton=modes.find(button=>button.dataset.atelierMode===next);
    // Artwork-specific accessible label is set by choose().
  };
  items.forEach((button,i)=>button.addEventListener("click",()=>choose(i)));
  rail.addEventListener("keydown",event=>{
    const target=event.target.closest("[data-atelier-item]");
    if(!target)return;
    const i=items.indexOf(target);
    if(event.key==="ArrowRight"){event.preventDefault();choose(i+1,{moveFocus:true});}
    if(event.key==="ArrowLeft"){event.preventDefault();choose(i-1,{moveFocus:true});}
    if(event.key==="Home"){event.preventDefault();choose(0,{moveFocus:true});}
    if(event.key==="End"){event.preventDefault();choose(items.length-1,{moveFocus:true});}
  });
  modes.forEach(button=>button.addEventListener("click",()=>switchMode(button.dataset.atelierMode)));
  switchMode(mode);
  choose(0);
})();