# Enhancements

What is worth doing next, ordered by what it buys the reader. Everything here is achievable
**offline, with no internet and no external dependency** — no API, no CDN, no webfont, no package
that fetches anything at runtime.

The list from 0.1.2 has been worked through; what is left is below, and section 0 says what
happened to the rest.

Effort: **S** under an hour · **M** an afternoon · **L** a day or more.

---

## 0. What 0.2.0 did

- **Limb end times** by bisection on the elongation — tithi, nakshatra, yoga and karana each now
  carry a start and an end. This was the single biggest change.
- **Accuracy**: ΔT, the moon's E-factor, additive planetary terms and latitude, a Lahiri ayanamsa
  advanced by general precession, sunrise with altitude and refraction, civil twilight, moonrise
  and moonset, and a sunrise-based reading of the day as a setting.
- **The rest of the almanac**: Gulika, Yamaganda, Abhijit, day and night choghadiya, the
  twenty-four hora, amanta and purnimanta months, Vikram and Shaka Samvat, samvatsara, ritu, ayana,
  sun and moon rashi, moon phase, bhadra, an eclipse flag, and festivals from tithi rules.
- **Places**: 118 cities with IANA zones, real offsets through `Intl` so daylight saving is right,
  nearest-city snapping, eight saved places.
- **Out**: CSV with end times, ICS for festivals and muhurats, JSON settings, a print stylesheet.
- **Languages**: the *values* translated, not just the headings — tithi, nakshatra, yoga, karana,
  vaara, masa, rashi, ritu, choghadiya and hora in Devanagari and Gujarati, plus native digits.
- **Accessibility**: landmarks, a live region, high contrast, two larger text sizes.
- **Guardrails**: an offline render check in a real browser, badges that read the count from the
  suite, one icon master rendering every size including `.ico` and the adaptive layers, and a
  licence-agreement test.

## 1. Deliberately not done

These were on the 0.1.2 list and are still open, because doing them here would have meant guessing:

**1.1 The remaining 33 terms of Meeus ch. 47. (M)**
The reduced 27-term series is good to about 0.05°; the full table takes it to about 0.01°. The
coefficients cannot be verified from this repository, and a fabricated table is worse than a
documented limit. Do it with the book open, and add the six reference elongations as the test that
proves the improvement.

**1.2 Durmuhurtam. (S)**
A per-weekday table of two inauspicious muhurtas. The copies in circulation disagree, and wrong
ritual timings are worse than absent ones. Ship it when there is a source to cite.

**1.3 Named Ekadashis, and a longer festival list. (M)**
Both need the lunar month to be right in every case, including adhika masa. The ten festivals
shipped are the ones whose rules reproduce their conventional 2026 dates; the engine takes any
number of rules, so the table should grow only with dates someone can check.

---

## 2. Accuracy, next

**2.1 Adhika masa. (M)**
A lunar month with no solar ingress is adhika (intercalary), and the naming shifts for the whole
year around it. The current `lunarMonth` does not detect it. This matters for festival dates more
than for the daily limbs, and it is the main thing standing between the festival table and a
hundred entries.

**2.2 True ayanamsa per tradition. (S)**
Lahiri is the default because it is the most used. Raman and KP are a constant offset away; a
setting would let the app match whichever panchang a reader keeps.

**2.3 Nutation and aberration, done properly. (M)**
Nutation in longitude is currently a single term. The full series (Meeus ch. 22) is a table of 63
terms; the gain is small for a panchang but it is the last piece of the "apparent" claim.

**2.4 Eclipse magnitude and local circumstances. (L)**
Currently "possible" or "likely". Saying "visible here, 60% covered at 17:04" needs the topocentric
geometry and a horizon model — real work, and the place where being approximately right is most
likely to mislead.

---

## 3. The almanac, next

**3.1 Durmuhurtam, Varjyam and the other windows. (S each)**
Once there is a citable table, these are the same arithmetic as Gulika.

**3.2 Tithi-based observances with names. (M)**
Pradosha, Sankashti Chaturthi, the named Purnimas, the named Ekadashis — all keyed to masa and
tithi, which now exist.

**3.3 A personal panchang. (S)**
"Show me the next good window for travel" — filter the muhurat finder by what the reader is
actually asking, and print the answer at the top instead of in a list.

---

## 4. Places and data

**4.1 Import a city list. (S)**
The JSON import already carries settings and places; let it carry a whole list, so someone in a
town that is not in the 118 can add their own coordinates once and keep them.

**4.2 Village-level coordinates. (M)**
118 cities is a start, not a country. A bundled list of a few thousand towns would be a bigger
data file — a few hundred kilobytes — and still no service.

**4.3 A computed-year cache. (S)**
A year of panchang is 365 × a few hundred floating-point operations, plus four bisections per day.
Precompute it into IndexedDB once and month navigation is instant on a cheap phone.

---

## 5. Languages and accessibility

**5.1 Samvatsara names in Devanagari and Gujarati. (S)**
They are Latin in all three languages now, which is honest but uneven. Sixty names, checked once.

**5.2 A table view for screen readers. (S)**
The cards are readable but ungrouped. A single table of the day, with a caption, would be better
than eighteen cards for anyone using a reader.

**5.3 Marathi, Tamil and Bengali. (M)**
The names tables are the whole job — the UI strings are a page. Marathi is nearly free, since the
Sanskrit terms are close to Hindi.

---

## 6. Releases with icons

The icon work is done: one SVG master, every size rendered from it, the `.ico` and the adaptive
layers included, the icon attached to the release and shown at the top of its notes, and a
`SHA256SUMS` file per release.

**6.1 Confirm the binaries carry it. (S)**
The EXE and the APK are built by the shared `app-builder` kit. Check that the Windows resource
icon and the APK's `mipmap` come from `docs/play/icon.ico` and `icon-adaptive-*` rather than a
placeholder; if they do not, the fix belongs in `app-builder` so every app gets it at once.

**6.2 A release body per tag, generated. (S)**
The 0.2.0 notes were written by hand from the changelog. A script that lifts the changelog section
for the tag, adds the asset table and the checksums, and posts it would keep the two in step.

---

## 7. Guardrails that keep the promise

Done: the offline scan, the offline render check, badges that read the suite, the licence check.

**7.1 A performance budget. (S)**
A test that computes a month and fails if it takes longer than, say, 200 ms on CI. It is the kind
of thing that degrades quietly as features land.

**7.2 A claim check on the landing page. (S)**
The page states "182 assertions" and "0 dependencies" in prose. A test could read those numbers out
of the page and compare them with the suite and the file tree, so the page cannot drift.

---

## 8. Not doing, on purpose

- **Any network call, ever** — no ephemeris API, no geocoding service, no update check.
- **Accounts, sync or cloud backup.** A panchang for a place is derivable; there is nothing worth
  holding on a server.
- **Webfonts.** The type is the system face, which is also why the page renders the same on a
  village phone as on a workstation.
- **Analytics of any kind.** Not even a hit counter.
- **Ads or sponsorship.** The licence is noncommercial and the app has no inventory.
- **A claim of exactness.** The accuracy note stays in the app, the README and the page.
