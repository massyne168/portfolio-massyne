/* MASSYNE — Dark-Only cinematic theme initialization */
(() => {
  document.documentElement.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
  try { localStorage.setItem("massyne:theme", "dark"); } catch {}
})();
