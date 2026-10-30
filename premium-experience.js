/* Seven integrated viewing experiences. No media is fetched before it is needed. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const open = document.querySelector('#director-open');
  if (open) {
    const dialog = document.createElement('dialog');
    dialog.className = 'director-dialog';
    dialog.setAttribute('aria-label', 'Art Director Mode');
    dialog.innerHTML = '<header><span>ART DIRECTOR MODE</span><button type="button" class="director-close">EXIT ×</button></header><figure><img alt=""><figcaption></figcaption></figure><nav aria-label="Artwork navigation"><button type="button" class="director-prev" aria-label="Previous artwork">←</button><span class="director-count" role="status" aria-live="polite"></span><a class="director-project">EXPLORE PROJECT ↗</a><button type="button" class="director-next" aria-label="Next artwork">→</button></nav>';
    document.body.append(dialog);
    const image = dialog.querySelector('img'), caption = dialog.querySelector('figcaption');
    let cards = [], index = 0;
    const show = value => {
      index = (value + cards.length) % cards.length;
      const card = cards[index], source = card.querySelector('img');
      image.src = source.src;
      image.alt = source.alt;
      caption.textContent = card.querySelector('h3')?.textContent.trim() || source.alt;
      dialog.querySelector('.director-count').textContent = String(index + 1).padStart(2, '0') + ' / ' + cards.length;
      const link = card.querySelector('a[href]');
      const target = dialog.querySelector('.director-project');
      target.hidden = !link;
      if (link) target.href = link.href;
    };
    open.addEventListener('click', () => {
      cards = [...document.querySelectorAll('.project-grid .project')].filter(card => !card.hidden && !card.classList.contains('is-hidden'));
      if (!cards.length) return;
      const selected = cards.findIndex(card => card.classList.contains('is-carousel-active'));
      show(Math.max(0, selected));
      dialog.showModal();
      document.documentElement.classList.add('director-active');
      dialog.querySelector('.director-close').focus();
    });
    dialog.querySelector('.director-close').onclick = () => dialog.close();
    dialog.querySelector('.director-prev').onclick = () => show(index - 1);
    dialog.querySelector('.director-next').onclick = () => show(index + 1);
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); show(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('director-active');
      image.removeAttribute('src');
      open.focus({preventScroll:true});
    });
  }

  // Reuse the native archive viewer as a collector presentation.
  const viewer = document.querySelector('.lightbox');
  if (viewer) {
    viewer.classList.add('collector-view');
    const edition = document.createElement('span'); edition.className = 'collector-edition';
    edition.textContent = 'MASSYNE / THE COLLECTION'; viewer.prepend(edition);
    ['Previous','Next'].forEach((label,i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'collector-nav collector-' + (i ? 'next' : 'prev');
      button.textContent = i ? '→' : '←'; button.setAttribute('aria-label', label + ' artwork');
      button.onclick = () => viewer.dispatchEvent(new KeyboardEvent('keydown', {key:i ? 'ArrowRight' : 'ArrowLeft', bubbles:true}));
      viewer.append(button);
    });
  }

  // A replayable original-mark to metal reveal uses the existing comparison.
  const signature = document.querySelector('#signature-play'), comparison = document.querySelector('.comparison');
  if (signature && comparison) {
    let frame = 0, playing = false;
    const range = comparison.querySelector('input');
    const stop = () => { cancelAnimationFrame(frame); playing = false; signature.setAttribute('aria-pressed','false'); signature.textContent='PLAY SIGNATURE REVEAL ↗'; comparison.classList.remove('signature-revealing'); };
    signature.onclick = () => {
      if (playing) { stop(); return; }
      playing = true; signature.setAttribute('aria-pressed','true'); signature.textContent='STOP REVEAL Ⅱ';
      comparison.classList.add('signature-revealing');
      const start = performance.now(), duration = reduced.matches ? 0 : 3200;
      const tick = now => {
        const progress = duration ? Math.min(1,(now-start)/duration) : 1;
        range.value = String(Math.round((progress*progress*(3-2*progress))*100));
        range.dispatchEvent(new Event('input'));
        if (progress < 1) frame=requestAnimationFrame(tick); else stop();
      };
      frame=requestAnimationFrame(tick);
    };
    range.addEventListener('pointerdown', stop);
    range.addEventListener('keydown', stop);
    document.addEventListener('visibilitychange', () => { if(document.hidden) stop(); });
  }

  // Use container fullscreen so the original controls remain available.
  const full = document.querySelector('.motion-fullscreen'), screen = document.querySelector('.studio-showreel');
  if (full && screen) {
    full.hidden = !screen.requestFullscreen && !screen.querySelector('video')?.webkitEnterFullscreen;
    full.onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (screen.requestFullscreen) await screen.requestFullscreen();
        else screen.querySelector('video').webkitEnterFullscreen();
      } catch (_) { full.textContent='FULLSCREEN UNAVAILABLE'; }
    };
    document.addEventListener('fullscreenchange', () => {
      full.textContent=document.fullscreenElement ? '⛶ EXIT FULLSCREEN' : '⛶ FULLSCREEN';
      full.setAttribute('aria-label',document.fullscreenElement ? 'Exit motion fullscreen' : 'Open motion fullscreen');
    });
  }

  // Gentle project atmosphere. Colors change within the artwork sections only.
  const tones = ['140,38,53','28,69,83','103,67,31'];
  const spotlight = [...document.querySelectorAll('.spotlight-card')];
  spotlight.forEach((card,i) => {
    card.style.setProperty('--cover-tone',tones[i%tones.length]);
    const choose = () => card.closest('#spotlight')?.style.setProperty('--project-color','rgb('+tones[i%tones.length]+')');
    card.addEventListener('pointerenter',choose); card.addEventListener('focusin',choose);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{if(entries[0].isIntersecting)choose();},{threshold:.6}).observe(card);
  });
  const grid = document.querySelector('.project-grid');
  if (grid) {
    const atmosphere = () => {
      const cards=[...grid.querySelectorAll('.project')];
      const i=cards.findIndex(card=>card.classList.contains('is-carousel-active'));
      grid.closest('#work')?.style.setProperty('--project-color','rgb('+tones[Math.max(0,i)%tones.length]+')');
    };
    new MutationObserver(atmosphere).observe(grid,{subtree:true,attributes:true,attributeFilter:['class']});
    atmosphere();
  }
})();
