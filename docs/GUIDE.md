# Panchang — user guide

**Version 0.2.3 · PolyForm Noncommercial 1.0.0 · 204 headless assertions, 0 runtime dependencies**

Pick a date and a place — search a city, tap **Use my location**, or type coordinates. The app
computes the day and shows, for each limb, **when it began and when it ends**:

```
Tithi       Krishna Amavasya   11:27 → 12:31
Nakshatra   Swati  pada 1      05:51 → 07:23
Yoga        Ayushman           03:25 → 03:01
Karana      Chatushpada        11:27 → 23:56
Rahu Kaal   (Sunday)           16:37 → 18:02
```

## Linking to a day

Every day is addressable, so a panchang can be shared as a link:

```
#d=2026-11-08&lat=19.0760&lng=72.8777&zone=Asia/Kolkata&lang=gu
```

## Where the numbers come from, and how precise they are

Lunar longitude comes from a reduced series, which puts a tithi or nakshatra boundary **within a
minute or two**. Local tradition also differs on ayanamsa and on where a day begins — so the day can
be read at **noon (the default), sunrise, or midnight**, and the app says which it is using. Silent
precision would be the dishonest option here.

## What it must not do, and does not

- **No account, no profile, no sync.** There is nothing to sign into.
- **No network at runtime.** One test scans every shipped file for a script, link or fetch pointed at
  another origin; a second renders the app in Chromium with every host unresolvable.
- **No telemetry, analytics or error reporting.**
- **No external font, icon or badge service** — type is the system face, and every icon size is
  generated in the repository.
- **No geocoder.** The city list is a data file, and reverse geocoding offline would need a dataset
  this app should not carry — so "use my location" snaps to the nearest bundled city, and says so.
- **No silently stale page.** Every asset is version-tagged and the service worker's cache is named
  after the release, so a new page cannot pair with an old engine. If it somehow does, the page says
  so and offers a reload rather than sitting there frozen.

## Running it

Open the page, or run the assertions yourself with `node test-node.js`.

## Licence

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).
