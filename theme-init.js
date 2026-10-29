/* Apply saved theme before styles paint; soft linen is the default. */
(() => {
 let theme="light";
 try { if(localStorage.getItem("massyne:theme")==="dark")theme="dark"; } catch {}
 document.documentElement.dataset.theme=theme;
 document.documentElement.style.colorScheme=theme;
})();
