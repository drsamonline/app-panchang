# Changelog

## 0.2.3 — 2026-11-05

The stamp guard was red on `main`, and it was right.

### The record had drifted from what shipped

The 2026-11-04 sweep rewrote `docs/index.html` and `docs/play/index.html` without moving
VERSION, so `BUILD.json` described files that no longer existed — and the `Test` workflow
refused it on every push. VERSION, `sw.js`'s `VERSION`, `APP_VERSION` and the landing page's
`BUILD` stamp all move to 0.2.3 together, and `BUILD.json` is re-stamped.

### The offline guard refused the support block

"the app loads nothing from another origin" scanned every `href`, so it counted the
footer's `<a href="https://ko-fi.com/...">` as a cross-origin load. A link the reader may
choose to follow loads nothing. The guard now refuses `src` and `<link href>` — what the
page itself fetches — and allows `<a href>`.

## 0.2.2 — 2026-11-01

No behaviour change. The build now refuses the bug 0.2.1 was about.

### The version tag was a promise, not a check

0.2.1 fixed the frozen page by tagging every asset with `?v=<VERSION>`, which only works if
VERSION moves whenever a shipped file does. Nothing enforced that. A commit could edit
`panchang.js`, leave VERSION alone, pass every test, and hand a returning reader the new page
beside the old engine out of a cache — the exact failure 0.2.1 was written to end.

- **`scripts/stamp.js`** records the SHA-256 of every file a browser can fetch — the app, its
  data, the worker, the manifest, all six icons and the landing page — in a committed
  `BUILD.json`. If one of them has changed while VERSION has not, it **refuses to write** and
  says which file moved and why it matters. `--check` verifies without writing.
- **`test-node.js` checks the record** in-process, so CI refuses the same thing without an extra
  workflow step: the record is for this VERSION, no shipped file has drifted since it was
  written, no recorded file has gone, and every script the app loads is in the record — that
  last one so the guard has no hole to slip through.

Proven both ways before shipping: editing `panchang.js` with the version left alone is refused,
`--check` reports the drift, and restoring the file makes the record current again.

### Also

- `204 assertions`.
- The record covers the landing page as well as the app, since the landing page loads the
  engine and carries its own build stamp.

## 0.2.1 — 2026-11-01

### The language selector did nothing

It did, on a clean browser. On a browser that had opened 0.1.2 the page was **frozen**: the
service worker served the new `index.html` beside the **old `panchang.js`** out of a cache named
after the previous release, `render()` threw on an API the old engine does not have, and the
first thing a reader tried — changing the language — appeared to do nothing at all. The page had
died before it could respond, and said nothing about it.

Three fixes, because one is not enough:

- **Every asset is version-tagged** (`panchang.js?v=0.2.1`, and the same for the runtime, the
  data files and the manifest). A cache-first worker matches on the URL, so a release that
  changes the URL cannot be served from the old entry.
- **The worker's cache name comes from one `VERSION` constant**, alongside the precache list, so
  the two can no longer drift.
- **The page checks the engine it got.** If the cached engine is older than the page, a banner
  says which API is missing and offers a button that clears the caches, unregisters the worker
  and reloads. A new worker taking over reloads the page once per session.

### The rest of the audit

- The **landing page's build stamp** still said 0.1.2 and it loaded an untagged `panchang.js` —
  the same staleness bug, on the page that is meant to prove the app works.
- The **"Offset used" field** was editable and ignored: the offset is derived from the zone for
  the chosen date. It is now read-only and says so.
- **High contrast** had CSS but no control. There is a button, and it is remembered.
- Test counts in the README and the landing page had drifted from the suite; the badge now reads
  the suite's own output, and the prose matches it.
- `194 assertions`: nine new ones hold the version together — every script and manifest tagged
  with the release, the worker's `VERSION` matching `VERSION`, the stale-engine guard present,
  the reload path present, and both build stamps current.

## 0.2.0 — 2026-11-01

The enhancement list in `ENHANCEMENTS.md`, worked through. The app went from "which tithi is
today" to "the tithi changes at 14:52", and the almanac around it filled in.

### The five limbs now say when they turn

The biggest change, and the one that made the rest possible. The elongation and the sidereal
positions are smooth functions of time, so a boundary is a root: the angle travelled since the
last boundary divided by the mean rate puts you within minutes of it, and one bisection settles
it to a second. Every limb now carries a `start` and an `end`, and the app prints them under the
name. The muhurat finder gets better for the same reason — it can now avoid a bhadra window
rather than a whole day.

### Accuracy

- **ΔT** (Espenak–Meeus) is applied, so the series are given TT while the API takes UT.
- The moon gained its **E-factor**, the **additive planetary terms** (A1, A2) and its **latitude**
  from the largest ch. 47 terms — the latitude is what makes moonrise and moonset possible.
- **Ayanamsa** is now Lahiri advanced by general precession from its J2000 value, instead of a
  bare linear term.
