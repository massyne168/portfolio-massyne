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

  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor'; document.body.append(cursor);
    window.addEventListener('pointermove', event => { cursor.style.left = event.clientX + 'px'; cursor.style.top = event.clientY + 'px'; }, {passive:true});
    document.querySelectorAll('a,button,.image-open,video').forEach(item => {
      item.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
      item.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    });
  }

  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const hero = document.querySelector('.hero');
    let frame = 0, pointer = null;
    hero?.addEventListener('pointermove', event => {
      pointer = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (pointer.clientX - rect.left) / rect.width - .5;
        const y = (pointer.clientY - rect.top) / rect.height - .5;
        hero.style.setProperty('--depth-x', (x * 7).toFixed(2) + 'px');
        hero.style.setProperty('--depth-y', (y * 7).toFixed(2) + 'px');
        frame = 0;
      });
    });
    hero?.addEventListener('pointerleave', () => { hero.style.setProperty('--depth-x','0px'); hero.style.setProperty('--depth-y','0px'); });
    document.querySelectorAll('.glass-card').forEach(card => {
      let cardFrame = 0, last;
      card.addEventListener('pointermove', event => {
        last = event;
        if (cardFrame) return;
        cardFrame = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = (last.clientX - rect.left) / rect.width - .5;
          const y = (last.clientY - rect.top) / rect.height - .5;
          card.style.transform = 'translateY(-4px) rotateX(' + (-y * 2.1).toFixed(2) + 'deg) rotateY(' + (x * 2.1).toFixed(2) + 'deg)';
          card.style.setProperty('--shine-x', ((x + .5) * 100).toFixed(0) + '%');
          card.style.setProperty('--shine-y', ((y + .5) * 100).toFixed(0) + '%');
          cardFrame = 0;
        });
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    document.querySelectorAll('.magnetic').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        button.style.transform = 'translate(' + ((event.clientX - rect.left - rect.width / 2) * .14).toFixed(1) + 'px,' + ((event.clientY - rect.top - rect.height / 2) * .14).toFixed(1) + 'px)';
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }
})();
