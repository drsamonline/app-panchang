# Panchang

<p>
  <a href="https://drsamonline.github.io/app-panchang/"><img alt="live: online" src="docs/assets/badge-live.svg"></a>
  <a href="https://github.com/drsamonline/app-panchang/actions/workflows/test.yml"><img alt="tests: 199 passing" src="docs/assets/badge-tests.svg"></a>
  <a href="https://github.com/drsamonline/app-panchang/actions/workflows/build-apps.yml"><img alt="build: green" src="docs/assets/badge-build.svg"></a>
  <a href="LICENSE"><img alt="licence: PolyForm NC 1.0.0" src="docs/assets/badge-licence.svg"></a>
  <img alt="offline: no network" src="docs/assets/badge-offline.svg">
  <img alt="deps: 0 runtime" src="docs/assets/badge-deps.svg">
</p>

**A daily Indian almanac that computes the day on your device** — and tells you the minute each
limb changes. Tithi, nakshatra, yoga, karana with their end times; sunrise, sunset, moonrise and
moonset; Rahu Kaal, Gulika, Yamaganda and Abhijit; day and night choghadiya; the twenty-four hora;
the lunar month in both reckonings, Vikram and Shaka Samvat; the moon's sign and phase; an eclipse
flag; festivals resolved from tithi rules; a muhurat finder. No network, no account, no telemetry.

