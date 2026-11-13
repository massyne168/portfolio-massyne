(() => {
  const grid = document.getElementById('work-grid');
  const projects = (window.MASSYNE_PROJECTS || []).filter(p => p && p.image).slice(0, 12);
  const safe = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (projects.length) {
    grid.innerHTML = projects.map((p, i) => {
      const image = String(p.image).replace(/^\//, '');
      const href = 'projects/' + encodeURIComponent(p.slug) + '.html';
      return '<a class="work-card" href="' + href + '"><div class="work-image"><img src="' + image + '" alt="' + safe(p.title) + '" loading="lazy" decoding="async"></div><div class="work-meta"><span>' + String(i + 1).padStart(2, '0') + ' / ' + safe(p.category) + '</span><span>' + safe(p.year) + '</span></div><h3 class="work-title">' + safe(p.title) + '</h3></a>';
    }).join('');
  } else {
    grid.innerHTML = '<p class="loading">PROJECTS ARE TEMPORARILY UNAVAILABLE.</p>';
  }
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.topbar nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
  }));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        observer.unobserve(entry.target);
      }
    }), {threshold: .12});
    document.querySelectorAll('.work-card,.section-heading,.statement-copy,.service-list>div').forEach(el => observer.observe(el));
  }
})();