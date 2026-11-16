# FB Code LLC — website

Static site. No build step, no dependencies.

```bash
npx serve -l 4173
```

Use a server that resolves `/services` to `services.html` (`serve` does; `python3 -m
http.server` does not), because every link on the site is written without the extension.

Deploys from `main` on GitHub Pages.

## Addresses without `.html`

GitHub Pages serves `services.html` at `/services` on its own, so nothing is configured:
the links, canonical tags and sitemap simply leave the extension off. The old `.html`
addresses still resolve, and a line in each page's head script rewrites the address bar
to the clean form. A new page only has to be linked without its extension. On another
host, turn on its "clean URLs" option (Netlify and Cloudflare Pages do this by default).

## Before it goes live

Four things need your input: the Work page and its demo console (2), the commercial
terms (4), a read of the privacy page (5) and the wording around the process map (6).
Nothing else is blocking.

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

**Spam check (Cloudflare Turnstile) — wired in, switched off until you add keys.** The
form already has a honeypot field; this adds a real check. To turn it on:

1. In the Cloudflare dashboard, open Turnstile and add a widget. Allowed domain:
   `fb-code.com` (add `localhost` if you want to test locally). Mode: Managed. Copy the
   **Site Key** and the **Secret Key**.
2. In the Formspree dashboard, open the form's settings, CAPTCHA section, choose
   "Cloudflare Turnstile" and paste the **Secret Key**.
3. In `contact.html`, paste the **Site Key** into the slot above the submit button:
   `<div class="captcha" data-captcha data-sitekey="YOUR-SITE-KEY" hidden>`.

Do steps 2 and 3 together. With the key in the page but not in Formspree, the check shows
but nothing verifies it; with Formspree enforcing it and no key in the page, submissions
carry no token.

How it behaves (`initCaptcha` in `site.js`): the Cloudflare script is fetched only when a
visitor first focuses, taps or types in the form, so no other page and no idle visit
calls Cloudflare. Sending is held until the check has passed, the token goes to Formspree
as `cf-turnstile-response`, and the widget is reset after every attempt. On screens too
narrow for the full widget it uses the compact size. The form is now posted as form data
rather than JSON, which is the shape Formspree documents for Turnstile.

Once the check is on, the form needs JavaScript: the widget cannot run without it, so the
no-JavaScript path described above will no longer get a message through. Formspree's docs
do not say how a submission without a token is answered. The privacy page already lists
Cloudflare; if you decide not to turn the check on, remove that entry.

To move off Formspree later, point the `action` at any backend that accepts a JSON POST
(and a plain form POST, for the no-JavaScript path), or remove the `action` and set
`contactEmail` in `assets/js/site.js` to fall back to a prefilled mailto.

### 2. Work page — confirm you can show the access-control project

`work.html` shows six screens of the multi-site
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
the case-study intro on `work.html`.

The home page and `work.html` also carry a **working model of the console**
(`assets/js/demo.js`): six invented doors on two invented sites, labelled "Demo data".
Only the visitor's clicks create events; nothing is simulated in the background and no
client data is involved. Confirm the client is comfortable with a model of their product's
idea being shown, as with the screenshots.

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
flows in it were checked against the code: contact form to Formspree (with the process map
when one is attached), the Turnstile check on that form, GitHub Pages request logs, and a theme preference and the visitor's
process map in `localStorage`. No analytics, no cookies, no trackers, and
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

### 6. The process map — wording to confirm

The home page hero is a working process mapper (`assets/js/map.js`). A visitor edits an
example process and the page totals hands-on hours a week, steps done by hand and
end-to-end time from what they typed. Every figure on screen is the visitor's own
arithmetic; the site still makes no claim about results.

- The example (an order process, 40 a week, five steps) is `EXAMPLE_MAP` in `map.js`. The
  same figures are written into `index.html` and `map.html` for visitors without
  JavaScript, so change both together.
- The map is saved in the visitor's browser (`localStorage`, `fbcode-map`). It reaches you
  only when they send the contact form with it attached: the summary and a link that
  reopens it on `/map` are added to the end of the message text (`foldMapIntoMessage` in
  `site.js`), so they arrive wherever the message does. "Do not send it" on the contact
  page detaches it for that message.
- Only a map the visitor has changed is attached. While the mapper still shows the
  untouched example, the button under the totals reads "Start a brief", and it becomes
  "Send this map with your brief" after the first edit.
- `/map` is the one-page version: printable, and shareable by a link that holds the whole
  map after the `#`, so nothing is stored on a server.
- Once a visitor has a map, the header shows a "Your map" chip on every page, Services
  shows a strip built from it, and the "What you keep" cards on home fill in from it.
- Copy to check: "A couple of minutes" (services, approach, contact), the "Where we would
  look first" notes on `/map` (questions, not promises), and the three document cards on
  home. The spec and report cards show only what the site already said those documents
  contain; swap in real samples when you have ones you can show.

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

- Hero (home): the mark's red outline draws itself behind the mapper; drifting red aurora;
  the grid lights red under the pointer and the mark drifts with it (`initHeroPointer`).
  Inner-page heroes get the same grid light.
- Headings arrive a word at a time (`initSplit`; the `.words` class). The heading keeps its
  full text as its accessible name.
- Mapper: totals count up or down when a value changes, bar segments resize in place, a
  marker crosses the bar, and a highlight circles the result panel. Below 1100px the
  headline figures ride in a bar pinned to the bottom of the screen while steps are edited.
- Console: a door swings open, a dot flies from the door to the log, the event row drops
  in; a revoked card shakes the console.
- Cards with `.spot` get a red edge that follows the pointer; `[data-tilt]` cards lean
  toward it; signal buttons pull slightly toward it (`initSpot`, `initTilt`, `initMagnet`).
- A red line under the header shows how far down the page the reader is (CSS scroll
  timeline; absent in browsers without it).
- Screenshots on Work open full size in a dialog (`data-zoom`, `initZoom`); the arrows and
  the left/right keys step through every screenshot on the page.
- Timeline: the red line draws through the five steps when it scrolls into view — across the
  page on home, down a vertical rail on Approach (`.timeline--rail`).
- Home FAQ: native `<details>`, no JavaScript.
- Services: the left-hand index is sticky and highlights the section in view (`initSpy`).
- Work system diagram (`.arch`): a red dot travels each connector.
- Approach, "What we measure": each measure has a small inline SVG showing what the number
  tracks (`.measure-glyph`); the red stroke draws in on scroll.
- Contact: on success the form is replaced by a "Message sent" panel (`showSent`). Each
  service on `services.html` links to `contact?need=<slug>`, which preselects the
  matching "What you need" option (`initNeed`; slugs are the `data-need` attributes).
- Pages cross-fade on navigation (`@view-transition` in `site.css`) where the browser
  supports it.
- Work cards: screenshots sit in a browser frame that slides up on hover.
- Stack: an infinite marquee, paused on hover.
- Scroll reveal and stagger: `STAGGER_STEP_MS` / `REVEAL_MS` in `site.js` must match the CSS.

Scripts load in order: `site.js`, then `map.js` (every page), then `demo.js` (home and
Work). The later two use `Str` and `Motion` from `site.js`.

Without JavaScript the mapper shows the example as a static table with its totals, the
console shows its doors with a note, and `/map` shows the example map.

Under `prefers-reduced-motion: reduce` the aurora, marquee, draw-on, word-by-word headings,
tilt, button pull, bar marker, panel highlight, flying dot, parallax, page cross-fade and
the moving markers in the diagram are all switched off.
