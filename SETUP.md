# FB Code LLC — website

Static site. No build step, no dependencies. Open `index.html` or serve the folder.

```bash
python3 -m http.server 4173
```

Deploy by uploading the folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront).

## Before it goes live

Three things need your input: the Work page (2), the commercial terms (4) and a read of
the privacy page (5). Nothing else is blocking.

### 1. Contact destination — done

The form posts to Formspree. The endpoint is the form's `action` in `contact.html`:

```html
<form class="form" data-contact-form action="https://formspree.io/f/mbggzndn" method="POST">
```

With JavaScript the script validates, posts to that URL in the background and shows the
"Message sent" panel. Without it the browser validates the required fields and posts the
form itself, landing on Formspree's own thank-you page.

The recipient address is configured in the Formspree dashboard, not here, so it is not
exposed in the page source. Formspree's free plan is capped (roughly 50 submissions a
month at time of writing) — check the dashboard if enquiries stop arriving.

To move off Formspree later, point the `action` at any backend that accepts a JSON POST
(and a plain form POST, for the no-JavaScript path), or remove the `action` and set
`contactEmail` in `assets/js/site.js` to fall back to a prefilled mailto.

### 2. Work page — confirm you can show the access-control project

`work.html` and the home page's showcase show six screens of the multi-site
access-control console (from `~/Desktop/AccessControl/pitch-images`). The product logo,
user avatar, demo email addresses and the localhost status bar were painted out; the
exports live in `assets/img/work/`. Member names in the tables are seed data.

Confirm the client agreement allows showing it un-named. Also confirm the "What changed"
table on `work.html`: it says membership plans, payments and end-of-day reporting were each
kept in a spreadsheet before, which restates the case-study intro.

The "How it fits together" diagram on `work.html` was drawn from the screenshots, not from
the system's documentation: doors and controllers at each site, one edge device per site
reporting in, an event pipeline, then members, plans and payments, then the console. Correct
it if the real topology differs, and check the client is comfortable with it being shown. The site makes no numeric claims
about the project; once there is a measured result (cycle time, steps removed), add it to
the case-study intro on `work.html` and under the home page showcase.

### 3. Domain — done

`sitemap.xml` and `robots.txt` carry the real domain, every page has an absolute
`canonical` and `og:url`, and `404.html` is marked `noindex`. `404.html` is the one page whose
links and assets start with `/`, because GitHub Pages serves it at whatever path was
mistyped; it therefore only renders styled when the site is served from a domain root.

Every page points `og:image` at `assets/img/og.jpg` (1200×630), so links shared to Slack,
LinkedIn or iMessage unfurl with a picture. If the headline changes, regenerate that image.

Worth doing now that the domain resolves: submit `https://fb-code.com/sitemap.xml` in
Google Search Console and Bing Webmaster Tools.

### 4. Commercial terms need your sign-off

The site states these as fact. They came from the design deck's placeholder copy, so
confirm each one is what you actually offer, or change it:

- "A reply from an engineer within one business day" (home, contact, all CTAs, the form's
  sent state)
- "One to two weeks, paid" for the mapping and scope phase (services, approach, home FAQ,
  contact)
- "A written spec and build plan you own outright" (services, approach, home)
- "Two-week iterations" (home, approach)
- "Monthly retainer, cancel with notice" (approach, home FAQ)
- "45-minute first call, no deck" (services, contact, home FAQ)

The FAQ on the home page and the "What happens next" list on the contact page restate
these in one place each. If a term changes, change it there too.

### 5. Privacy page — live, worth one read

`privacy.html` is linked from every footer and no longer carries a draft notice. The data
flows in it were checked against the code: contact form to Formspree, GitHub Pages request
logs, and a theme preference in `localStorage`. No analytics, no cookies, no trackers, and
since the fonts moved onto the site, no third-party requests at all apart from the form.

Two things were written to avoid needing details that were not available:

- **No registered address.** The page names FB Code LLC as responsible and points to the
  contact form. Some jurisdictions expect a postal address for the data controller; add one
  under "Who to ask" if yours does.
- **No fixed retention period.** It says enquiries are kept as long as needed to reply and
  for ordinary business records, and deleted on request.