**[Open the app →](https://drsamonline.github.io/app-panchang/play/)** · [Landing page](https://drsamonline.github.io/app-panchang/) · [Method](#how-the-panchang-is-computed) · [Releases](https://github.com/drsamonline/app-panchang/releases)

<!-- shot:start -->

![Screenshot](docs/shot.png)

<!-- shot:end -->

The landing page is not a picture of the app — it embeds the real `docs/play/` in a frame and
drives it to a day worth seeing. The app is two scripts and three data files, all in this
repository: a shared runtime (`web-kit.js`), the engine (`panchang.js`, self-contained), and the
bundled names, cities and festival rules. No build step, no bundler, no package install, no server.

## What it does

Pick a date and a place — search a city, tap **Use my location**, or type coordinates. The app
computes the day and shows, for each limb, **when it began and when it ends**:

```
Tithi       Krishna Amavasya   11:27 → 12:31
Nakshatra   Swati  pada 1      05:51 → 07:23
Yoga        Ayushman           03:25 → 03:01
Karana      Chatushpada        11:27 → 23:56
Rahu Kaal   (Sunday)           16:37 → 18:02
```

Every day is addressable, so a panchang can be linked or shared:
`docs/play/index.html#d=2026-11-08&lat=19.0760&lng=72.8777&zone=Asia/Kolkata&lang=gu`.

| | |
|---|---|
| headless assertions, `node test-node.js` | **199 passing, 0 failed** |
| runtime dependencies | **0** — two in-repo scripts and three data files |
| sun–moon elongation vs an independent ephemeris | **better than 0.05°** |
| limb boundary accuracy | **a minute or two**, stated rather than hidden |
| cities bundled, with real time zones | **118** |
| languages | **3** — English, हिन्दी, ગુજરાતી, values translated too |
| engine | `panchang.js` 0.4.0 |

## What it must not do, and does not

- **No account, no profile, no sync.** There is nothing to sign into.
- **No network at runtime.** A test scans every shipped file for a script, link or fetch pointed at
  another origin; a second test renders the app in Chromium with every host unresolvable.
- **No telemetry, analytics or error reporting.** Nothing leaves the device.
- **No external font, icon or badge service.** Type is the system face; badges and every icon size
  are generated in this repository.
- **No geocoder.** The city list is a data file. Reverse geocoding offline is not possible without
  a dataset this app should not carry, so "use my location" snaps to the nearest bundled city.
- **No silently stale page.** Every asset is version-tagged and the service worker's
  cache is named after the release, so a new page cannot pair with an old engine; if it
  somehow does, the page says so and offers a reload instead of sitting there frozen.
- **No silent precision.** Lunar longitude from a reduced series puts a tithi or nakshatra boundary
  within a minute or two of time, and local tradition differs on ayanamsa and on where a day
  begins. The day can be read at noon (default), sunrise, or midnight — the app says which.

## How the panchang is computed

Entirely on-device, from first principles:

- apparent **solar and lunar longitudes** from Meeus, *Astronomical Algorithms* (ch. 25 and 47) —
  the moon with its E-factor, the additive planetary terms (A1, A2) and its latitude from the
  largest ch. 47 terms; **ΔT** by the Espenak–Meeus polynomial, so the series are given TT while
  the API takes UT;
- **tithi** and **karana** from the moon–sun elongation, **nakshatra** and **yoga** from the
  sidereal positions after a **Lahiri ayanamsa** (linear precession from its J2000 value);
- **limb boundaries** by bisection on those angles — which is what turns "which tithi is today"
  into "the tithi changes at 14:52";
- **sunrise and sunset** from the standard sunrise equation with altitude and refraction, plus
  civil twilight; **moonrise and moonset** by sampling the moon's altitude and bisecting the
  crossings, using GMST and the moon's own latitude;
- **Rahu Kaal, Gulika, Yamaganda, Abhijit** as segments of the real sunrise-to-sunset day, and
  **choghadiya** and **hora** from the weekday tables;
- **the lunar month** amanta and purnimanta, named from the solar sign at the new moon that begins
  it, and the **samvat** years from the Gregorian date;
- **eclipses** from the distance of the moon to the nearer node at the syzygy — "possible", never
  "visible here", which would need a horizon model this app does not claim;
- **festivals** from `{masa, paksha, tithi, at}` rules in `docs/play/data/festivals.js`, not from a
  table of dates that goes stale.

`test-node.js` checks six elongations against an independent ephemeris, the March equinox, Mumbai's
sunrise and sunset, Holi and Diwali, the karana table, a 1000-day sweep, polar latitudes, daylight
saving in Sydney and London, four published eclipses, ten festivals against their conventional
dates, the choghadiya and hora tables, the names tables, the cities, the page's own wiring, and an
offline guard. `scripts/offline-check.js` then renders the page in Chromium with every host
unresolvable and looks for the day's tithi in the DOM.

## Run it

```bash
open docs/play/index.html      # the whole app, no install
node test-node.js              # 199 passed, 0 failed
node scripts/offline-check.js  # renders with no network (skips if no browser)
```

## Download it

Every push builds the binaries from the same commit as the demo and attaches them to the rolling
`app-latest` release; tagged releases carry the same assets with the changelog. The icon is
[here](docs/play/icon-512.png) — `scripts/icons.py` renders every size from `docs/play/icon.svg`,
including a Windows `.ico` and the Android adaptive layers, so no hand-made PNG can drift.

| | | |
|---|---|---|
| <img src="docs/play/icon-192.png" width="28" alt=""> | **Windows** | `panchang-portable.exe` — no installer, no registry writes |
| <img src="docs/play/icon-192.png" width="28" alt=""> | **Android** | `panchang.apk` — signed, sideload; no store |
| <img src="docs/play/icon-192.png" width="28" alt=""> | **Linux** | `panchang-linux` — `chmod +x` and run |

## Layout

```
docs/index.html              the landing page — night sky, gold, its own design
docs/play/index.html         the app
docs/play/panchang.js        the engine: astronomy, limbs, windows, months, eclipses
docs/play/web-kit.js         the shared runtime: storage, i18n, CSV, theme, a11y
docs/play/data/names.js      tithi, nakshatra, yoga, karana, masa, rashi in three scripts
docs/play/data/cities.js     118 places, each with an IANA zone
docs/play/data/festivals.js  observances as tithi rules, not dates
docs/play/sw.js              offline shell — HTML network-first, assets cache-first
docs/assets/                 screenshots and generated badges
scripts/badges.py            draws the badges, reading the count from the suite
scripts/icons.py             renders every icon size from the SVG master
scripts/shot.py              screenshots the landing page and the app
scripts/offline-check.js     renders the app with no network, in a real browser
ENHANCEMENTS.md              what is worth doing next, and what it would cost
```

## Licence

PolyForm Noncommercial 1.0.0 — see `LICENSE`. © 2026 Dr Sohil Momin. Part of the Forge system:
apps open, orchestrator licensed.
