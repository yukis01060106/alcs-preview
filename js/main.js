(() => {
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');

  // Header background on scroll
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger menu
  hamburger.addEventListener('click', () => {
    const open = header.classList.toggle('is-open');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.gnav a').forEach(a => a.addEventListener('click', () => {
    header.classList.remove('is-open');
    document.body.style.overflow = '';
  }));

  // Fade-in on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade').forEach(el => io.observe(el));

  // Count-up numbers
  const countIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = Number(el.dataset.to);
      const from = to > 1000 ? to - 30 : 0;
      const start = performance.now();
      const dur = 1400;
      const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIo.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.count').forEach(el => countIo.observe(el));
})();
