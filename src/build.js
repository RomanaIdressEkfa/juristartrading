// Static site generator: renders every page in English (/) and Arabic (/ar/) into dist/.
const fs = require('fs');
const path = require('path');
const C = require('./content');
const POSTS = require('./blog');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const LANGS = ['en', 'ar'];

/* ---------------------------------------------------------------- helpers */
let L = 'en';
const t = (x) => (Array.isArray(x) ? x[L === 'ar' ? 1 : 0] : x);
const tr = (en, ar) => (L === 'ar' ? ar : en);
const base = (lang) => (lang === 'ar' ? '/ar/' : '/');
const href = (p = '') => base(L) + p;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => Number(n).toLocaleString('en-US');
const qar = (n) => (L === 'ar' ? `${money(n)} ر.ق` : `QAR ${money(n)}`);
const fromQar = (p) => (p ? `${tr('From', 'ابتداءً من')} <strong>${qar(p.from)}</strong> <span class="opacity-70">/ ${esc(t(p.unit))}</span>` : '');
const waLink = (msg) => `https://wa.me/${C.site.whatsapp}?text=${encodeURIComponent(msg)}`;
const waHello = (topic) => waLink(topic
  ? tr(`Hello Juri Star Trading, I would like a quote for ${topic}.`, `مرحباً جوري ستار للتجارة، أرغب في عرض سعر لـ ${topic}.`)
  : tr('Hello Juri Star Trading, I would like a free quote.', 'مرحباً جوري ستار للتجارة، أرغب في عرض سعر مجاني.'));
const reveal = (kind = 'up', d = 0) => `data-reveal="${kind}"${d ? ` data-delay="${d}"` : ''}`;
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString(L === 'ar' ? 'ar-QA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn' });
const svc = (slug) => C.services.find((s) => s.slug === slug);
const cat = (key) => C.categories.find((c) => c.key === key);

