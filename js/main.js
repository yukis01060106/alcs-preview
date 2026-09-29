(() => {
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');

  // Header: solid after hero, hide on scroll down / show on scroll up
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 80);
    header.classList.toggle('is-hidden', y > 600 && y > lastY && !header.classList.contains('is-open'));
    lastY = y;
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

  // Reveal on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Count-up
  const countIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.to, from = to > 1000 ? to - 40 : 0, t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / 1600, 1);
        el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIo.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.count').forEach(el => countIo.observe(el));

  // Parallax background (numbers)
  const para = document.querySelector('.numbers__bg');
  if (para && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const r = para.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      para.style.transform = `translateY(${(r.top + r.height / 2 - innerHeight / 2) * -0.12}px)`;
    }, { passive: true });
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
