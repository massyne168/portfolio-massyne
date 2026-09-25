/* A single navigation shared by desktop and mobile. */
(() => {
  const header = document.querySelector('#siteHeader.eh-topbar');
  if (!header) return;
  const button = header.querySelector('.eh-menu-button');
  const menu = header.querySelector('.eh-nav');
  const setOpen = open => {
    header.classList.toggle('is-menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  setOpen(false);
  // Own this existing button without running the legacy mobile-menu handler.
  button.addEventListener('click', event => {
    event.stopImmediatePropagation();
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  }, true);
  menu.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('click', event => { if (!header.contains(event.target)) setOpen(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false); button.focus();
    }
  }, true);
  window.addEventListener('pageshow', () => setOpen(false));
  window.addEventListener('resize', () => setOpen(false));
})();
