(() => {
  const root = document.documentElement;
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Opening loader: mark as seen, release scroll when done
  if (root.classList.contains('is-loading')) {
    try { sessionStorage.setItem('alcs_loaded', '1'); } catch (e) {}
    setTimeout(() => root.classList.remove('is-loading'), 4800);
  }
  if (root.classList.contains('is-entering')) setTimeout(() => root.classList.remove('is-entering'), 1100);

  // Page transition for links to other pages of this site
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || RM || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return; // same-page anchor
    e.preventDefault();
    try { sessionStorage.setItem('alcs_trans', '1'); } catch (err) {}
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 520);
  });
  window.addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('is-leaving'); });

  // Header state + scroll progress
  const progress = document.createElement('span');
  progress.className = 'progress';
  header.appendChild(progress);
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 80);
    header.classList.toggle('is-hidden', y > 600 && y > lastY && !header.classList.contains('is-open'));
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const setMenu = open => {
    header.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  hamburger.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  document.querySelectorAll('.gnav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  // Hero slideshow
  const slides = document.querySelectorAll('.hero__slide');
  const bars = document.querySelectorAll('.hero__bars i');
  const num = document.getElementById('heroNum');
  let cur = 0;
  if (slides.length > 1) setInterval(() => {
    slides[cur].classList.remove('is-active');
    bars[cur].classList.remove('is-active');
    bars[cur].classList.add('is-done');
    cur = (cur + 1) % slides.length;
    if (cur === 0) bars.forEach(b => b.classList.remove('is-done'));
    slides[cur].classList.add('is-active');
    void bars[cur].offsetWidth;
    bars[cur].classList.add('is-active');
    num.textContent = String(cur + 1).padStart(2, '0');
  }, 6000);

  // Hero: subtle mouse parallax
  const heroSlides = document.querySelector('.hero__slides');
  if (heroSlides && FINE && !RM) {
    heroSlides.parentElement.addEventListener('mousemove', e => {
      const x = (e.clientX / innerWidth - 0.5) * -24;
      const y = (e.clientY / innerHeight - 0.5) * -16;
      heroSlides.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
    });
  }

  // ---------- Motion setup (before observing) ----------
  if (!RM) {
    // Split headings into characters
    document.querySelectorAll('.sec-title, .about__title, .intro__catch, .contact__title, .message__lead, .mv__copy, .recruit__copy').forEach(el => {
      let i = 0;
      const walk = node => {
        [...node.childNodes].forEach(n => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            [...n.textContent].forEach(c => {
              if (!c.trim()) { frag.appendChild(document.createTextNode(c)); return; }
              const s = document.createElement('span');
              s.className = 'ch'; s.textContent = c; s.style.setProperty('--ci', i++);
              frag.appendChild(s);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      walk(el);
      el.classList.add('split');
    });

    // Staggered children
    const groups = ['.news__list', '.svc-list', '.flow__list', '.result__kpi', '.numbers__list', '.products__grid',
      '.biz-tiles', '.case-grid', '.intro__points', '.cases__track', '.recruit__sub', '.company__table', '.footer__sitemap'];
    groups.forEach(sel => document.querySelectorAll(sel).forEach(g => {
      [...g.children].forEach((c, i) => {
        c.classList.add('reveal');
        c.style.setProperty('--delay', `${Math.min(i, 8) * 0.1}s`);
      });
    }));

    // Curtain reveal on images
    document.querySelectorAll('.case__img, .product__img, .company__photo, .biz-tile, .sub-card, .recruit__banner').forEach(el => {
      el.classList.add('curtain-host');
      const c = document.createElement('span');
      c.className = 'curtain-el';
      el.appendChild(c);
      if (!el.style.getPropertyValue('--delay')) {
        const parentDelay = el.closest('[style*="--delay"]');
        if (parentDelay) el.style.setProperty('--delay', parentDelay.style.getPropertyValue('--delay'));
      }
    });
  }

  // Reveal on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      // drop stagger delay after it has played so hovers stay snappy
      const d = parseFloat(e.target.style.getPropertyValue('--delay')) || 0;
      if (d) setTimeout(() => e.target.style.removeProperty('--delay'), (d + 1.6) * 1000);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .split, .label, .curtain-host').forEach(el => io.observe(el));

  // Count-up (integers and values like ×2.4 / +185% / −40%)
  const countIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      countIo.unobserve(el);
      let to, from, pre = '', suf = '', dec = 0;
      if (el.dataset.to) { to = +el.dataset.to; from = to > 1000 ? to - 40 : 0; }
      else {
        const m = el.textContent.trim().match(/^([×+−\-]?)(\d+(?:\.\d+)?)(%?)$/);
        if (!m) return;
        pre = m[1]; suf = m[3]; to = +m[2]; from = 0; dec = (m[2].split('.')[1] || '').length;
      }
      if (RM) return;
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / 1600, 1);
        const v = from + (to - from) * (1 - Math.pow(1 - p, 4));
        el.textContent = pre + v.toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.count, .result__kpi dd, .biz-row__kpi dd, .case-grid .case__kpi b').forEach(el => countIo.observe(el));

  // Scroll parallax
  if (!RM) {
    const items = [];
    document.querySelectorAll('.about__img .img-zoom, .message__photo .img-zoom, .recruit__bg, .contact__bg, .page-hero__bg, .numbers__bg').forEach(el => {
      el.classList.add('parallax');
      items.push({ el, k: el.classList.contains('page-hero__bg') ? 0.25 : 0.1 });
    });
    const loop = () => {
      items.forEach(({ el, k }) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        const off = el.classList.contains('page-hero__bg') ? -r.top : (r.top + r.height / 2 - innerHeight / 2);
        el.style.translate = `0 ${(off * -k).toFixed(1)}px`;
      });
      requestAnimationFrame(loop);
    };
    if (items.length) requestAnimationFrame(loop);
  }

  // Magnetic buttons
  if (FINE && !RM) {
    document.querySelectorAll('.slider-btn, .pagetop, .hero__news-arrow').forEach(el => {
      const host = el.classList.contains('hero__news-arrow') ? el.parentElement : el;
      el.classList.add('magnetic');
      host.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.translate = `${x}px ${y}px`;
      });
      host.addEventListener('mouseleave', () => { el.style.translate = ''; });
    });
  }

  // Case slider buttons
  const track = document.getElementById('caseTrack');
  if (track) document.querySelectorAll('.slider-btn').forEach(btn => btn.addEventListener('click', () => {
    const card = track.querySelector('.case');
    track.scrollBy({ left: (card.offsetWidth + 32) * +btn.dataset.dir, behavior: 'smooth' });
  }));

  // News tabs
  const tabs = document.querySelectorAll('.news__tabs button');
  const items = document.querySelectorAll('#newsList li');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.toggle('is-active', t === tab));
    items.forEach(li => li.classList.toggle('is-hidden', tab.dataset.cat !== 'all' && li.dataset.cat !== tab.dataset.cat));
  }));
})();
