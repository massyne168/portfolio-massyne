(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#nav');
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('is-open'); menu?.setAttribute('aria-expanded','false');
  }));
  const filters = document.querySelectorAll('[data-filter]');
  const archiveItems = document.querySelectorAll('.archive-item');
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(item => item.classList.toggle('active', item === button));
    archiveItems.forEach(item => {
      const visible = filter === 'all' || item.dataset.category.split(' ').includes(filter);
      item.classList.toggle('is-hidden', !visible);
    });
  }));
  const dialog = document.querySelector('.lightbox');
  const preview = dialog?.querySelector('img');
  const label = dialog?.querySelector('p');
  document.querySelectorAll('.image-open').forEach(item => {
    item.addEventListener('click', () => {
      const image = item.querySelector('img');
      if (!image || !dialog) return;
      preview.src = image.currentSrc || image.src;
      preview.alt = image.alt;
      label.textContent = image.alt;
      dialog.showModal();
    });
    item.addEventListener('keydown', event => { if (event.key === 'Enter') item.click(); });
    item.setAttribute('tabindex','0');
    item.setAttribute('role','button');
  });
  dialog?.querySelector('button').addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  if (!reduce && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:520,fill:'both',easing:'cubic-bezier(.2,.65,.2,1)'}); observer.unobserve(entry.target); }
    }), {threshold:.08});
    document.querySelectorAll('.section,.contact').forEach(section => observer.observe(section));
  }
})();