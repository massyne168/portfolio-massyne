/* Shared accessible theme disclosure on home, project, resume and fallback pages. */
(() => {
 const root=document.documentElement;
 const control=document.createElement("div");
 control.className="theme-control";
 control.setAttribute("role","group");
 control.setAttribute("aria-label","Color theme");
 control.innerHTML='<button type="button" data-theme-choice="light"><span aria-hidden="true">☀</span> Clair</button><button type="button" data-theme-choice="dark"><span aria-hidden="true">☾</span> Sombre</button>';
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
