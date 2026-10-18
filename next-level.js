/* MASSYNE — creative micro-interactions + edit-in-GitHub availability.
   No layout thrashing, large libraries, custom mouse cursor or artificial waits. */
(() => {
  "use strict";
  const data = window.MASSYNE_AVAILABILITY || {};
  const allowed = new Set(["inquiries","open","limited","closed"]);
  const state = allowed.has(data.status) ? data.status : "inquiries";
  const messages = {
    inquiries:"OPEN FOR CREATIVE INQUIRIES",
    open:"AVAILABLE FOR SELECT PROJECTS",
    limited:"LIMITED AVAILABILITY / INQUIRE",
    closed:"CURRENTLY BOOKED / GET IN TOUCH"
  };
  document.querySelectorAll("[data-availability-status]").forEach(badge=>{
    badge.dataset.state = state;
    badge.querySelector("[data-availability-text]")?.replaceChildren(
      document.createTextNode(messages[state] + " ↗")
    );
    badge.setAttribute("aria-label","Designer availability: "+messages[state].toLowerCase());
  });
  const detail = document.getElementById("availability-description");
  if (detail) {
    detail.textContent = state==="closed"
      ? "Not booking immediate work right now. Feel free to enquire about a later date."
      : state==="limited"
      ? "A few project slots may be available. Share a brief to discuss timing."
      : state==="open"
      ? "Currently considering selected new creative projects."
      : "Interested in discussing design projects and collaborations.";
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced) return;
  const animatedSections = Array.from(document.querySelectorAll("[data-studio-reveal]"));
  if ("IntersectionObserver" in window && animatedSections.length) {
    const io = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, {threshold:.08,rootMargin:"0px 0px 24px 0px"});
    animatedSections.forEach(node=>io.observe(node));
    // Apply transition class after setting up the observers to avoid hiding
    // content when IntersectionObserver is unavailable.
    document.documentElement.classList.add("js-studio-ready");
  }
  if (!finePointer) return;

  document.querySelectorAll("[data-magnetic]").forEach(el=>{
    let frame=0,x=0,y=0,active=false;
    const apply=()=>{frame=0;if(!active)return;el.style.transform="translate3d("+x.toFixed(1)+"px,"+y.toFixed(1)+"px,0)"};
    el.classList.add("magnetic-button");
    el.addEventListener("pointermove",event=>{
      const r=el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      active=true;
      x=Math.max(-5,Math.min(5,(event.clientX-r.left-r.width/2)*.11));
      y=Math.max(-4,Math.min(4,(event.clientY-r.top-r.height/2)*.12));
      if (!frame)frame=requestAnimationFrame(apply);
    },{passive:true});
    const reset=()=>{
      active=false;
      if (frame)cancelAnimationFrame(frame);
      frame=0;el.style.transform="";
    };
    el.addEventListener("pointerleave",reset);
    el.addEventListener("blur",reset);
  });
})();
