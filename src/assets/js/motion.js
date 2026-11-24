/* ======================================================================
   Juri Star Trading — Motion (GSAP + ScrollTrigger)
   [data-hero]            hero elements rise in on load
   [data-reveal="up|left|right|zoom"] + data-delay   scroll reveals
   Falls back to a fully static page if GSAP fails to load or the visitor
   prefers reduced motion (see the inline script in <head>).
   ====================================================================== */
(function motion() {
  var root = document.documentElement;
  if (!root.classList.contains('gsap-ready')) return;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('gsap-ready'); return; }
  window.__gsapOn = true;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var rtl = root.dir === 'rtl';
  var mobile = window.innerWidth < 768;
  var k = mobile ? 0.5 : 1;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Hero: staggered rise ---- */
  var hero = $$('[data-hero]');
  if (hero.length) {
    gsap.from(hero, { y: 40 * k, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.05, clearProps: 'transform' });
  }

  /* ---- Scroll reveals ---- */
  var from = {
    up: { y: 50 * k },
    left: { x: (rtl ? 70 : -70) * k },
    right: { x: (rtl ? -70 : 70) * k },
    zoom: { scale: 0.9 },
  };
  $$('[data-reveal]').forEach(function (el) {
    var kind = el.getAttribute('data-reveal') || 'up';
    var delay = (parseInt(el.getAttribute('data-delay'), 10) || 0) / 1000;
    gsap.fromTo(el,
      Object.assign({ opacity: 0 }, from[kind] || from.up),
      {
        opacity: 1, x: 0, y: 0, scale: 1,
        duration: 0.85, delay: Math.min(delay, 0.45), ease: 'power3.out', clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
  });

  /* ---- Process timeline line draws in ---- */
  $$('ol[data-stagger] > div[aria-hidden]').forEach(function (line) {
    gsap.fromTo(line, { scaleX: 0, transformOrigin: rtl ? 'right center' : 'left center' }, { scaleX: 1, duration: 1.4, ease: 'power2.inOut', scrollTrigger: { trigger: line, start: 'top 85%', once: true } });
  });

  window.addEventListener('load', function () { ST.refresh(); });
})();
