# FB Code LLC — website

Static site. No build step, no dependencies. Open `index.html` or serve the folder.

```bash
python3 -m http.server 4173
```

Deploy by uploading the folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront).

## Before it goes live

Five things need your input. Nothing else is blocking.

### 1. Contact destination — done

The form posts to Formspree. The endpoint lives in `assets/js/site.js`:

```js
const SITE = {
  contactEmail: "",   // optional mailto fallback, only used when formEndpoint is blank
  formEndpoint: "https://formspree.io/f/mbggzndn",
};
```

The recipient address is configured in the Formspree dashboard, not here, so it is not
exposed in the page source. Formspree's free plan is capped (roughly 50 submissions a
month at time of writing) — check the dashboard if enquiries stop arriving.

To move off Formspree later, swap `formEndpoint` for any backend that accepts a JSON POST,
or clear it and set `contactEmail` to fall back to a prefilled mailto.

### 2. Work page — confirm you can show the access-control project

`work.html` and the home page's "Selected work" now show six screens of the multi-site
access-control console (from `~/Desktop/AccessControl/pitch-images`). The product logo,
user avatar, demo email addresses and the localhost status bar were painted out; the
exports live in `assets/img/work/`. Member names in the tables are seed data.

Confirm the client agreement allows showing it un-named, and add a measured result
(cycle time, steps removed) to the case-study intro once you have one.

### 3. Domain — done, except the social image

`sitemap.xml` and `robots.txt` carry the real domain, every page has an absolute
`canonical` and `og:url`, and `404.html` is marked `noindex`.

Still missing: an `og:image`. Social previews need a raster image (1200×630 PNG) at an
absolute URL — the SVG mark will not do. Until one exists, links shared to Slack, LinkedIn
or iMessage will unfurl as plain text with no picture.

Worth doing now that the domain resolves: submit `https://fb-code.com/sitemap.xml` in
Google Search Console and Bing Webmaster Tools.

### 4. Commercial terms need your sign-off

The site states these as fact. They came from the design deck's placeholder copy, so
confirm each one is what you actually offer, or change it:

- "A reply from an engineer within one business day" (home, contact, all CTAs)
- "One to two weeks, paid" for the mapping and scope phase (services, approach)
- "A written spec and build plan you own outright" (services, approach)
- "Two-week iterations" (home, approach)
- "Monthly retainer, cancel with notice" (approach)
- "45-minute first call, no deck" (services, contact)

### 5. Legal pages — privacy drafted, needs review

`privacy.html` exists and is linked from every footer. The data flows in it were checked
against the code and are accurate: contact form to Formspree, GitHub Pages request logs,
Google Fonts seeing visitor IPs, and a theme preference in `localStorage`. No analytics,
no cookies, no trackers — verified, not assumed.

Two blanks are marked in the page and a visible draft notice sits at the top. Fill in the
**registered address** and a **concrete retention period**, have someone confirm it suits
the jurisdiction FB Code LLC answers to, then delete the notice.

No terms of service page exists. A brochure site that only takes enquiries usually does
not need one; add it if you start doing anything transactional here.

If the Google Fonts dependency is unwelcome on privacy grounds, self-hosting the four
families removes that third party entirely — see the Brand section.

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
headline, wrapped in `<em>`), JetBrains Mono (labels). All from Google Fonts.

## Dark and light

Dark is the default; the header toggle switches to light and is remembered in
`localStorage` under `fbcode-theme`. Every colour is a semantic token assigned by two ground
blocks at the top of `site.css`; a `.paper` section inverts whichever ground the page is on.
**Do not reorder those blocks.**

## Motion

- Hero: the mark's red outline draws itself on load, then the solid mark rises in; drifting
  red aurora behind it; the mark follows the pointer by up to 18px.
- Cards and service rows: a red spotlight follows the pointer (`--x/--y` set in `site.js`),
  lift on hover, red hairline across the top edge.
- Work cards: screenshots sit in a browser frame that slides up on hover.
- Stack: an infinite marquee, paused on hover.
- Scroll reveal and stagger: `STAGGER_STEP_MS` / `REVEAL_MS` in `site.js` must match the CSS.

Under `prefers-reduced-motion: reduce` the aurora, marquee, draw-on, lifts and parallax
are all switched off.