It has not been reviewed by a lawyer.

No terms of service page exists. A brochure site that only takes enquiries usually does
not need one; add it if you start doing anything transactional here.

## Brand

The 2026 rebrand. Source logos are in `../brand/new/` (the four WhatsApp plates). The
mark was traced to vector with potrace and lives in `assets/img/`:

| File | Use |
|---|---|
| `mark.svg` | FB mark alone, `currentColor` fill. Used as a CSS mask (`.mark`) so it takes any colour |
| `lockup.svg` / `lockup-red.svg` | Mark plus the "code" wordmark, for documents and social |
| `../favicon.svg` | Frost mark on a red rounded square |

| Token | Value | Use |
|---|---|---|
| Red | `#E00B07` | Mark, fills, buttons, large type — sampled from the logo plates |
| Red (text on ink) | `#FF4D47` | Small accent text on dark, 6:1 |
| Red (text on frost) | `#C80A06` | Small accent text on light, 5.2:1 |
| Frost | `#ECF1F5` | Light ground, mark on red |
| Ink | `#08080A` | Dark ground |

Type: Inter Tight (headlines), Inter (body), Instrument Serif italic (one accent word per
headline, wrapped in `<em>`), JetBrains Mono (labels). All four are self-hosted variable
fonts in `assets/fonts/` (latin subset, SIL Open Font License), declared at the top of
`site.css`. The two used above the fold are preloaded in each page's `<head>`.

Work screenshots ship as WebP in two widths (`name-1000.webp`, `name.webp`) with the
original JPG as the `src` fallback. To add one: export a 1800px-wide JPG, then
`cwebp -q 84 -sharp_yuv name.jpg -o name.webp` and the same with `-resize 1000 0`.

## Dark and light

Text contrast was checked on every page in both themes against WCAG AA (4.5:1, 3:1 for
large type). `--text-faint` on the frost ground is at the limit — do not lighten it.

Dark is the default; the header toggle switches to light and is remembered in
`localStorage` under `fbcode-theme`. Every colour is a semantic token assigned by two ground
blocks at the top of `site.css`; a `.paper` section inverts whichever ground the page is on.
**Do not reorder those blocks.**

## Motion

- Hero: the mark's red outline draws itself on load, then the solid mark rises in; drifting
  red aurora behind it; the mark follows the pointer by up to 18px. Below 900px the mark is
  outline-only and sits behind the copy.
- Home showcase: six tabs switch one large screenshot (`initShowcase` in `site.js`). Without
  JavaScript the tabs are hidden and all six screens show in sequence.
- Screenshots on home and Work open full size in a dialog (`data-zoom`, `initZoom`); the
  arrows and the left/right keys step through every screenshot on the page.
- Timeline: the red line draws through the five steps when it scrolls into view — across the
  page on home, down a vertical rail on Approach (`.timeline--rail`).
- Home process illustration (`.flow`): one marker stalls its way through the manual lane
  while three pass through the automated one. Pure CSS, driven by the registered `--p`
  property.
- Home FAQ: native `<details>`, no JavaScript.
- Services: the left-hand index is sticky and highlights the section in view (`initSpy`).
- Work system diagram (`.arch`): a red dot travels each connector.
- Approach, "What we measure": each measure has a small inline SVG showing what the number
  tracks (`.measure-glyph`); the red stroke draws in on scroll.
- Contact: on success the form is replaced by a "Message sent" panel (`showSent`). Each
  service on `services.html` links to `contact.html?need=<slug>`, which preselects the
  matching "What you need" option (`initNeed`; slugs are the `data-need` attributes).
- Pages cross-fade on navigation (`@view-transition` in `site.css`) where the browser
  supports it.
- Work cards: screenshots sit in a browser frame that slides up on hover.
- Stack: an infinite marquee, paused on hover.
- Scroll reveal and stagger: `STAGGER_STEP_MS` / `REVEAL_MS` in `site.js` must match the CSS.

Under `prefers-reduced-motion: reduce` the aurora, marquee, draw-on, lifts, parallax, page
cross-fade and the moving markers in the two diagrams are all switched off.
