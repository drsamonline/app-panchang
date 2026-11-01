# Panchang

<p>
  <a href="https://drsamonline.github.io/app-panchang/"><img alt="live: online" src="docs/assets/badge-live.svg"></a>
  <a href="https://github.com/drsamonline/app-panchang/actions/workflows/test.yml"><img alt="tests: 37 passing" src="docs/assets/badge-tests.svg"></a>
  <a href="https://github.com/drsamonline/app-panchang/actions/workflows/build-apps.yml"><img alt="build: green" src="docs/assets/badge-build.svg"></a>
  <a href="LICENSE"><img alt="licence: PolyForm NC 1.0.0" src="docs/assets/badge-licence.svg"></a>
  <img alt="offline: no network" src="docs/assets/badge-offline.svg">
  <img alt="deps: 0 runtime" src="docs/assets/badge-deps.svg">
</p>

**A daily Indian almanac that computes the day on your device.** Tithi, nakshatra, yoga,
karana, vaara, sunrise, sunset, rahu-kaal and a muhurat finder — from the date and your
place, with no network at any point.

**[Open the app →](https://drsamonline.github.io/app-panchang/play/)** · [Landing page](https://drsamonline.github.io/app-panchang/) · [Method](#how-the-panchang-is-computed) · [Releases](https://github.com/drsamonline/app-panchang/releases)

<!-- shot:start -->

![Screenshot](docs/shot.png)

<!-- shot:end -->

The landing page is not a picture of the app — it embeds the real `docs/play/` in a
frame and drives it to a day worth seeing. The almanac is two scripts, both in this
repository: a shared runtime (`web-kit.js`) and the engine (`panchang.js`), which carries the
astronomy and the app's own layer in one self-contained file. No build step, no bundler, no
package install, no server.

## What it does

Pick a date and a place, or tap **Use my location**. The app computes the five limbs of
the day, the two sun times, the Rahu Kaal window and the day's observances, and can list
the next auspicious muhurats or export the whole month as CSV. Every day is addressable,
so a panchang can be linked or shared:

```
docs/play/index.html#d=2026-11-08&lat=19.0760&lng=72.8777&tz=5.5&lang=gu
```

| | |
|---|---|
| headless assertions, `node test-node.js` | **37 passing, 0 failed** |
| runtime dependencies | **0** — two in-repo scripts |
| sun–moon elongation vs an independent ephemeris | **better than 0.05°** |
| languages | **3** — English, हिन्दी, ગુજરાતી |
| engine | `panchang.js` 0.3.0 — astronomy and almanac inline |

## What it must not do, and does not

- **No account, no profile, no sync.** There is nothing to sign into.
- **No network at runtime.** A test scans every shipped file for a script, link or fetch
  pointed at another origin and fails the build if one appears.
- **No telemetry, analytics or error reporting.** Nothing leaves the device.
- **No external font, icon or badge service.** Type is the system face; the badges are
  drawn by `scripts/badges.py` and committed.
- **No silent precision.** Lunar longitude from a reduced series puts a tithi or nakshatra
  boundary within a few minutes of time, and local tradition differs on ayanamsa and on
  where a day begins. Use it to plan, not to settle a dispute.

## How the panchang is computed

Entirely on-device, from first principles:

- apparent **solar and lunar ecliptic longitudes** by the low-precision method in Meeus,
  *Astronomical Algorithms* (ch. 25 and 47);
- **tithi** and **karana** from the moon–sun elongation; **nakshatra** and **yoga** from
  the sidereal positions after a **Lahiri ayanamsa**;
- **sunrise and sunset** from the standard sunrise equation; **rahu-kaal** as the
  weekday's eighth of the real sunrise-to-sunset day, which is more accurate than the
  fixed 6-to-6 tables;
- **observances** (Purnima, Amavasya, Ekadashi, Pradosh, Sankranti) and a sixty-day
  **muhurat** scan, both from the computed limbs.

`test-node.js` checks six elongations, the March equinox, Mumbai's sunrise and sunset,
Holi and Diwali, the karana table's wrap-around, the muhurat finder, the page's own script
wiring and the offline guard.

## Run it

```bash
open docs/play/index.html      # the whole app, no install
node test-node.js              # 37 passed, 0 failed
```

## Download it

Every push builds the binaries from the same commit as the demo and attaches them to the
rolling `app-latest` release; tagged releases carry the same assets with the changelog.
The app icon is [here](docs/play/icon-512.png) and ships inside both builds.

| | | |
|---|---|---|
| <img src="docs/play/icon-192.png" width="28" alt=""> | **Windows** | `panchang-portable.exe` — no installer, no registry writes |
| <img src="docs/play/icon-192.png" width="28" alt=""> | **Android** | `panchang.apk` — signed, sideload; no store |
| <img src="docs/play/icon-192.png" width="28" alt=""> | **Linux** | `panchang-linux` — `chmod +x` and run |

## Layout

```
docs/index.html              the landing page — night sky, gold, its own design
docs/play/index.html         the app
docs/play/panchang.js        the engine: astronomy core + vaara, rahu-kaal, observances, muhurat
docs/play/web-kit.js         the shared runtime: storage, i18n, CSV, theme, a11y
docs/play/sw.js              offline shell — HTML network-first, assets cache-first
docs/play/manifest.webmanifest
docs/assets/                 screenshots and generated badges
scripts/badges.py            draws the badges locally
scripts/shot.py              screenshots the landing page and the app
ENHANCEMENTS.md              what is worth doing next, and what it would cost
```

## Licence

PolyForm Noncommercial 1.0.0 — see `LICENSE`. © 2026 Dr Sohil Momin. Part of the Forge
system: apps open, orchestrator licensed.
