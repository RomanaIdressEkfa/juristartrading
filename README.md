# Juri Star Trading — juristartrading.com

Static, bilingual (English `/` + Arabic RTL `/ar/`) website for **Juri Star Trading Contracting & Hospitality**, Doha, Qatar.
Same setup as the Exotic Tint Qatar site: a Node script renders every page to plain HTML, Tailwind builds the CSS, and GSAP + Three.js add motion and 3D.

## Run it

```bash
npm install
npm run dev      # build + serve on http://localhost:5173  (Arabic: /ar/)
npm run build    # build only → dist/
```

## Where things live

| File | What it holds |
| --- | --- |
| `src/content.js` | **All business data**: phone/WhatsApp/email, analytics IDs, the 5 services (prices "from QAR", specs, FAQs, heater package), shop products, projects |
| `src/blog.js` | Blog posts (English + Arabic HTML) |
| `src/build.js` | Page templates, SEO tags, JSON-LD, sitemap |
| `src/styles.css`, `tailwind.config.js` | Design system (green / red / forest) |
| `src/assets/js/main.js` | Menu, filters, quote form → WhatsApp/email, conversion tracking |
| `src/assets/js/motion.js` | GSAP scroll animations |
| `src/assets/js/scene3d.js` | Three.js scenes (hero, heater, chiller, epoxy, PVC, interior) |
| `src/assets/img/` | Logo, favicon, shop photo — put project/product photos here |

Every text is a pair: `['English', 'العربية']`.

## Before go-live (client to confirm)

- **Prices** in `content.js` (`price.from`, product `price`) are placeholders.
- **Projects** in `content.js` are sample entries. Replace them with real jobs and add photos (`img: '/assets/img/projects/xyz.jpg'`).
- **Opening hours, email, social links**.
- **Photos**: service photos in `src/assets/img/photos/` are free stock photos (Unsplash licence, no attribution required) used until the client's own job photos arrive. Swap them for real work photos when available. Products/projects still use pattern placeholders until `img` is set.
- **Google Analytics / Ads**: set `analytics.ga4`, `analytics.ads` and the conversion labels. Calls, WhatsApp clicks and quote submits are then tracked as events / conversions.
- **PDF data sheets**: each service has a printable data sheet at `/services/<slug>/datasheet/` (Print → Save as PDF).

## Quote form

There is no backend: the form validates, then opens WhatsApp (or the visitor's email app) with the enquiry pre-filled and fires a `generate_lead` conversion.

## Deploy

- **GitHub Pages**: push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist/` (Settings → Pages → Source: GitHub Actions). Add the custom domain `juristartrading.com` in Pages settings.
- **Any static host / cPanel**: run `npm run build` and upload the contents of `dist/`.