/* ------------------------------------------------------------------ icons */
const P = {
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  snow: '<path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07 19.07 4.93"/><path d="m9 4 3 3 3-3M9 20l3-3 3 3M4 9l3 3-3 3M20 9l-3 3 3 3"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  planks: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v6M15 9v6M7 15v6M17 15v6"/>',
  sofa: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2M20 18v2"/>',
  pump: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 6V2M18 12h4M2 12h4M7 20h10"/>',
  filter: '<path d="M8 2h8v4l-1 1v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7L8 6z"/><path d="M10 11h4M10 15h4"/>',
  pipe: '<path d="M2 7h10a4 4 0 0 1 4 4v11"/><path d="M2 13h6a2 2 0 0 1 2 2v7"/><path d="M2 5v10M14 22h6"/>',
  brush: '<path d="m14.6 9.4 5.4-5.4a1.4 1.4 0 0 0-2-2l-5.4 5.4"/><path d="M7.1 14.9C5.3 14.9 4 16.3 4 18c0 1.3-1.5 2-2 2 1 1.5 2.6 2 4 2 2.2 0 4-1.8 4-4 0-1.8-1.3-3.1-2.9-3.1z"/><path d="m11 10 3 3-3.4 3.4-3-3z"/>',
  panels: '<path d="M4 3v18M9 3v18M14 3v18M19 3v18"/>',
  drill: '<path d="M14 9V5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h10z"/><path d="M14 7h4l4-2v6l-4-2h-4"/><path d="M6 11l1 9h4l-1-9"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  store: '<path d="M3 9 4.5 4h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v9h14v-9M10 21v-5h4v5"/>',
  badge: '<path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z"/><path d="m9 12 2 2 4-4"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.82 8.82a2 2 0 0 0 2.83 0l7.17-7.17a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
};
const icon = (name, cls = 'h-5 w-5', sw = 1.9) =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.spark}</svg>`;
const waIcon = (cls = 'h-5 w-5') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.81-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.48 9.46zm8.06-17.53A11.33 11.33 0 0 0 12.04.6C5.76.6.65 5.7.65 11.98c0 2 .52 3.96 1.52 5.69L.55 23.4l5.86-1.54a11.4 11.4 0 0 0 5.62 1.43h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z"/></svg>`;
const fbIcon = (cls = 'h-5 w-5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.6V14h2.7v8h3.2z"/></svg>`;
const igIcon = (cls = 'h-5 w-5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>`;
const ttIcon = (cls = 'h-5 w-5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 5 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6z"/></svg>`;
const arrow = (cls = 'h-4 w-4') => icon('arrow', `${cls} flip-rtl`);

const logo = (dark = false) => `<a href="${href()}" class="flex items-center gap-2.5 shrink-0" aria-label="${esc(t(C.site.name))}">
  <img src="/assets/img/logo-mark.svg" alt="" class="h-10 w-auto" width="60" height="48">
  <span class="leading-none">
    <span class="block font-head text-[1.1rem] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink'}">${tr('Juri Star', 'جوري ستار')}</span>
    <span class="mt-1 block text-[.68rem] font-medium ${dark ? 'text-white/55' : 'text-muted'}">${tr('Trading · Contracting &amp; Hospitality', 'للتجارة والمقاولات والضيافة')}</span>
  </span>
</a>`;

/** Media tile: a real photo if one is given, otherwise a branded pattern placeholder. */
const media = ({ img, ph = 'spark', ic = 'image', alt = '', cls = 'aspect-[4/3]', imgCls = '' }) =>
  img
    ? `<img src="${img}" alt="${esc(alt)}" class="h-full w-full object-cover ${cls} ${imgCls}" loading="lazy">`
    : `<div class="ph ${ph.split(' ').map((p) => (p === 'zig' ? 'zig' : 'ph-' + p)).join(' ')} ${cls}" role="img" aria-label="${esc(alt)}"><div class="ph-icon"><span>${icon(ic, 'h-9 w-9', 1.6)}</span></div></div>`;

/* ----------------------------------------------------------- page shell */
const analytics = () => {
  const a = C.site.analytics;
  const id = a.ga4 || a.ads;
  if (!id) return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());${a.ga4 ? `gtag('config','${a.ga4}');` : ''}${a.ads ? `gtag('config','${a.ads}');` : ''}window.__ADS=${JSON.stringify({ id: a.ads, labels: a.adsLabels })};</script>`;
};

const navItems = () => [
  ['', tr('Home', 'الرئيسية'), 'home'],
  ['services/', tr('Services', 'الخدمات'), 'services'],
  ['projects/', tr('Projects', 'المشاريع'), 'projects'],
  ['shop/', tr('Shop', 'المتجر'), 'shop'],
  ['about/', tr('About', 'من نحن'), 'about'],
  ['blog/', tr('Blog', 'المدونة'), 'blog'],
  ['contact/', tr('Contact', 'اتصل بنا'), 'contact'],
];

const header = (page) => {
  const other = L === 'ar' ? 'en' : 'ar';
  const otherUrl = base(other) + page.path;
  const mega = C.services.map((s, i) => `<a class="mg-item" href="${href('services/' + s.slug + '/')}">
      <span class="ico ${i % 2 ? 'ico-red' : ''} !h-10 !w-10 !rounded-xl">${icon(s.icon, 'h-5 w-5')}</span>
      <span><span class="mg-t block font-bold text-[.95rem]">${esc(t(s.title))}</span><span class="block text-xs text-muted mt-0.5">${esc(t(s.menu))}</span></span>
    </a>`).join('');
  const links = navItems().map(([p, label, key]) => key === 'services'
    ? `<li class="has-mega" data-mega>
        <a class="nav-link" href="${href(p)}" ${page.nav === key ? 'aria-current="page"' : ''} aria-haspopup="true" aria-expanded="false">${label} ${icon('chevron', 'chev h-4 w-4')}</a>
        <div class="mega" role="menu">
          <div class="grid grid-cols-2 gap-1">${mega}</div>
          <a href="${href('quote/')}" class="btn btn-primary btn-sm mt-2 w-full" data-track="quote">${tr('Get a free site visit &amp; quote', 'احصل على زيارة وعرض سعر مجاني')} ${arrow()}</a>
        </div>
      </li>`
    : `<li><a class="nav-link" href="${href(p)}" ${page.nav === key ? 'aria-current="page"' : ''}>${label}</a></li>`).join('');
  const drawerLinks = navItems().map(([p, label, key]) => `<a href="${href(p)}" class="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold ${page.nav === key ? 'bg-tint text-brand-700' : 'text-ink'}">${label} ${arrow('h-4 w-4 opacity-40')}</a>${key === 'services' ? `<div class="mb-2 grid gap-1 ps-4">${C.services.map((s) => `<a href="${href('services/' + s.slug + '/')}" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2">${icon(s.icon, 'h-4 w-4 text-brand-600')} ${esc(t(s.title))}</a>`).join('')}</div>` : ''}`).join('');

  return `<div class="topbar hidden md:block">
  <div class="container-site flex h-10 items-center justify-between gap-6">
    <div class="flex items-center gap-6">
      <a href="tel:${C.site.phoneHref}" class="flex items-center gap-2" data-track="call">${icon('phone', 'h-3.5 w-3.5 text-brand-600')} <span dir="ltr">${C.site.phone}</span></a>
      <a href="${waHello()}" target="_blank" rel="noopener" class="flex items-center gap-2" data-track="whatsapp">${waIcon('h-3.5 w-3.5 text-brand-600')} <span dir="ltr">${C.site.whatsappDisplay}</span></a>
      <a href="mailto:${C.site.email}" class="hidden lg:flex items-center gap-2">${icon('mail', 'h-3.5 w-3.5 text-brand-600')} ${C.site.email}</a>
    </div>
    <div class="flex items-center gap-5">
      <span class="hidden lg:flex items-center gap-2">${icon('pin', 'h-3.5 w-3.5 text-signal-500')} ${esc(t(C.site.address))} · ${tr('CR No.', 'س.ت')} ${C.site.cr}</span>
      <a href="${otherUrl}" hreflang="${other}" lang="${other}" class="flex items-center gap-1.5 font-bold text-ink">${icon('globe', 'h-3.5 w-3.5')} ${other === 'ar' ? 'العربية' : 'English'}</a>
    </div>
  </div>
</div>
<header class="nav-wrap sticky top-0 z-50" data-nav>
  <div class="container-site flex h-[76px] items-center justify-between gap-4">
    ${logo()}
    <nav class="hidden xl:block" aria-label="${tr('Main', 'الرئيسية')}">
      <ul class="nav-pill flex items-center gap-0.5 p-1">${links}</ul>
    </nav>
    <div class="flex items-center gap-2">
      <a href="${otherUrl}" hreflang="${other}" class="btn btn-white btn-sm md:hidden" aria-label="${other === 'ar' ? 'العربية' : 'English'}">${other === 'ar' ? 'ع' : 'EN'}</a>
      <a href="tel:${C.site.phoneHref}" class="hidden lg:inline-flex btn btn-outline btn-sm" data-track="call">${icon('phone', 'h-4 w-4')} ${tr('Call', 'اتصل')}</a>
      <a href="${href('quote/')}" class="hidden sm:inline-flex btn btn-primary btn-sm">${tr('Free Quote', 'عرض سعر مجاني')} ${arrow()}</a>
      <button type="button" class="xl:hidden grid h-11 w-11 place-items-center rounded-xl bg-tint text-ink" data-drawer-open aria-label="${tr('Open menu', 'فتح القائمة')}">${icon('menu', 'h-6 w-6')}</button>
    </div>
  </div>
</header>
<div class="drawer-backdrop fixed inset-0 z-[55] bg-ink/50 backdrop-blur-sm" data-drawer-close></div>
<aside class="drawer fixed inset-y-0 end-0 z-[60] flex w-[86%] max-w-sm flex-col bg-white shadow-2xl" data-drawer aria-label="${tr('Menu', 'القائمة')}">
  <div class="flex items-center justify-between border-b border-line p-4">${logo()}<button type="button" class="grid h-10 w-10 place-items-center rounded-xl bg-tint" data-drawer-close aria-label="${tr('Close menu', 'إغلاق القائمة')}">${icon('x', 'h-5 w-5')}</button></div>
  <nav class="flex-1 overflow-y-auto p-3">${drawerLinks}</nav>
  <div class="grid gap-2 border-t border-line p-4">
    <a href="${href('quote/')}" class="btn btn-primary w-full">${tr('Get a Free Quote', 'احصل على عرض سعر مجاني')} ${arrow()}</a>
    <a href="${waHello()}" target="_blank" rel="noopener" class="btn btn-wa w-full" data-track="whatsapp">${waIcon()} WhatsApp</a>
  </div>
</aside>`;
};

const footer = () => `
<footer class="site-footer">
  <div class="container-site grid gap-10 pb-10 pt-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
    <div>
      ${logo(true)}
      <p class="mt-5 max-w-xs text-sm leading-relaxed">${tr('Water heaters, tank chillers, flooring and interiors across Qatar.', 'سخانات المياه ومبردات الخزانات والأرضيات والديكور في أنحاء قطر.')}</p>
      <div class="mt-5 flex gap-2">
        ${[['facebook', fbIcon], ['instagram', igIcon], ['tiktok', ttIcon]].filter(([k]) => C.site.social[k]).map(([k, fn]) => `<a href="${C.site.social[k]}" target="_blank" rel="noopener" class="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-brand-500" aria-label="${k}">${fn('h-4 w-4')}</a>`).join('')}
        <a href="${waHello()}" target="_blank" rel="noopener" class="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-brand-500" aria-label="WhatsApp" data-track="whatsapp">${waIcon('h-4 w-4')}</a>
      </div>
    </div>
    <div>
      <h3 class="text-sm font-semibold text-white">${tr('Services', 'الخدمات')}</h3>
      <ul class="mt-4 grid gap-2.5 text-sm">${C.services.map((s) => `<li><a href="${href('services/' + s.slug + '/')}">${esc(t(s.title))}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h3 class="text-sm font-semibold text-white">${tr('Company', 'الشركة')}</h3>
      <ul class="mt-4 grid gap-2.5 text-sm">${navItems().filter(([, , k]) => k !== 'services' && k !== 'home').map(([p, label]) => `<li><a href="${href(p)}">${label}</a></li>`).join('')}<li><a href="${href('quote/')}">${tr('Request a Quote', 'اطلب عرض سعر')}</a></li></ul>
    </div>
    <div>
      <h3 class="text-sm font-semibold text-white">${tr('Contact', 'تواصل معنا')}</h3>
      <ul class="mt-4 grid gap-3 text-sm">
        <li><a class="flex items-center gap-3" href="tel:${C.site.phoneHref}" data-track="call">${icon('phone', 'h-4 w-4 text-brand-300')} <span dir="ltr">${C.site.phone}</span></a></li>
        <li><a class="flex items-center gap-3" href="${waHello()}" target="_blank" rel="noopener" data-track="whatsapp">${waIcon('h-4 w-4 text-brand-300')} <span dir="ltr">${C.site.whatsappDisplay}</span></a></li>
        <li><a class="flex items-center gap-3" href="mailto:${C.site.email}">${icon('mail', 'h-4 w-4 text-brand-300')} ${C.site.email}</a></li>
        <li class="flex items-center gap-3">${icon('pin', 'h-4 w-4 text-brand-300')} ${esc(t(C.site.address))}</li>
      </ul>
    </div>
  </div>
  <div class="container-site flex flex-col items-center justify-between gap-2 border-t border-white/10 py-6 text-xs sm:flex-row">
    <p>© <span data-year>2026</span> ${esc(t(C.site.legal))} · ${tr('CR No.', 'س.ت')} ${C.site.cr}</p>
    <p><a href="${base(L === 'ar' ? 'en' : 'ar')}">${L === 'ar' ? 'English' : 'العربية'}</a> · <a href="/sitemap.xml">${tr('Sitemap', 'خريطة الموقع')}</a></p>
  </div>
</footer>
<div class="fab no-print">
  <a href="${waHello()}" target="_blank" rel="noopener" class="wa" aria-label="WhatsApp" data-track="whatsapp">${waIcon('h-6 w-6')}</a>
  <a href="tel:${C.site.phoneHref}" class="call" aria-label="${tr('Call us', 'اتصل بنا')}" data-track="call">${icon('phone', 'h-5 w-5')}</a>
</div>
<nav class="mobile-bar no-print" aria-label="${tr('Quick contact', 'تواصل سريع')}">
  <a href="tel:${C.site.phoneHref}" data-track="call">${icon('phone', 'h-5 w-5')}${tr('Call', 'اتصال')}</a>
  <a href="${waHello()}" target="_blank" rel="noopener" data-track="whatsapp">${waIcon('h-5 w-5')}WhatsApp</a>
  <a href="${href('quote/')}">${icon('file', 'h-5 w-5')}${tr('Quote', 'عرض سعر')}</a>
</nav>
<div class="lightbox" data-lightbox role="dialog" aria-modal="true"><button type="button" class="absolute end-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white" data-lightbox-close aria-label="${tr('Close', 'إغلاق')}">${icon('x', 'h-6 w-6')}</button><img alt=""></div>`;

const layout = (page, meta, body) => {
  const dir = L === 'ar' ? 'rtl' : 'ltr';
  const url = C.site.domain + base(L) + page.path;
  const alt = (lang) => C.site.domain + base(lang) + page.path;
  const title = meta.title.includes(t(C.site.name)) ? meta.title : `${meta.title} | ${t(C.site.name)}`;
  const graph = [{
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: t(C.site.legal),
    url: C.site.domain + base(L),
    logo: C.site.domain + '/assets/img/logo-mark.svg',
    image: C.site.domain + '/assets/img/shop-front.jpg',
    telephone: C.site.phoneHref,
    email: C.site.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Doha', addressCountry: 'QA' },
    areaServed: 'Qatar',
    priceRange: 'QAR',
  }].concat(meta.jsonld ? [].concat(meta.jsonld) : []);
  const uses3d = page.scene;

  return `<!doctype html>
<html lang="${L}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(meta.description)}">
${page.noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${alt('en')}">
<link rel="alternate" hreflang="ar" href="${alt('ar')}">
<link rel="alternate" hreflang="x-default" href="${alt('en')}">
<meta property="og:type" content="${meta.ogType || 'website'}">
<meta property="og:site_name" content="${esc(t(C.site.name))}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${C.site.domain}/assets/img/shop-front.jpg">
<meta property="og:locale" content="${L === 'ar' ? 'ar_QA' : 'en_QA'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${L === 'ar' ? 'IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=' : ''}Figtree:wght@400;500;600;700&family=Urbanist:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/app.css">
<script>(function(d){d.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('gsap-ready');setTimeout(function(){if(!window.__gsapOn)d.classList.remove('gsap-ready')},4000)}})(document.documentElement)</script>
${uses3d ? '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>' : ''}
${graph.map((g) => `<script type="application/ld+json">${JSON.stringify(g)}</script>`).join('\n')}
${analytics()}
</head>
<body class="pb-16 md:pb-0">
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">${tr('Skip to content', 'انتقل إلى المحتوى')}</a>
${header(page)}
<main id="main">
${body}
</main>
${footer()}
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
<script src="/assets/js/main.js" defer></script>
<script src="/assets/js/motion.js" defer></script>
${uses3d ? '<script type="module" src="/assets/js/scene3d.js"></script>' : ''}
</body>
</html>`;
};

/* ------------------------------------------------------------ components */
const sectionHead = ({ eyebrow, title, text, center = false }) => `<div class="${center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}" ${reveal('up')}>
  ${eyebrow ? `<p class="eyebrow mb-3">${eyebrow}</p>` : ''}
  <h2 class="h-section">${title}</h2>
  ${text ? `<p class="sub mt-2">${text}</p>` : ''}
</div>`;

/** Section heading on the left, a link/button on the right (same on every section). */
const sectionRow = ({ eyebrow, title, text, link, primary = false }) => `<div class="flex flex-wrap items-end justify-between gap-5">
  ${sectionHead({ eyebrow, title, text })}
  ${link ? `<a href="${link[0]}" class="btn ${primary ? 'btn-primary' : 'btn-white'}" ${reveal('up')}>${link[1]} ${arrow()}</a>` : ''}
</div>`;

const pageHero = ({ chip, title, text, crumbs = [], actions = '', aside = '' }) => `<section class="hero-bg">
  <div class="container-site grid items-center gap-10 py-12 lg:py-14 ${aside ? 'lg:grid-cols-[1.1fr_1fr]' : ''}">
    <div>
      <nav class="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="${tr('Breadcrumb', 'مسار التنقل')}">
        <a href="${href()}" class="hover:text-brand-600">${tr('Home', 'الرئيسية')}</a>
        ${crumbs.map(([label, link]) => `<span class="opacity-40">/</span>${link ? `<a href="${link}" class="hover:text-brand-600">${label}</a>` : `<span class="font-medium text-ink">${label}</span>`}`).join('')}
      </nav>
      <h1 class="text-[2.1rem] font-bold leading-[1.15] sm:text-[2.6rem]" data-hero>${title}</h1>
      ${text ? `<p class="sub mt-3 max-w-xl" data-hero>${text}</p>` : ''}
      ${actions ? `<div class="mt-7 flex flex-wrap items-center gap-3" data-hero>${actions}</div>` : ''}
    </div>
    ${aside}
  </div>
</section>`;

/** Photo card: big for the first two services on the home page. */
const serviceCard = (s, i, big = false) => `<a href="${href('services/' + s.slug + '/')}" class="photo-card group ${big ? 'lg:col-span-3 aspect-[16/10]' : 'lg:col-span-2 aspect-[4/3]'}" ${reveal('up', i * 70)}>
  ${s.img ? `<img src="${s.img}" alt="${esc(t(s.title))}" class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy">` : media({ ph: s.ph, ic: s.icon, alt: t(s.title), cls: 'absolute inset-0 h-full w-full' })}
  <span class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"></span>
  <span class="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-ink transition group-hover:bg-brand-500 group-hover:text-white">${arrow()}</span>
  <span class="absolute inset-x-0 bottom-0 p-5 text-white">
    <span class="block font-head ${big ? 'text-2xl' : 'text-xl'} font-bold">${esc(t(s.title))}</span>
    <span class="mt-1 block text-sm text-white/75">${esc(t(s.menu))}</span>
  </span>
</a>`;

const projectCard = (p, i) => {
  const s = svc(p.service);
  return `<article class="group" data-filter-item="${p.service}" ${reveal('up', (i % 3) * 80)}>
  <button type="button" class="relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] text-start" ${p.img ? `data-lightbox-src="${p.img}"` : ''} aria-label="${esc(t(p.title))}">
    ${media({ img: p.img, ph: p.ph, ic: s.icon, alt: t(p.title), cls: 'h-full w-full transition duration-700 group-hover:scale-105' })}
  </button>
  <p class="eyebrow mt-4">${esc(t(s.title))}</p>
  <h3 class="mt-1 text-lg font-bold leading-snug">${esc(t(p.title))}</h3>
  <p class="mt-1 text-sm text-muted">${esc(t(p.place))}</p>
</article>`;
};

const productCard = (p, i) => {
  const c = cat(p.cat);
  return `<article class="group card card-hover flex flex-col overflow-hidden" data-filter-item="${p.cat}" data-search="${esc((p.name[0] + ' ' + p.name[1] + ' ' + p.excerpt[0]).toLowerCase())}" ${reveal('up', (i % 4) * 70)}>
  <a href="${href('shop/' + p.slug + '/')}" class="m-2 mb-0 block aspect-[4/3] overflow-hidden rounded-[12px]">
    ${media({ img: p.img, ph: p.ph, ic: p.icon, alt: t(p.name), cls: 'h-full w-full transition duration-700 group-hover:scale-105' })}
  </a>
  <div class="flex flex-1 flex-col p-4">
    <p class="text-xs text-muted">${esc(t(c.t))}</p>
    <h3 class="mt-1 font-bold leading-snug"><a href="${href('shop/' + p.slug + '/')}" class="hover:text-brand-600">${esc(t(p.name))}</a></h3>
    <div class="mt-auto flex items-center justify-between gap-2 pt-4">
      <p class="text-sm font-semibold">${p.price ? qar(p.price) : `<span class="text-muted font-normal">${tr('Price on request', 'السعر عند الطلب')}</span>`}</p>
      <a href="${waLink(tr(`Hello, I am interested in: ${p.name[0]}`, `مرحباً، أنا مهتم بـ: ${p.name[1]}`))}" target="_blank" rel="noopener" class="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white" aria-label="${tr('Enquire on WhatsApp', 'استفسر عبر واتساب')}" data-track="whatsapp">${waIcon('h-4 w-4')}</a>
    </div>
  </div>
</article>`;
};

const postCard = (p, i) => `<a href="${href('blog/' + p.slug + '/')}" class="group block" ${reveal('up', i * 80)}>
  <div class="aspect-[16/10] overflow-hidden rounded-[var(--radius)]">${media({ img: p.img, ph: p.ph, ic: svc(p.service).icon, alt: t(p.title), cls: 'h-full w-full transition duration-700 group-hover:scale-105' })}</div>
  <p class="eyebrow mt-4">${esc(t(svc(p.service).title))}</p>
  <h3 class="mt-1 text-lg font-bold leading-snug group-hover:text-brand-600">${esc(t(p.title))}</h3>
  <p class="mt-1 text-sm text-muted">${fmtDate(p.date)}</p>
</a>`;

const faqList = (faqs) => `<div class="grid gap-3">${faqs.map(([q, a], i) => `<details class="faq" ${i === 0 ? 'open' : ''} ${reveal('up', i * 60)}>
  <summary>${esc(t(q))}<span class="pm">${icon('plus', 'h-4 w-4', 2.4)}</span></summary>
  <div class="faq-a">${esc(t(a))}</div>
</details>`).join('')}</div>`;

const faqJsonLd = (faqs) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: t(q), acceptedAnswer: { '@type': 'Answer', text: t(a) } })) });

const specTable = (specs) => `<table class="spec-table"><tbody>${specs.map(([k, v]) => `<tr><th scope="row">${esc(t(k))}</th><td>${esc(t(v))}</td></tr>`).join('')}</tbody></table>`;

const quoteForm = ({ selected = '', source = 'quote', compact = false, bare = false } = {}) => `<form class="grid gap-4 ${bare ? '' : 'card p-6 sm:p-8'} ${compact ? '' : 'sm:grid-cols-2'}" data-quote-form data-source="${source}" novalidate>
  <div class="field"><label for="q-name-${source}">${tr('Full name', 'الاسم الكامل')} *</label><input id="q-name-${source}" name="name" class="input" required autocomplete="name" placeholder="${tr('Your name', 'اسمك')}"></div>
  <div class="field"><label for="q-phone-${source}">${tr('Phone / WhatsApp', 'الهاتف / واتساب')} *</label><input id="q-phone-${source}" name="phone" class="input" required type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="+974 ..."></div>
  <div class="field"><label for="q-service-${source}">${tr('Service', 'الخدمة')}</label><select id="q-service-${source}" name="service" class="input">${C.services.map((s) => `<option value="${s.slug}" ${s.slug === selected ? "selected" : ""}>${esc(t(s.title))}</option>`).join('')}<option>${tr('Products / materials', 'منتجات / مواد')}</option><option>${tr('Other', 'أخرى')}</option></select></div>
  <div class="field"><label for="q-area-${source}">${tr('Area', 'المنطقة')}</label><select id="q-area-${source}" name="area" class="input"><option value="">${tr('Select area', 'اختر المنطقة')}</option>${C.areas.map((a) => `<option>${esc(t(a))}</option>`).join('')}<option>${tr('Other', 'أخرى')}</option></select></div>
  <div class="field ${compact ? '' : 'sm:col-span-2'}"><label for="q-msg-${source}">${tr('Project details', 'تفاصيل المشروع')}</label><textarea id="q-msg-${source}" name="message" class="input" placeholder="${tr('e.g. 4-bedroom villa, 5 bathrooms, need central water heater with pump', 'مثال: فيلا 4 غرف، 5 حمامات، أحتاج سخان مركزي مع مضخة')}"></textarea></div>
  <input type="text" name="company" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true">
  <p class="err hidden ${compact ? '' : 'sm:col-span-2'}" data-form-error role="alert">${tr('Please enter your name and a valid phone number.', 'يرجى إدخال اسمك ورقم هاتف صحيح.')}</p>
  <div class="flex flex-col gap-3 ${compact ? '' : 'sm:col-span-2 sm:flex-row sm:items-center'}">
    <button type="submit" class="btn btn-wa">${waIcon()} ${tr('Send via WhatsApp', 'إرسال عبر واتساب')}</button>
    <button type="submit" data-via="email" class="btn btn-outline">${icon('mail', 'h-5 w-5')} ${tr('Send by email', 'إرسال بالبريد')}</button>
  </div>
  <div class="hidden rounded-2xl bg-tint p-4 text-sm font-semibold text-brand-700 ${compact ? '' : 'sm:col-span-2'}" data-form-done role="status">${icon('check', 'inline h-5 w-5')} ${tr('Thank you! Your message is ready — just press send in WhatsApp / your email app. We reply the same day.', 'شكراً لك! رسالتك جاهزة — فقط اضغط إرسال في واتساب / تطبيق البريد. نرد في نفس اليوم.')}</div>
  <p class="text-xs text-muted ${compact ? '' : 'sm:col-span-2'}">${tr('Prefer to talk?', 'تفضل الاتصال؟')} <a href="tel:${C.site.phoneHref}" class="font-bold text-brand-700" data-track="call" dir="ltr">${C.site.phone}</a></p>
</form>`;

const processSteps = () => `<section class="sec sec-dark">
  <div class="container-site">
    ${sectionRow({ eyebrow: tr('How it works', 'كيف نعمل'), title: tr('Done in <span class="text-grad">4 simple steps</span>', 'ننجزها في <span class="text-grad">4 خطوات بسيطة</span>'), text: tr('No hidden costs, no surprises.', 'بدون تكاليف مخفية أو مفاجآت.'), link: [href('quote/'), tr('Get started', 'ابدأ الآن')], primary: true })}
    <ol class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${C.process.map((s, i) => `<li class="rounded-[var(--radius)] bg-white p-6 text-ink" ${reveal('up', i * 80)}>
        <span class="font-head text-3xl font-bold text-brand-500">0${i + 1}</span>
        <h3 class="mt-4 text-lg font-bold !text-ink">${esc(t(s.t))}</h3>
        <p class="mt-1.5 text-sm text-muted">${esc(t(s.d))}</p>
      </li>`).join('')}
    </ol>
  </div>
</section>`;

/* ---------------------------------------------------------------- pages */
const GENERAL_FAQ = [
  [['Do you offer a free site visit?', 'هل تقدمون زيارة موقع مجانية؟'], ['Yes. We visit anywhere in Qatar, measure and give you a written quote at no cost.', 'نعم. نزورك في أي مكان في قطر ونقيس ونعطيك عرض سعر مكتوب مجاناً.']],
  [['Do you supply materials as well as install?', 'هل توردون المواد بالإضافة إلى التركيب؟'], ['Yes. We have our own trading shop for heaters, pumps, pipes, epoxy, PVC flooring, paints and tools, so you get supply and installation from one company.', 'نعم. لدينا محل تجاري خاص للسخانات والمضخات والأنابيب والإيبوكسي وأرضيات PVC والدهانات والعدد، فتحصل على التوريد والتركيب من شركة واحدة.']],
  [['How quickly can you start?', 'متى يمكنكم البدء؟'], ['Most jobs start within a few days of quote approval. Urgent heater and chiller repairs are handled faster.', 'معظم الأعمال تبدأ خلال أيام قليلة من الموافقة على العرض. وإصلاحات السخانات والمبردات العاجلة تتم بشكل أسرع.']],
  [['Which areas do you cover?', 'ما المناطق التي تغطونها؟'], ['All of Qatar — Doha, Lusail, Al Rayyan, Al Wakrah, Al Khor, Umm Salal and more.', 'جميع أنحاء قطر — الدوحة، لوسيل، الريان، الوكرة، الخور، أم صلال وغيرها.']],
];

function homePage() {
  const page = { key: 'home', path: '', nav: 'home', scene: true };
  const heater = svc('central-water-heaters');
  const greenLast = (txt) => txt.replace(/(\S+)$/, '<span class="text-grad">$1</span>');
  const feature = (s, i, visual, list) => `<section class="sec">
  <div class="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
    <div class="${i % 2 ? 'lg:order-2' : ''}" ${reveal(i % 2 ? 'right' : 'left')}>${visual}</div>
    <div>
      ${sectionHead({ eyebrow: esc(t(s.menu)), title: greenLast(esc(t(s.title))), text: esc(t(s.tagline)) })}
      <ul class="mt-6 grid gap-3">${list.map((x) => `<li class="flex items-center gap-3 font-medium"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">${icon('check', 'h-3.5 w-3.5', 3)}</span>${esc(t(x))}</li>`).join('')}</ul>
      <p class="mt-6 text-ink">${fromQar(s.price)}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a href="${href('quote/?service=' + s.slug)}" class="btn btn-primary">${tr('Get a quote', 'اطلب عرض سعر')} ${arrow()}</a>
        <a href="${href('services/' + s.slug + '/')}" class="btn btn-white">${tr('View details', 'التفاصيل')}</a>
      </div>
    </div>
  </div>
</section>`;
  const photo = (src, alt) => `<img src="${src}" alt="${esc(alt)}" class="aspect-[5/4] w-full rounded-[var(--panel-radius)] object-cover" loading="lazy">`;
  const main = C.services.slice(0, 4);
  const body = `
<section class="hero-photo">
  <img src="${C.photos.hero}" alt="${tr('Living room interior decoration', 'ديكور داخلي لغرفة معيشة')}" class="absolute inset-0 h-full w-full object-cover" fetchpriority="high">
  <div class="hero-shade absolute inset-0"></div>
  <div class="container-site relative flex min-h-[600px] flex-col justify-between gap-10 py-10 lg:min-h-[660px] lg:py-14">
    <div class="max-w-xl pt-6 lg:pt-12">
      <span class="chip-glass" data-hero>${tr('Juri Star Trading · Doha, Qatar', 'جوري ستار للتجارة · الدوحة، قطر')}</span>
      <h1 class="mt-5 text-[2.5rem] font-bold leading-[1.1] text-white sm:text-5xl lg:text-[3.6rem]" data-hero>${tr('Interiors, floors &amp; <span class="text-brand-300">water systems</span> done right.', 'ديكور وأرضيات <span class="text-brand-300">وأنظمة مياه</span> بإتقان.')}</h1>
      <p class="mt-5 max-w-md text-lg text-white/80" data-hero>${tr('Supply and installation by our own team, with a free site visit.', 'توريد وتركيب بواسطة فريقنا، مع زيارة موقع مجانية.')}</p>
      <div class="mt-8 flex flex-wrap gap-3" data-hero>
        <a href="${href('quote/')}" class="btn btn-primary">${tr('Get a free quote', 'احصل على عرض سعر')} ${arrow()}</a>
        <a href="${waHello()}" target="_blank" rel="noopener" class="btn btn-glass" data-track="whatsapp">${waIcon()} WhatsApp</a>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2 lg:grid-cols-4" data-hero>
      ${main.map((s) => `<a href="${href('services/' + s.slug + '/')}" class="glass-link"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-600">${icon(s.icon, 'h-5 w-5')}</span><span class="min-w-0"><span class="block truncate font-semibold text-white">${esc(t(s.title))}</span><span class="block truncate text-xs text-white/65">${esc(t(s.menu))}</span></span></a>`).join('')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="container-site">
    ${sectionRow({ title: tr('Our <span class="text-grad">services</span>', '<span class="text-grad">خدماتنا</span>'), text: tr('Supply and installation across Qatar.', 'توريد وتركيب في جميع أنحاء قطر.'), link: [href('services/'), tr('All services', 'كل الخدمات')] })}
    <div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">${C.services.map((s, i) => serviceCard(s, i, i < 2)).join('')}</div>
  </div>
</section>

${feature(main[0], 0, photo(C.photos.interior, t(main[0].title)), main[0].features.slice(0, 4))}
${feature(main[1], 1, `<div class="grid grid-cols-5 gap-3"><img src="${C.photos.zigzag}" alt="${tr('Zigzag pattern floor', 'أرضية بنقشة زجزاج')}" class="col-span-3 h-full max-h-[460px] w-full rounded-[var(--panel-radius)] object-cover" loading="lazy"><div class="col-span-2 grid gap-3"><img src="${main[1].img}" alt="${tr('Glossy epoxy floor', 'أرضية إيبوكسي لامعة')}" class="h-full w-full rounded-[var(--radius)] object-cover" loading="lazy"><img src="${C.photos.epoxyInstall}" alt="${tr('Epoxy floor being applied', 'تطبيق أرضية الإيبوكسي')}" class="h-full w-full rounded-[var(--radius)] object-cover" loading="lazy"></div></div>`, main[1].features.slice(0, 4))}
${feature(main[2], 2, `<div class="relative overflow-hidden rounded-[var(--panel-radius)] border border-line bg-tint"><div class="scene-wrap aspect-[5/4] w-full" data-scene="heater" role="img" aria-label="${tr('3D model: heater, pump, filter and piping', 'نموذج ثلاثي الأبعاد: سخان ومضخة وفلتر وتمديدات')}"><div class="scene-fallback"><img src="${heater.img}" alt="" class="h-full w-full object-cover"></div></div><span class="absolute bottom-4 start-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow-card">${tr('3D · drag to look around', 'ثلاثي الأبعاد · حرّك للمشاهدة')}</span></div>`, heater.package.map((x) => x.t))}
${feature(main[3], 3, photo(main[3].img, t(main[3].title)), main[3].features.slice(0, 4))}

<section class="sec sec-tint">
  <div class="container-site grid items-center gap-10 lg:grid-cols-2">
    <img src="/assets/img/shop-front.jpg" alt="${tr('Juri Star Trading shopfront in Qatar', 'واجهة محل جوري ستار للتجارة في قطر')}" class="aspect-[16/11] w-full rounded-[var(--radius)] object-cover" loading="lazy" width="1600" height="900" ${reveal('left')}>
    <div>
      ${sectionHead({ eyebrow: tr('Why Juri Star', 'لماذا جوري ستار'), title: tr('Our own shop, <span class="text-grad">our own team</span>', 'محلنا الخاص، <span class="text-grad">وفريقنا الخاص</span>'), text: tr('Materials in stock and one company responsible for the job.', 'المواد متوفرة لدينا وشركة واحدة مسؤولة عن العمل.') })}
      <ul class="mt-8 grid gap-3 sm:grid-cols-2">
        ${C.why.map((w, i) => `<li class="flex items-center gap-3 rounded-[14px] border border-line bg-white p-3.5" ${reveal('up', i * 70)}><span class="ico !h-10 !w-10">${icon(w.icon, 'h-5 w-5')}</span><span class="font-semibold">${esc(t(w.t))}</span></li>`).join('')}
      </ul>
    </div>
  </div>
</section>

<section class="sec">
  <div class="container-site">
    <div class="grid overflow-hidden rounded-[var(--panel-radius)] border border-line lg:grid-cols-[1.35fr_1fr]">
      <div class="p-6 sm:p-10" ${reveal('up')}>
        ${sectionHead({ title: tr('Get a <span class="text-grad">free quote</span>', 'احصل على <span class="text-grad">عرض سعر مجاني</span>'), text: tr('Send your details on WhatsApp. We reply the same day.', 'أرسل التفاصيل عبر واتساب. نرد في نفس اليوم.') })}
        <div class="mt-8">${quoteForm({ source: 'home', bare: true })}</div>
      </div>
      <div class="relative flex flex-col justify-between gap-8 overflow-hidden bg-ink p-6 text-white sm:p-10">
        <img src="${C.photos.interior}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-20">
        <div class="relative">
          <p class="eyebrow !text-brand-300">${tr('Talk to us', 'تحدث معنا')}</p>
          <ul class="mt-6 grid gap-5">
            ${[['phone', tr('Mobile', 'الجوال'), C.site.phone, `tel:${C.site.phoneHref}`, 'call'], ['building', tr('Landline', 'الهاتف الأرضي'), C.site.landline, `tel:${C.site.landlineHref}`, 'call'], ['chat', 'WhatsApp', C.site.whatsappDisplay, waHello(), 'whatsapp']].map(([ic, label, val, link, tk]) => `<li><a href="${link}" ${tk === 'whatsapp' ? 'target="_blank" rel="noopener"' : ''} class="flex items-center gap-4" data-track="${tk}"><span class="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-brand-300">${icon(ic)}</span><span><span class="block text-xs text-white/55">${label}</span><span class="block font-head text-xl font-bold" dir="ltr">${val}</span></span></a></li>`).join('')}
          </ul>
        </div>
        <p class="relative flex items-center gap-2 text-sm text-white/60">${icon('clock', 'h-4 w-4 text-brand-300')} ${esc(t(C.site.hours))}</p>
      </div>
    </div>
  </div>
</section>`;
  return layout(page, {
    title: tr('Juri Star Trading — Central Water Heaters, Tank Chillers & Epoxy Flooring in Qatar', 'جوري ستار للتجارة — سخانات مركزية ومبردات خزانات وأرضيات إيبوكسي في قطر'),
    description: tr('Central water heaters with pump & filter, water tank chillers, zigzag/3D/metallic epoxy, PVC barkia flooring and interior decoration in Doha, Qatar. Free site visit — call or WhatsApp.', 'سخانات مياه مركزية مع المضخة والفلتر، مبردات خزانات، إيبوكسي زجزاج وثلاثي الأبعاد ومعدني، باركيه PVC وديكور داخلي في الدوحة، قطر. زيارة مجانية — اتصل أو واتساب.'),
  }, body);
}

function servicesPage() {
  const page = { key: 'services', path: 'services/', nav: 'services' };
  const body = `${pageHero({ chip: tr('What we do', 'ماذا نقدم'), title: tr('Our <span class="text-grad">services</span>', '<span class="text-grad">خدماتنا</span>'), text: tr('Supply and installation by one team, with a free site visit and a written quote for every job.', 'توريد وتركيب بواسطة فريق واحد، مع زيارة موقع مجانية وعرض سعر مكتوب لكل عمل.'), crumbs: [[tr('Services', 'الخدمات')]] })}
<section class="sec"><div class="container-site grid gap-4 md:grid-cols-2 lg:grid-cols-6">${C.services.map((s, i) => serviceCard(s, i, i < 2)).join('')}
  <a href="${href('quote/')}" class="card flex flex-col justify-between overflow-hidden bg-tint-2 p-8" ${reveal('up', 400)}>
    <span class="ico ico-red">${icon('file')}</span>
    <div><h3 class="mt-6 text-2xl font-bold">${tr('Not sure what you need?', 'لست متأكداً مما تحتاجه؟')}</h3><p class="mt-2 text-muted">${tr('Book a free site visit and we will recommend the right solution.', 'احجز زيارة مجانية وسنقترح الحل المناسب.')}</p></div>
    <span class="btn btn-primary mt-6 self-start">${tr('Book a site visit', 'احجز زيارة')} ${arrow()}</span>
  </a>
</div></section>`;
  return layout(page, { title: tr('Services — Water Heaters, Chillers, Epoxy, PVC Flooring & Interiors', 'الخدمات — سخانات، مبردات، إيبوكسي، أرضيات PVC وديكور'), description: tr('Central water heaters, water tank chillers, epoxy flooring, PVC barkia flooring and interior decoration in Qatar.', 'سخانات مياه مركزية، مبردات خزانات، أرضيات إيبوكسي، باركيه PVC وديكور داخلي في قطر.') }, body);
}

function servicePage(s) {
  const page = { key: 'service', path: `services/${s.slug}/`, nav: 'services' };
  const idx = C.services.indexOf(s);
  const related = C.projects.filter((p) => p.service === s.slug).slice(0, 3);
  const prods = C.products.filter((p) => cat(p.cat).service === s.slug).slice(0, 4);
  const topic = t(s.title);
  const body = `${pageHero({
    chip: esc(t(s.menu)),
    title: esc(t(s.title)),
    text: esc(t(s.tagline)),
    crumbs: [[tr('Services', 'الخدمات'), href('services/')], [esc(t(s.title))]],
    actions: `<a href="${href('quote/?service=' + s.slug)}" class="btn btn-primary">${tr('Get a Free Quote', 'احصل على عرض سعر مجاني')} ${arrow()}</a>
      <a href="${waHello(topic)}" target="_blank" rel="noopener" class="btn btn-wa" data-track="whatsapp">${waIcon()} WhatsApp</a>
      ${s.price ? `<span class="flex items-center rounded-full bg-white px-5 py-3 text-sm shadow-card">${icon('tag', 'me-2 h-4 w-4 text-signal-500')} <span>${fromQar(s.price)}</span></span>` : ''}`,
    aside: `<img src="${s.img}" alt="${esc(t(s.title))}" class="aspect-[5/4] w-full rounded-[var(--radius)] object-cover" data-hero>`,
  })}

<section class="sec">
  <div class="container-site grid gap-12 lg:grid-cols-[1.2fr_1fr]">
    <div ${reveal('up')}>
      <span class="eyebrow">${tr('Overview', 'نظرة عامة')}</span>
      <div class="prose-site mt-5">${s.intro.map((p) => `<p>${esc(t(p))}</p>`).join('')}</div>
    </div>
    <ul class="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1" data-stagger>
      ${s.features.map((f, i) => `<li class="card flex items-center gap-3 p-4 font-semibold" ${reveal('up', i * 60)}><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full ${i % 3 === 2 ? 'bg-signal-500' : 'bg-brand-500'} text-white">${icon('check', 'h-4 w-4', 3)}</span>${esc(t(f))}</li>`).join('')}
    </ul>
  </div>
</section>

${s.package ? `<section class="sec sec-dark">
  <div class="container-site relative">
    ${sectionHead({ center: true, eyebrow: tr('What’s in the package', 'محتويات الباقة'), title: tr('Heater + pump + filter + piping', 'سخان + مضخة + فلتر + تمديدات'), text: fromQar(s.price) })}
    <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      ${s.package.map((p, i) => `<div class="relative rounded-[var(--radius)] bg-white p-6 text-ink" ${reveal('up', i * 90)}>
        <span class="absolute end-5 top-5 font-head text-3xl font-bold text-brand-500">0${i + 1}</span>
        <span class="ico ${i % 2 ? 'ico-red' : ''}">${icon(p.icon)}</span>
        <h3 class="mt-5 text-lg font-bold">${esc(t(p.t))}</h3>
        <p class="mt-2 text-sm text-muted">${esc(t(p.d))}</p>
      </div>`).join('')}
    </div>
  </div>
</section>` : ''}

<section class="sec sec-tint">
  <div class="container-site">
    ${sectionHead({ eyebrow: tr('Options', 'الخيارات'), title: tr(`Types of ${esc(t(s.title)).toLowerCase()}`, `أنواع ${esc(t(s.title))}`) })}
    <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${s.options.map((o, i) => `<div class="card card-hover overflow-hidden" ${reveal('up', (i % 3) * 80)}>
        ${o.ph ? media({ img: o.img, ph: o.ph, ic: s.icon, alt: t(o.t), cls: 'aspect-[16/9]' }) : ''}
        <div class="p-6">${o.ph ? '' : `<span class="ico ${i % 2 ? 'ico-red' : 'ico-soft'}">${icon(s.icon)}</span>`}
        <h3 class="${o.ph ? '' : 'mt-4'} text-lg font-bold">${esc(t(o.t))}</h3><p class="mt-2 text-sm leading-relaxed text-muted">${esc(t(o.d))}</p></div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="container-site grid gap-12 lg:grid-cols-[1.3fr_1fr]">
    <div ${reveal('up')}>
      <span class="eyebrow">${tr('Specifications', 'المواصفات')}</span>
      <h2 class="h-section mt-4">${tr('Technical details', 'التفاصيل الفنية')}</h2>
      <div class="mt-8">${specTable(s.specs)}</div>
    </div>
    <aside class="lg:pt-16" ${reveal('right')}>
      <div class="card sticky top-28 overflow-hidden">
        <div class="border-b border-line bg-tint-2 p-6">
          <p class="text-sm font-semibold text-muted">${tr('Price guide', 'دليل الأسعار')}</p>
          <p class="mt-1 text-3xl font-bold text-brand-600">${tr('From', 'من')} ${qar(s.price.from)}</p>
          <p class="text-sm text-muted">${esc(t(s.price.unit))}</p>
        </div>
        <div class="grid gap-3 p-6">
          <p class="text-sm text-muted">${tr('Final price depends on size, site conditions and the options you choose. Get an exact quote after a free site visit.', 'السعر النهائي يعتمد على الحجم وظروف الموقع والخيارات التي تختارها. احصل على سعر دقيق بعد زيارة مجانية.')}</p>
          <a href="${href('quote/?service=' + s.slug)}" class="btn btn-primary w-full">${tr('Get exact quote', 'احصل على سعر دقيق')} ${arrow()}</a>
          <a href="${href('services/' + s.slug + '/datasheet/')}" class="btn btn-outline w-full">${icon('download', 'h-4 w-4')} ${tr('PDF data sheet', 'ملف المواصفات PDF')}</a>
        </div>
      </div>
    </aside>
  </div>
</section>

${related.length ? `<section class="sec sec-tint"><div class="container-site">
  <div class="flex flex-wrap items-end justify-between gap-6">${sectionHead({ eyebrow: tr('Projects', 'المشاريع'), title: tr('Recent work', 'أعمال حديثة') })}<a class="btn btn-outline" href="${href('projects/?service=' + s.slug)}" ${reveal('up')}>${tr('More projects', 'مشاريع أكثر')} ${arrow()}</a></div>
  <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${related.map(projectCard).join('')}</div>
</div></section>` : ''}

${prods.length ? `<section class="sec"><div class="container-site">
  ${sectionHead({ eyebrow: tr('Shop', 'المتجر'), title: tr('Related products', 'منتجات ذات صلة') })}
  <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">${prods.map(productCard).join('')}</div>
</div></section>` : ''}

<section class="sec sec-tint">
  <div class="container-site grid gap-12 lg:grid-cols-2">
    <div>${sectionHead({ eyebrow: 'FAQ', title: tr('Questions about', 'أسئلة حول') + ' ' + esc(t(s.title)) })}<div class="mt-8">${faqList(s.faqs)}</div></div>
    <div ${reveal('right')}><h2 class="h-section mb-6">${tr('Request a quote', 'اطلب عرض سعر')}</h2>${quoteForm({ selected: s.slug, source: 'service', compact: true })}</div>
  </div>
</section>

<section class="sec"><div class="container-site">
  <h2 class="h-section">${tr('Other services', 'خدمات أخرى')}</h2>
  <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${C.services.filter((x) => x !== s).map((x, i) => `<a href="${href('services/' + x.slug + '/')}" class="card card-hover flex items-center gap-3 p-4" ${reveal('up', i * 60)}><span class="ico ${i % 2 ? 'ico-red' : 'ico-soft'}">${icon(x.icon)}</span><span class="font-bold">${esc(t(x.title))}</span></a>`).join('')}</div>
</div></section>`;

  return layout(page, {
    title: tr(`${s.title[0]} in Qatar — Supply & Installation`, `${s.title[1]} في قطر — توريد وتركيب`),
    description: t(s.summary),
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'Service', name: t(s.title), description: t(s.summary), areaServed: 'Qatar', provider: { '@type': 'HomeAndConstructionBusiness', name: t(C.site.legal), telephone: C.site.phoneHref }, offers: { '@type': 'Offer', priceCurrency: 'QAR', price: s.price.from, description: t(s.price.unit) } },
      faqJsonLd(s.faqs),
    ],
  }, body);
}

function datasheetPage(s) {
  const page = { key: 'datasheet', path: `services/${s.slug}/datasheet/`, nav: 'services', noCta: true };
  const body = `<section class="sec"><div class="container-site max-w-4xl">
  <div class="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-tint p-4">
    <p class="text-sm font-semibold text-brand-700">${tr('Use “Save as PDF” in the print dialog to download this data sheet.', 'اختر "حفظ كملف PDF" من نافذة الطباعة لتنزيل ملف المواصفات.')}</p>
    <button type="button" class="btn btn-primary btn-sm" data-print>${tr('Print / Save PDF', 'طباعة / حفظ PDF')} ${icon('printer', 'h-4 w-4')}</button>
  </div>
  <article class="card p-8 sm:p-12">
    <header class="flex flex-wrap items-start justify-between gap-6 border-b-4 border-brand-500 pb-6">
      <div class="flex items-center gap-3"><img src="/assets/img/logo-mark.svg" alt="" class="h-14"><div><p class="text-lg font-bold">${esc(t(C.site.legal))}</p><p class="text-sm text-muted">${tr('Product &amp; service data sheet', 'ملف مواصفات المنتج والخدمة')}</p></div></div>
      <div class="text-sm text-muted text-end"><p dir="ltr">${C.site.phone}</p><p>${C.site.email}</p><p>juristartrading.com</p></div>
    </header>
    <h1 class="mt-8 text-3xl font-bold">${esc(t(s.title))}</h1>
    <p class="mt-2 text-lg text-muted">${esc(t(s.summary))}</p>
    <p class="mt-4 inline-block rounded-full bg-tint px-4 py-2 text-sm font-bold text-brand-700">${fromQar(s.price)}</p>
    <h2 class="mt-10 text-xl font-bold">${tr('Specifications', 'المواصفات')}</h2>
    <div class="mt-4">${specTable(s.specs)}</div>
    ${s.package ? `<h2 class="mt-10 text-xl font-bold">${tr('Package contents', 'محتويات الباقة')}</h2><ul class="mt-4 grid gap-3 sm:grid-cols-2">${s.package.map((p) => `<li class="rounded-xl border border-line p-4"><strong>${esc(t(p.t))}</strong><br><span class="text-sm text-muted">${esc(t(p.d))}</span></li>`).join('')}</ul>` : ''}
    <h2 class="mt-10 text-xl font-bold">${tr('Features', 'المميزات')}</h2>
    <ul class="mt-4 grid gap-2 sm:grid-cols-2">${s.features.map((f) => `<li class="flex items-center gap-2">${icon('check', 'h-4 w-4 text-brand-600', 3)} ${esc(t(f))}</li>`).join('')}</ul>
    <h2 class="mt-10 text-xl font-bold">${tr('Options', 'الخيارات')}</h2>
    <ul class="mt-4 grid gap-2">${s.options.map((o) => `<li><strong>${esc(t(o.t))}</strong> — ${esc(t(o.d))}</li>`).join('')}</ul>
    <p class="mt-10 border-t border-line pt-6 text-xs text-muted">${tr('Prices are indicative starting prices in Qatari Riyals and depend on site survey. Specifications may vary by model.', 'الأسعار تقديرية بالريال القطري وتعتمد على معاينة الموقع. قد تختلف المواصفات حسب الموديل.')} · ${tr('CR No.', 'س.ت')} ${C.site.cr}</p>
  </article>
</div></section>`;
  return layout(page, { title: `${t(s.title)} — ${tr('Data Sheet', 'ملف المواصفات')}`, description: t(s.summary) }, body);
}

function projectsPage() {
  const page = { key: 'projects', path: 'projects/', nav: 'projects' };
  const body = `${pageHero({ chip: tr('Projects gallery', 'معرض المشاريع'), title: tr('Our <span class="text-grad">projects</span>', '<span class="text-grad">مشاريعنا</span>'), text: tr('A selection of heater, chiller, flooring and interior jobs across Qatar.', 'مجموعة من أعمال السخانات والمبردات والأرضيات والديكور في قطر.'), crumbs: [[tr('Projects', 'المشاريع')]] })}
<section class="sec"><div class="container-site" data-filter-scope>
  <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist">
    <button type="button" class="pill active" data-filter="all">${tr('All', 'الكل')}</button>
    ${C.services.map((s) => `<button type="button" class="pill" data-filter="${s.slug}">${icon(s.icon, 'h-4 w-4')} ${esc(t(s.title))}</button>`).join('')}
  </div>
  <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${C.projects.map(projectCard).join('')}</div>
  <p class="mt-10 hidden text-center text-muted" data-filter-empty>${tr('No projects in this category yet.', 'لا توجد مشاريع في هذا القسم بعد.')}</p>
</div></section>`;
  return layout(page, { title: tr('Projects Gallery — Epoxy, Heaters, Chillers & Interiors in Qatar', 'معرض المشاريع — إيبوكسي، سخانات، مبردات وديكور في قطر'), description: tr('See our central water heater, tank chiller, epoxy, PVC flooring and interior decoration projects in Qatar.', 'شاهد مشاريعنا في السخانات المركزية ومبردات الخزانات والإيبوكسي وأرضيات PVC والديكور الداخلي في قطر.') }, body);
}

function shopPage() {
  const page = { key: 'shop', path: 'shop/', nav: 'shop' };
  const body = `${pageHero({ chip: tr('Trading shop', 'المحل التجاري'), title: tr('Products &amp; <span class="text-grad">materials</span>', 'المنتجات <span class="text-grad">والمواد</span>'), text: tr('Heaters, pumps, chillers, epoxy, PVC flooring, pipes, paints and tools. Enquire on WhatsApp for stock and the best price.', 'سخانات ومضخات ومبردات وإيبوكسي وأرضيات PVC وأنابيب ودهانات وعدد. استفسر عبر واتساب عن التوفر وأفضل سعر.'), crumbs: [[tr('Shop', 'المتجر')]] })}
<section class="sec"><div class="container-site" data-filter-scope>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist">
      <button type="button" class="pill active" data-filter="all">${tr('All', 'الكل')}</button>
      ${C.categories.map((c) => `<button type="button" class="pill" data-filter="${c.key}">${esc(t(c.t))}</button>`).join('')}
    </div>
    <label class="relative block lg:w-72"><span class="sr-only">${tr('Search products', 'ابحث عن منتج')}</span><span class="pointer-events-none absolute inset-y-0 start-4 grid place-items-center text-muted">${icon('search', 'h-4 w-4')}</span><input type="search" class="input !rounded-full !ps-11" placeholder="${tr('Search products…', 'ابحث عن منتج…')}" data-search-input></label>
  </div>
  <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">${C.products.map(productCard).join('')}</div>
  <p class="mt-10 hidden text-center text-muted" data-filter-empty>${tr('No products found. Ask us on WhatsApp — we probably have it.', 'لم يتم العثور على منتجات. اسألنا عبر واتساب — غالباً متوفر لدينا.')}</p>
</div></section>`;
  return layout(page, { title: tr('Shop — Water Heaters, Pumps, Epoxy, PVC Flooring & Building Materials', 'المتجر — سخانات، مضخات، إيبوكسي، أرضيات PVC ومواد بناء'), description: tr('Buy central water heaters, circulation pumps, tank chillers, epoxy kits, PVC barkia, pipes, paints and tools in Doha, Qatar.', 'اشترِ سخانات مركزية ومضخات تدوير ومبردات خزانات وأطقم إيبوكسي وباركيه PVC وأنابيب ودهانات وعدد في الدوحة، قطر.') }, body);
}

function productPage(p) {
  const page = { key: 'product', path: `shop/${p.slug}/`, nav: 'shop' };
  const c = cat(p.cat);
  const s = c.service && svc(c.service);
  const related = C.products.filter((x) => x.cat === p.cat && x !== p).slice(0, 4);
  const body = `<section class="sec"><div class="container-site">
  <nav class="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted"><a href="${href()}">${tr('Home', 'الرئيسية')}</a><span class="opacity-40">/</span><a href="${href('shop/')}">${tr('Shop', 'المتجر')}</a><span class="opacity-40">/</span><span class="font-semibold text-ink">${esc(t(p.name))}</span></nav>
  <div class="grid gap-10 lg:grid-cols-2">
    <div class="overflow-hidden rounded-[2rem] shadow-soft" ${reveal('left')}>${media({ img: p.img, ph: p.ph, ic: p.icon, alt: t(p.name), cls: 'aspect-square' })}</div>
    <div ${reveal('right')}>
      <span class="chip-dot">${esc(t(c.t))}</span>
      <h1 class="mt-4 text-3xl font-bold sm:text-4xl">${esc(t(p.name))}</h1>
      <p class="lead-text mt-4">${esc(t(p.excerpt))}</p>
      <p class="mt-6 text-2xl font-bold">${p.price ? `${tr('From', 'من')} <span class="text-brand-700">${qar(p.price)}</span> <span class="text-base font-medium text-muted">/ ${esc(t(p.unit))}</span>` : `<span class="text-brand-700">${tr('Price on request', 'السعر عند الطلب')}</span>`}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a href="${waLink(tr(`Hello, I am interested in: ${p.name[0]}`, `مرحباً، أنا مهتم بـ: ${p.name[1]}`))}" target="_blank" rel="noopener" class="btn btn-wa" data-track="whatsapp">${waIcon()} ${tr('Enquire on WhatsApp', 'استفسر عبر واتساب')}</a>
        <a href="tel:${C.site.phoneHref}" class="btn btn-outline" data-track="call">${icon('phone', 'h-5 w-5')} ${tr('Call', 'اتصل')}</a>
      </div>
      <h2 class="mt-10 text-lg font-bold">${tr('Specifications', 'المواصفات')}</h2>
      <div class="mt-4">${specTable(p.specs)}</div>
      ${s ? `<a href="${href('services/' + s.slug + '/')}" class="card card-hover mt-6 flex items-center gap-4 p-4"><span class="ico">${icon(s.icon)}</span><span><span class="block text-xs font-bold uppercase tracking-wider text-muted">${tr('Need installation?', 'تحتاج تركيب؟')}</span><span class="block font-bold">${esc(t(s.title))}</span></span>${arrow('ms-auto h-5 w-5 text-brand-600')}</a>` : ''}
    </div>
  </div>
</div></section>
${related.length ? `<section class="sec"><div class="container-site"><h2 class="h-section">${tr('Related products', 'منتجات ذات صلة')}</h2><div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">${related.map(productCard).join('')}</div></div></section>` : ''}`;
  return layout(page, {
    title: tr(`${p.name[0]} — Buy in Qatar`, `${p.name[1]} — للبيع في قطر`),
    description: t(p.excerpt),
    jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: t(p.name), description: t(p.excerpt), brand: t(C.site.name), ...(p.price ? { offers: { '@type': 'Offer', priceCurrency: 'QAR', price: p.price, availability: 'https://schema.org/InStock' } } : {}) },
  }, body);
}

function aboutPage() {
  const page = { key: 'about', path: 'about/', nav: 'about' };
  const body = `${pageHero({ chip: tr('About us', 'من نحن'), title: tr('Trading, contracting &amp; <span class="text-grad">hospitality</span> in Qatar', 'التجارة والمقاولات <span class="text-grad">والضيافة</span> في قطر'), text: tr('Juri Star Trading combines a well-stocked trading shop with an experienced installation team — so homes and businesses get materials and workmanship from one place.', 'تجمع جوري ستار للتجارة بين محل تجاري متكامل وفريق تركيب ذي خبرة — ليحصل المنازل والشركات على المواد والتنفيذ من مكان واحد.'), crumbs: [[tr('About', 'من نحن')]] })}
<section class="sec"><div class="container-site grid items-center gap-12 lg:grid-cols-2">
  <img src="/assets/img/shop-front.jpg" alt="${tr('Juri Star Trading shopfront', 'واجهة محل جوري ستار للتجارة')}" class="w-full rounded-[2rem] object-cover shadow-soft" loading="lazy" width="1600" height="900" ${reveal('left')}>
  <div ${reveal('right')}>
    <span class="eyebrow">${tr('Our story', 'قصتنا')}</span>
    <h2 class="h-section mt-4">${tr('Materials and installation, <span class="text-grad">under one roof</span>', 'المواد والتركيب <span class="text-grad">تحت سقف واحد</span>')}</h2>
    <div class="prose-site mt-6">
      <p>${tr('From our shop in Qatar we supply pipes and fittings, pumps, water heaters, paints, tools and building materials to contractors and homeowners every day.', 'من محلنا في قطر نورد يومياً الأنابيب والتوصيلات والمضخات وسخانات المياه والدهانات والعدد ومواد البناء للمقاولين وأصحاب المنازل.')}</p>
      <p>${tr('Our contracting team turns those materials into finished work: central hot water systems, water tank chillers, decorative epoxy floors, PVC barkia flooring and complete interior decoration.', 'ويحوّل فريق المقاولات لدينا هذه المواد إلى أعمال منجزة: أنظمة مياه ساخنة مركزية، مبردات خزانات، أرضيات إيبوكسي ديكورية، باركيه PVC وديكور داخلي متكامل.')}</p>
      <p>${tr(`We are a registered Qatari company (CR No. ${C.site.cr}) serving villas, apartments, offices, shops and accommodation across the country.`, `نحن شركة قطرية مسجلة (سجل تجاري رقم ${C.site.cr}) نخدم الفلل والشقق والمكاتب والمحلات والسكن في جميع أنحاء الدولة.`)}</p>
    </div>
  </div>
</div></section>
<section class="sec sec-tint"><div class="container-site">
  ${sectionHead({ center: true, eyebrow: tr('What we stand for', 'قيمنا'), title: tr('Why customers choose us', 'لماذا يختارنا العملاء') })}
  <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">${C.why.map((w, i) => `<div class="card p-6" ${reveal('up', i * 80)}><span class="ico ${i % 2 ? 'ico-red' : ''}">${icon(w.icon)}</span><h3 class="mt-5 text-lg font-bold">${esc(t(w.t))}</h3><p class="mt-2 text-sm leading-relaxed text-muted">${esc(t(w.d))}</p></div>`).join('')}</div>
</div></section>
<section class="sec"><div class="container-site">
  ${sectionHead({ eyebrow: tr('Areas we serve', 'المناطق التي نخدمها'), title: tr('Across <span class="text-grad">Qatar</span>', 'في جميع أنحاء <span class="text-grad">قطر</span>') })}
  <div class="mt-8 flex flex-wrap gap-3">${C.areas.map((a, i) => `<span class="pill" ${reveal('up', i * 40)}>${icon('pin', 'h-4 w-4 text-signal-500')} ${esc(t(a))}</span>`).join('')}</div>
</div></section>
${processSteps()}`;
  return layout(page, { title: tr('About Juri Star Trading Contracting & Hospitality', 'عن جوري ستار للتجارة والمقاولات والضيافة'), description: tr('Juri Star Trading is a Qatar trading shop and contracting team for water heaters, tank chillers, epoxy, PVC flooring and interior decoration.', 'جوري ستار للتجارة محل تجاري وفريق مقاولات في قطر للسخانات ومبردات الخزانات والإيبوكسي وأرضيات PVC والديكور الداخلي.') }, body);
}

function blogPage() {
  const page = { key: 'blog', path: 'blog/', nav: 'blog' };
  const body = `${pageHero({ chip: tr('Blog', 'المدونة'), title: tr('Guides &amp; <span class="text-grad">advice</span>', 'أدلة <span class="text-grad">ونصائح</span>'), text: tr('Practical tips on hot water, cooling and flooring for Qatar homes and businesses.', 'نصائح عملية حول المياه الساخنة والتبريد والأرضيات لمنازل وشركات قطر.'), crumbs: [[tr('Blog', 'المدونة')]] })}
<section class="sec"><div class="container-site grid gap-6 md:grid-cols-2 lg:grid-cols-3">${POSTS.map(postCard).join('')}</div></section>`;
  return layout(page, { title: tr('Blog — Water Heater, Chiller & Flooring Guides for Qatar', 'المدونة — أدلة السخانات والمبردات والأرضيات في قطر'), description: tr('Guides on central water heaters, tank chillers, epoxy and PVC flooring in Qatar.', 'أدلة حول السخانات المركزية ومبردات الخزانات والإيبوكسي وأرضيات PVC في قطر.') }, body);
}

function postPage(p) {
  const page = { key: 'post', path: `blog/${p.slug}/`, nav: 'blog' };
  const s = svc(p.service);
  const others = POSTS.filter((x) => x !== p).slice(0, 2);
  const body = `${pageHero({ chip: `${icon('calendar', 'h-3.5 w-3.5')} ${fmtDate(p.date)}`, title: esc(t(p.title)), text: esc(t(p.excerpt)), crumbs: [[tr('Blog', 'المدونة'), href('blog/')], [esc(t(p.title)).slice(0, 40) + '…']] })}
<section class="sec"><div class="container-site grid gap-12 lg:grid-cols-[1fr_340px]">
  <article class="prose-site max-w-3xl" ${reveal('up')}>${t(p.body)}</article>
  <aside class="grid content-start gap-5">
    <div class="card overflow-hidden lg:sticky lg:top-28">
      ${media({ ph: s.ph, ic: s.icon, alt: t(s.title), cls: 'aspect-[16/9]' })}
      <div class="p-6"><p class="text-xs font-bold uppercase tracking-wider text-muted">${tr('Related service', 'خدمة ذات صلة')}</p><h3 class="mt-1 text-lg font-bold">${esc(t(s.title))}</h3><p class="mt-2 text-sm text-muted">${fromQar(s.price)}</p>
      <div class="mt-4 grid gap-2"><a href="${href('services/' + s.slug + '/')}" class="btn btn-primary btn-sm">${tr('View service', 'عرض الخدمة')} ${arrow()}</a><a href="${waHello(t(s.title))}" target="_blank" rel="noopener" class="btn btn-wa btn-sm" data-track="whatsapp">${waIcon('h-4 w-4')} WhatsApp</a></div></div>
    </div>
  </aside>
</div></section>
<section class="sec"><div class="container-site"><h2 class="h-section">${tr('More articles', 'مقالات أخرى')}</h2><div class="mt-8 grid gap-6 md:grid-cols-2">${others.map(postCard).join('')}</div></div></section>`;
  return layout(page, {
    title: t(p.title), description: t(p.excerpt), ogType: 'article',
    jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: t(p.title), description: t(p.excerpt), datePublished: p.date, inLanguage: L, author: { '@type': 'Organization', name: t(C.site.legal) }, publisher: { '@type': 'Organization', name: t(C.site.legal), logo: { '@type': 'ImageObject', url: C.site.domain + '/assets/img/logo-mark.svg' } } },
  }, body);
}

function contactPage() {
  const page = { key: 'contact', path: 'contact/', nav: 'contact' };
  const cards = [
    ['phone', tr('Mobile', 'الجوال'), C.site.phone, `tel:${C.site.phoneHref}`, 'call', true],
    ['building', tr('Landline', 'الهاتف الأرضي'), C.site.landline, `tel:${C.site.landlineHref}`, 'call', true],
    ['chat', 'WhatsApp', C.site.whatsappDisplay, waHello(), 'whatsapp', true],
    ['mail', tr('Email', 'البريد الإلكتروني'), C.site.email, `mailto:${C.site.email}`, '', false],
  ];
  const body = `${pageHero({ chip: tr('Contact', 'اتصل بنا'), title: tr('Let’s talk about <span class="text-grad">your project</span>', 'لنتحدث عن <span class="text-grad">مشروعك</span>'), text: tr('Call, WhatsApp, email or visit our shop. We reply the same day.', 'اتصل أو راسلنا واتساب أو بالبريد أو زر محلنا. نرد في نفس اليوم.'), crumbs: [[tr('Contact', 'اتصل بنا')]] })}
<section class="sec"><div class="container-site">
  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">${cards.map(([ic, label, val, link, tk, ltr], i) => `<a href="${link}" ${tk === 'whatsapp' ? 'target="_blank" rel="noopener"' : ''} ${tk ? `data-track="${tk}"` : ''} class="card card-hover p-6" ${reveal('up', i * 70)}><span class="ico ${i % 2 ? 'ico-red' : ''}">${icon(ic)}</span><p class="mt-5 text-xs font-bold uppercase tracking-wider text-muted">${label}</p><p class="mt-1 break-all text-lg font-bold" ${ltr ? 'dir="ltr"' : ''}>${val}</p></a>`).join('')}</div>
  <div class="mt-8 grid gap-10 lg:grid-cols-2">
    <div ${reveal('left')}><h2 class="h-section mb-6">${tr('Send us a message', 'أرسل لنا رسالة')}</h2>${quoteForm({ source: 'contact', compact: true })}</div>
    <div class="grid content-start gap-5" ${reveal('right')}>
      <div class="overflow-hidden rounded-[1.6rem] border border-line shadow-card"><iframe title="${tr('Map', 'الخريطة')}" src="https://www.google.com/maps?q=${encodeURIComponent(C.site.mapQuery)}&output=embed" class="h-[340px] w-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <div class="card grid gap-3 p-6 text-sm">
        <p class="flex items-center gap-3">${icon('pin', 'h-5 w-5 text-signal-500')} <strong>${esc(t(C.site.address))}</strong></p>
        <p class="flex items-center gap-3">${icon('clock', 'h-5 w-5 text-brand-600')} ${esc(t(C.site.hours))}</p>
        <p class="flex items-center gap-3">${icon('badge', 'h-5 w-5 text-brand-600')} ${tr('CR No.', 'سجل تجاري رقم')} ${C.site.cr}</p>
      </div>
    </div>
  </div>
</div></section>`;
  return layout(page, { title: tr('Contact Juri Star Trading — Call or WhatsApp', 'اتصل بجوري ستار للتجارة — اتصال أو واتساب'), description: tr(`Contact Juri Star Trading in Doha. Call ${C.site.phone} or WhatsApp ${C.site.whatsappDisplay} for a free site visit and quote.`, `تواصل مع جوري ستار للتجارة في الدوحة. اتصل ${C.site.phone} أو واتساب ${C.site.whatsappDisplay} لزيارة وعرض سعر مجاني.`) }, body);
}

function quotePage() {
  const page = { key: 'quote', path: 'quote/', nav: '' };
  const body = `${pageHero({ chip: tr('Free · No obligation', 'مجاني · بدون التزام'), title: tr('Request a <span class="text-grad">free quote</span>', 'اطلب <span class="text-grad">عرض سعر مجاني</span>'), text: tr('Tell us what you need. Your request opens in WhatsApp (or email) ready to send — we reply the same day.', 'أخبرنا بما تحتاجه. يُفتح طلبك في واتساب (أو البريد) جاهزاً للإرسال — نرد في نفس اليوم.'), crumbs: [[tr('Quote', 'عرض سعر')]] })}
<section class="sec"><div class="container-site grid gap-10 lg:grid-cols-[1.5fr_1fr]">
  <div ${reveal('up')}>${quoteForm({ source: 'quote' })}</div>
  <aside class="grid content-start gap-4">
    ${C.process.map((s, i) => `<div class="card flex gap-4 p-5" ${reveal('right', i * 80)}><span class="ico ${i % 2 ? 'ico-red' : 'ico-soft'}">${icon(s.icon)}</span><div><h3 class="font-bold">${i + 1}. ${esc(t(s.t))}</h3><p class="mt-1 text-sm text-muted">${esc(t(s.d))}</p></div></div>`).join('')}
  </aside>
</div></section>`;
  return layout(page, { title: tr('Request a Free Quote', 'اطلب عرض سعر مجاني'), description: tr('Request a free site visit and quote for central water heaters, tank chillers, epoxy, PVC flooring or interior decoration in Qatar.', 'اطلب زيارة وعرض سعر مجاني للسخانات المركزية أو مبردات الخزانات أو الإيبوكسي أو أرضيات PVC أو الديكور الداخلي في قطر.') }, body);
}

function notFoundPage() {
  const page = { key: '404', path: '', nav: '', noindex: true };
  const body = pageHero({ chip: '404', title: tr('Page <span class="text-grad">not found</span>', 'الصفحة <span class="text-grad">غير موجودة</span>'), text: tr('The page you are looking for doesn’t exist.', 'الصفحة التي تبحث عنها غير موجودة.'), actions: `<a href="/" class="btn btn-primary">${tr('Back to home', 'العودة للرئيسية')} ${arrow()}</a><a href="/ar/" class="btn btn-white">العربية</a>` });
  return layout(page, { title: tr('Page not found', 'الصفحة غير موجودة'), description: 'Juri Star Trading' }, body);
}

/* ---------------------------------------------------------------- write */
// Optional sub-path (GitHub Pages project sites), e.g. BASE=/juri-star-trading/
const BASE = ('/' + (process.env.BASE || '').replace(/^\/+|\/+$/g, '') + '/').replace('//', '/');

const write = (rel, html) => {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (BASE !== '/' && file.endsWith('.html')) {
    html = html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE}`);
  }
  fs.writeFileSync(file, html);
};

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(__dirname, 'assets'), path.join(DIST, 'assets'), { recursive: true });

const urls = [];
for (const lang of LANGS) {
  L = lang;
  const pre = lang === 'ar' ? 'ar/' : '';
  const out = (p, html) => { write(pre + p + 'index.html', html); if (!p.includes('datasheet')) urls.push(base(lang) + p); };
  out('', homePage());
  out('about/', aboutPage());
  out('services/', servicesPage());
  C.services.forEach((s) => { out(`services/${s.slug}/`, servicePage(s)); out(`services/${s.slug}/datasheet/`, datasheetPage(s)); });
  out('projects/', projectsPage());
  out('shop/', shopPage());
  C.products.forEach((p) => out(`shop/${p.slug}/`, productPage(p)));
  out('blog/', blogPage());
  POSTS.forEach((p) => out(`blog/${p.slug}/`, postPage(p)));
  out('contact/', contactPage());
  out('quote/', quotePage());
}
L = 'en';
write('404.html', notFoundPage());

const today = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${C.site.domain}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${C.site.domain}/sitemap.xml\n`);
write('CNAME', 'juristartrading.com\n');

console.log(`Built ${urls.length} pages (+ data sheets) → dist/${BASE !== '/' ? `  base: ${BASE}` : ''}`);
