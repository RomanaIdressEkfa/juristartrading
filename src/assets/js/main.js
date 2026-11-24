/* ======================================================================
   Juri Star Trading — site behaviour (no framework)
   Navbar · mega menu · drawer · filters/search · quote form → WhatsApp/email
   · lightbox · print · Google Analytics / Ads conversion events
   ====================================================================== */
(function () {
  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var AR = d.documentElement.lang === 'ar';
  var WA = '97450790315';
  var EMAIL = 'info@juristartrading.com';

  /* ---- Conversion tracking (only active when gtag is configured in content.js) ---- */
  function track(kind, extra) {
    if (typeof window.gtag !== 'function') return;
    var events = { call: 'click_call', whatsapp: 'click_whatsapp', lead: 'generate_lead', quote: 'click_quote' };
    window.gtag('event', events[kind] || kind, extra || {});
    var ads = window.__ADS;
    if (ads && ads.id && ads.labels && ads.labels[kind]) {
      window.gtag('event', 'conversion', { send_to: ads.id + '/' + ads.labels[kind] });
    }
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest('[data-track]');
    if (a) track(a.getAttribute('data-track'), { link_url: a.href || '' });
  });

  /* ---- Navbar shadow on scroll ---- */
  var nav = $('[data-nav]');
  var onScroll = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Header dropdowns (LoanTube-style): click or hover, categories switch on hover ---- */
  var openDD = null, openedAt = 0;
  var setDD = function (name) {
    if (name && name !== openDD) openedAt = Date.now();
    openDD = name;
    $$('[data-dd]').forEach(function (b) { b.setAttribute('aria-expanded', b.getAttribute('data-dd') === name ? 'true' : 'false'); });
    $$('[data-panel]').forEach(function (p) { p.classList.toggle('open', p.getAttribute('data-panel') === name); });
  };
  var ddTimer;
  $$('[data-dd]').forEach(function (b) {
    var name = b.getAttribute('data-dd');
    b.addEventListener('click', function (e) { e.stopPropagation(); setDD(openDD === name && Date.now() - openedAt > 500 ? null : name); }); // a click right after hover-open keeps it open
    b.addEventListener('mouseenter', function () { clearTimeout(ddTimer); setDD(name); });
  });
  $$('[data-panel]').forEach(function (panel) {
    panel.addEventListener('mouseenter', function () { clearTimeout(ddTimer); });
    var cats = $$('[data-cat]', panel);
    var pick = function (i) {
      cats.forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-cat') === i); });
      $$('[data-pane]', panel).forEach(function (el) { el.hidden = el.getAttribute('data-pane') !== i; });
    };
    cats.forEach(function (c) {
      ['mouseenter', 'focus', 'click'].forEach(function (ev) { c.addEventListener(ev, function () { pick(c.getAttribute('data-cat')); }); });
    });
  });
  var hdr = $('[data-nav]');
  if (hdr) hdr.addEventListener('mouseleave', function () { ddTimer = setTimeout(function () { setDD(null); }, 250); });
  d.addEventListener('click', function (e) { if (openDD && !e.target.closest('[data-panel]')) setDD(null); });

  /* ---- Mobile side menu: segments + slide-in sub-lists ---- */
  var drawer = $('[data-drawer]');
  var backdrop = $('.drawer-backdrop');
  var toggleDrawer = function (open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    d.body.style.overflow = open ? 'hidden' : '';
    if (!open) $$('.drw-sub.open').forEach(function (s) { s.classList.remove('open'); });
  };
  $$('[data-drawer-open]').forEach(function (b) { b.addEventListener('click', function () { toggleDrawer(true); }); });
  $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', function () { toggleDrawer(false); }); });
  $$('[data-seg]').forEach(function (b) {
    b.addEventListener('click', function () {
      var seg = b.getAttribute('data-seg');
      $$('[data-seg]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      $$('[data-seg-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-seg-pane') !== seg; });
    });
  });
  $$('[data-sub]').forEach(function (b) {
    b.addEventListener('click', function () { var s = $('[data-subpanel="' + b.getAttribute('data-sub') + '"]'); if (s) s.classList.add('open'); });
  });
  $$('[data-sub-back]').forEach(function (b) { b.addEventListener('click', function () { b.closest('.drw-sub').classList.remove('open'); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { toggleDrawer(false); setDD(null); closeLightbox(); } });

  /* ---- Filter pills + search (projects, shop) ---- */
  $$('[data-filter-scope]').forEach(function (scope) {
    var pills = $$('[data-filter]', scope);
    var items = $$('[data-filter-item]', scope);
    var search = $('[data-search-input]', scope);
    var empty = $('[data-filter-empty]', scope);
    var current = 'all';
    var apply = function () {
      var q = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;
      items.forEach(function (el) {
        var ok = (current === 'all' || el.getAttribute('data-filter-item') === current) &&
          (!q || (el.getAttribute('data-search') || el.textContent).toLowerCase().indexOf(q) > -1 || el.textContent.toLowerCase().indexOf(q) > -1);
        el.hidden = !ok;
        if (ok) { shown++; el.style.opacity = 1; el.style.transform = 'none'; }
      });
      if (empty) empty.classList.toggle('hidden', shown > 0);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };
    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        current = p.getAttribute('data-filter');
        pills.forEach(function (x) { x.classList.toggle('active', x === p); });
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);
    // Deep links: /projects/?service=epoxy-flooring  ·  /shop/?category=flooring
    var params = new URLSearchParams(location.search);
    var pre = params.get('service') || params.get('category');
    var match = pre && pills.filter(function (p) { return p.getAttribute('data-filter') === pre; })[0];
    if (match) match.click();
  });

  /* ---- Quote form: build a message and open WhatsApp (or email) ---- */
  var params = new URLSearchParams(location.search);
  $$('[data-quote-form]').forEach(function (form) {
    var svc = params.get('service');
    if (svc && form.service) {
      var opt = form.service.querySelector('option[value="' + svc + '"]');
      if (opt) opt.selected = true;
    }
    var via = 'whatsapp';
    $$('button[type=submit]', form).forEach(function (b) {
      b.addEventListener('click', function () { via = b.getAttribute('data-via') || 'whatsapp'; });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('[data-form-error]', form);
      var done = $('[data-form-done]', form);
      if (form.company && form.company.value) return; // honeypot
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      if (!name || !/^[0-9+\-\s()]{7,}$/.test(phone)) {
        err.classList.remove('hidden');
        (name ? form.phone : form.name).focus();
        return;
      }
      err.classList.add('hidden');
      var service = form.service.options[form.service.selectedIndex].text;
      var area = form.area.value;
      var msg = form.message.value.trim();
      var lines = AR
        ? ['مرحباً جوري ستار للتجارة، أرغب في عرض سعر.', '', 'الاسم: ' + name, 'الهاتف: ' + phone, 'الخدمة: ' + service]
        : ['Hello Juri Star Trading, I would like a quote.', '', 'Name: ' + name, 'Phone: ' + phone, 'Service: ' + service];
      if (area) lines.push((AR ? 'المنطقة: ' : 'Area: ') + area);
      if (msg) lines.push((AR ? 'التفاصيل: ' : 'Details: ') + msg);
      lines.push('', (AR ? 'الصفحة: ' : 'Page: ') + location.href);
      var text = lines.join('\n');

      track('lead', { method: via, service: service, form: form.getAttribute('data-source') });
      if (via === 'email') {
        location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent((AR ? 'طلب عرض سعر: ' : 'Quote request: ') + service) + '&body=' + encodeURIComponent(text);
      } else {
        window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      }
      done.classList.remove('hidden');
    });
  });

  /* ---- Lightbox for project photos ---- */
  var lb = $('[data-lightbox]');
  function closeLightbox() { if (lb) lb.classList.remove('open'); }
  d.addEventListener('click', function (e) {
    var trg = e.target.closest('[data-lightbox-src]');
    if (trg && lb) { lb.querySelector('img').src = trg.getAttribute('data-lightbox-src'); lb.classList.add('open'); return; }
    if (lb && (e.target === lb || e.target.closest('[data-lightbox-close]'))) closeLightbox();
  });

  /* ---- Print data sheet ---- */
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  /* ---- Footer year ---- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
