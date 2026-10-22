# Panchang

[![live](https://img.shields.io/badge/live-online-22c55e)](https://drsamonline.github.io/app-panchang/)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**A daily Indian almanac that runs entirely offline.** Tithi, nakshatra, yoga,
karana, paksha, vaara, sunrise, sunset, rahu-kaal, and a muhurat finder — computed
on your device from the date and your location. No accounts, no network, no
telemetry.

Built with **Forge** on the shared **web-kit** (storage, i18n, CSV, theme, a11y).

## What it does

Pick a date and a place (or tap **Use my location**). The app computes the day's
panchang: the tithi and its paksha, the nakshatra, yoga and karana, the sunrise
and sunset, and the Rahu Kaal window. It flags the day's observances (Purnima,
Amavasya, Ekadashi, Pradosh, Sankranti) and can list the next auspicious muhurat
windows. The whole month exports to CSV.

## Run it

Open `docs/play/index.html` in a browser. That's the whole app — the engine
(`docs/play/panchang.js`) and the shared runtime (`docs/play/web-kit.js`) sit
next to it, so it works from `file://` and from GitHub Pages.

```
node test-node.js      # 24 passed, 0 failed
```

## How the panchang is computed

Entirely on-device, from first principles:

- the apparent **solar and lunar ecliptic longitudes** use the low-precision
  method from Meeus, *Astronomical Algorithms* (ch. 25 & 47);
- **tithi** and **karana** come from the moon–sun elongation; **nakshatra** and
  **yoga** use a **Lahiri ayanamsa** (linear approximation);
- **sunrise / sunset** use the standard sunrise equation; **rahu-kaal** is the
  weekday's segment of the real sunrise-to-sunset day (so it is more accurate
  than the fixed 6-to-6 tables).

The engine is cross-checked against an independent ephemeris in `test-node.js`:
elongations agree to better than 0.05°, and sunrise/sunset to within a few
minutes. This is a **first pass** — accurate to a few minutes near a
tithi/nakshatra boundary. For ritual-critical use, verify against a printed
panchang for your city.

## Build the EXE and APK

This repo calls the shared build workflow. On every push, GitHub Actions builds a
portable Windows EXE and a signed Android APK from `docs/play` and attaches them
to the `app-latest` release.

## Licence

MIT. (c) 2026 Dr Sohil Momin. Part of the Forge system — apps open, orchestrator licensed.
