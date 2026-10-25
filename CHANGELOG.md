# Changelog

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