- **Sunrise and sunset** take an altitude and the standard refraction; **civil twilight** comes
  with them.
- **Moonrise and moonset** by sampling the moon's altitude through GMST and bisecting the
  crossings.
- The day can be **read at sunrise** instead of noon — the traditional reckoning — as a setting,
  because traditions differ and the app should not choose silently.

### Two real bugs the work exposed

- `compute()` was handing the rise/set routines a *timezone-shifted* date, so they searched the
  wrong UTC day and sunrise landed ~18 hours out. The public `sunTimes()` was correct, which is
  why the tests never caught it; the app's own numbers were wrong. It now anchors on the UTC
  midnight of the local date.
- The eclipse test measured the distance to one node instead of the nearer one, so it missed every
  eclipse and flagged a whole week around each syzygy. It now tests both nodes at the syzygy
  instant, and only on the day the syzygy falls. It reproduces all four 2026 eclipses.

### The rest of the almanac

Gulika Kaal, Yamaganda and Abhijit; day and night **choghadiya**; the twenty-four **hora**; the
lunar month in **amanta and purnimanta** reckoning; **Vikram and Shaka Samvat** and the
samvatsara; the season and ayana; the sun's and moon's **rashi**; moon phase and illumination;
**bhadra**; an **eclipse** flag; and **festivals resolved from tithi rules** rather than a table of
dates that goes stale.

### A place, without typing coordinates

**118 cities** bundled as a data file, each with an IANA zone, so the offset comes from
`Intl.DateTimeFormat` for the chosen date and daylight saving is right. "Use my location" snaps to
the nearest bundled city, because offline reverse geocoding is not possible without a dataset this
app should not carry. Eight places can be saved.

### Data in and out

**CSV** for the month (now with the end times), **ICS** for festivals and muhurats into whatever
calendar is on the phone, **JSON** for settings and saved places, and a **print stylesheet** for a
day on paper.

### Languages: the values, not just the labels

`docs/play/data/names.js` carries the tithi, nakshatra, yoga, karana, vaara, masa, rashi, ritu,
choghadiya and hora names in Devanagari and Gujarati, so the heading and the value agree. Native
digits are an option. Samvatsara names stay in Latin in all three languages rather than being
guessed at in two scripts.

### Accessibility

Landmarks, a live region, a high-contrast theme, two larger text sizes, and a print view that
drops the controls.

### Tests: 37 → 182

Including a 1000-day sweep, polar latitudes (Tromsø in both solstices), daylight saving in Sydney
and London, a golden baseline that fails on a two-minute drift, four published eclipses, ten
festivals against their conventional 2026 dates, the choghadiya and hora weekday tables, the names
tables, the city list, a licence-agreement check, and the page's own wiring.

### Guardrails

- `scripts/offline-check.js` renders the app in Chromium with **every host unresolvable** and looks
  for the day's tithi in the DOM — the offline promise, tested end to end rather than asserted.
  It is a CI step now.
- `scripts/badges.py` runs the suite and takes the count from its output, so a badge cannot claim a
  number the tests do not print.
- `scripts/icons.py` renders every icon size from the one SVG master — 192, 512, maskable, a
  Windows `.ico`, and the Android adaptive foreground and background.

### What is still not done, and why

Three items on the list were left alone deliberately, because doing them would have meant
guessing:

- **the remaining 33 terms of Meeus ch. 47.** The reduced series is good to about 0.05°; the rest
  would take it to 0.01°. The coefficients cannot be verified here, and a fabricated table would
  be worse than a documented limit.
- **durmuhurtam.** It is a per-weekday table, and the copies in circulation disagree. Wrong ritual
  timings are worse than absent ones.
- **named Ekadashis and a longer festival list.** Both need the lunar month to be right in every
  case, and the ten festivals shipped are the ones whose rules reproduce their conventional 2026
  dates. The engine takes more rules; the table should grow only with dates someone can check.

## 0.1.2 — 2026-11-01

### The demo was empty, and nobody could see it

`astro-kit.js` was split out of `panchang.js` when the astronomy moved to the shared kit, but
the script tag was never added to the page. `panchang.js` threw on load, so the app rendered a
blank hero and no cards — the deployed demo, the EXE and the APK all shipped a broken day.
The screenshot for the new landing page is what caught it.

The obvious fix — add the tag — is refused by the estate's `kit-guard` step: *a kit is never
retrofitted into a repository*, and both pages predate the split. The guard is right, so the
fix went the other way: the astronomy core is **inline in `panchang.js`** again, the vendored
`astro-kit.js` is gone, and the page loads only the runtime it always had plus its own engine.
Nothing has to be loaded before it, the dependency count is still zero, and there is one file
that computes the day instead of two that could drift apart.

Tests now read the page and check that every script it names exists, that it retrofits no kit,
and that `panchang.js` carries no `require` and depends on no global.

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
