# Changelog

## 0.1.2 — 2026-11-01

### The demo was empty, and nobody could see it

`astro-kit.js` was split out of `panchang.js` when the astronomy moved to the shared kit, but
the script tag was never added to the page. `panchang.js` threw on load, so the app rendered a
blank hero and no cards — the deployed demo, the EXE and the APK all shipped a broken day.
The screenshot for the new landing page is what caught it. A test now reads the page, checks
that every script it names exists, and that `astro-kit` is loaded before `panchang`.

### A landing page, and it is not the app

`docs/index.html` was a 60-line card in the app's own warm palette. It is now a page of its
own: night sky, gold, a sans face against the app's serif, and a **tithi dial** that computes
today's tithi on the page itself with the app's engine. The demo is the real app embedded in a
browser frame and driven by guided buttons — Diwali, Holi, the muhurat finder, Gujarati — with
a poster behind the frame so a blocked frame still shows the product.

### A day is addressable

`#d=2026-11-08&lat=19.0760&lng=72.8777&tz=5.5&lang=gu&muhurat=1`. The app reads the hash on
load, listens for changes, and writes it back with `replaceState`. A panchang can be linked,
shared or embedded, and the landing page's guided buttons drive the frame with it.

### Offline is now true for a visitor, not just for an owner

There was no service worker, so a Pages visitor had to be online to open an app that promises
it does not need the network. Added `sw.js` (the HTML network-first, assets cache-first with a
background refresh, `CACHE` bumped per release, `registration.update()` on load) and a web
manifest with a maskable icon and an SVG master.

### You can tell which build you are on

The app footer and the landing page footer both print a build stamp — version, engine version,
astro version. A cache-first worker once hid a shipped change with no way for a reader to
notice; this makes the question answerable from the page.

### Badges that do not need the network

The README pointed its badges at an image service. They are now drawn by `scripts/badges.py`
into `docs/assets/badge-*.svg` and referenced by relative path, in this repo's palette.

### Screenshots from the real pages

`scripts/shot.py` serves the repo over a throwaway local HTTP server and shoots four images —
landing page and app, desktop and phone. The iframe of the app does not paint from `file://`
in headless Chromium, which is why the first attempt produced a screenshot that showed the
poster and proved nothing.

### Tests: 24 → 37

Thirteen new assertions, all on the things that actually broke or could break silently: the
page's script wiring, the service worker's registration and precache list, the manifest's
`start_url` and maskable icon, the presence of a build stamp, and a scan of every shipped file
for a script, link or fetch pointed at another origin.

### Also

- `panchang.js` said MIT in its header while LICENSE, the README and the workflow said
  PolyForm Noncommercial 1.0.0. The header now agrees.
- `ENHANCEMENTS.md`: the offline roadmap, grouped by what it buys the reader, with effort
  estimates and a "not doing, on purpose" section.
- README rebuilt: badges, promise, links, screenshot block, the numbers, the restraints, the
  method, how to run, how to download, the layout.

## 0.1.1 — 2026-10-25

- **Licence: PolyForm Noncommercial 1.0.0.** Every repository now carries the canonical text
  from polyformproject.org with the Required Notice line, and the four places a repo states
  its licence agree: LICENSE, the SPDX headers, the README and package.json.
- **The public demo is the app.** A build now fails if `docs/play/index.html` is not the app,
  because a demo running older code is two code paths for one program.


## 0.1.0 — 2026-10-24

- The demo now deploys automatically on every push, and each release carries a version and a changelog.

## 0.1.0 — 2026-10-23

- First pass. Offline Panchang engine (`docs/play/panchang.js`): tithi, nakshatra,
  yoga, karana, paksha, vaara, sunrise/sunset, rahu-kaal, observances, muhurat finder.
- Single-page app (`docs/play/index.html`) on web-kit: storage, EN/HI/GU, CSV export, theme.
- Headless tests cross-checked against an independent ephemeris: 24 passed, 0 failed.
- Build workflow for the portable EXE and Android APK.
