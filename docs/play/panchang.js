/* panchang.js — the engine of the Panchang app.
 *
 * Self-contained: the astronomy (sun and moon longitude and latitude, ΔT,
 * ayanamsa, sidereal time, rise/set/transit, and the derived tithi / nakshatra /
 * yoga / karana) is inline below, followed by the almanac built on it — vaara,
 * the eight-part windows (Rahu, Gulika, Yamaganda), abhijit, choghadiya, hora,
 * the lunar month and the samvat years, the moon's sign and phase, eclipse
 * likelihood, the day's observances, and the muhurat finder.
 *
 * Nothing has to be loaded before this file: no kit, no data file, no network.
 *
 * ACCURACY, honestly. Apparent longitudes follow Meeus, *Astronomical
 * Algorithms* 2nd ed.: the sun (ch. 25), the moon's longitude from a 27-term
 * reduction of the ch. 47 series with the E-factor and the additive planetary
 * terms (A1, A2), and the moon's latitude from the largest ch. 47 terms. ΔT is
 * the Espenak–Meeus polynomial, so the argument is TT while the API takes UT.
 * Ayanamsa is Lahiri (Chitrapaksha), linear precession from its J2000 value.
 * Expect a limb boundary within a minute or two of a printed panchang; local
 * tradition differs on ayanamsa and on where the day begins, and this file
 * exposes the second as a setting rather than choosing for you.
 *
 * Part of the Forge system. PolyForm Noncommercial 1.0.0. (c) 2026 Dr Sohil Momin.
 * Works in the browser (window.Panchang) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Panchang = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function sin(d) { return Math.sin(d * D2R); }
  function cos(d) { return Math.cos(d * D2R); }
  function asin(x) { return Math.asin(Math.max(-1, Math.min(1, x))) * R2D; }
  function acos(x) { return Math.acos(Math.max(-1, Math.min(1, x))) * R2D; }
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function frac(x) { return x - Math.floor(x); }
  function sign(x) { return x < 0 ? -1 : 1; }

  /* ================= time ================= */

  /* Julian Day from a JS Date (read as UTC) or {y,m,d,h}. */
  function jd(when) {
    var y, m, d, h;
    if (when instanceof Date) {
      y = when.getUTCFullYear(); m = when.getUTCMonth() + 1; d = when.getUTCDate();
      h = when.getUTCHours() + when.getUTCMinutes() / 60 + when.getUTCSeconds() / 3600;
    } else { y = when.y; m = when.m; d = when.d; h = when.h || 0; }
    var yy = y, mm = m;
    if (mm <= 2) { yy -= 1; mm += 12; }
    var a = Math.floor(yy / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + b - 1524.5 + h / 24;
  }
  function fromJd(v) { return new Date((v - 2440587.5) * 86400000); }
  function toJd(date) { return date.getTime() / 86400000 + 2440587.5; }

  /* ΔT = TT − UT, in seconds (Espenak & Meeus). */
  function deltaT(jdv) {
    var y = 2000 + (jdv - 2451544.5) / 365.2425, t;
    if (y >= 2005 && y < 2050) { t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
    if (y >= 2050) { t = (y - 1820) / 100; return -20 + 32 * t * t - 0.5628 * (2150 - y); }
    if (y >= 1986) { t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t; }
    if (y >= 1961) { t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718; }
    t = y - 1950;
    return 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547;
  }
  /* the argument the series want: TT, from a UT Julian Day */
  function tt(jdv) { return jdv + deltaT(jdv) / 86400; }

  /* Greenwich mean sidereal time in degrees. */
  function gmst(jdv) {
    var T = (jdv - 2451545.0) / 36525;
    return norm360(280.46061837 + 360.98564736629 * (jdv - 2451545.0) +
      0.000387933 * T * T - T * T * T / 38710000);
  }
  function obliquity(jdv) {
    var T = (jdv - 2451545.0) / 36525;
    return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
  }

  /* ================= the sun ================= */

  function sunLongitude(jdUT) {
    var jde = tt(jdUT);
    var T = (jde - 2451545.0) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
          + (0.019993 - 0.000101 * T) * sin(2 * M)
          + 0.000289 * sin(3 * M);
    var omega = 125.04 - 1934.136 * T;
    return norm360(L0 + C - 0.00569 - 0.00478 * sin(omega));   // apparent
  }
  /* the sun's declination, for rise and set */
  function sunDeclination(jdUT) {
    var jde = tt(jdUT);
    var T = (jde - 2451545.0) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
          + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
    var omega = 125.04 - 1934.136 * T;
    var lambda = L0 + C - 0.00569 - 0.00478 * sin(omega);
    return asin(sin(lambda) * sin(obliquity(jde)));
  }

  /* ================= the moon =================
   * Meeus ch. 47, reduced: the 27 largest longitude terms, the E-factor on the
   * terms in the sun's mean anomaly, the additive planetary terms, and the
   * largest latitude terms. The remaining small terms are below 0.002° each.
   */
  var MOON_LON = [
    [6288774, 0, 0, 1, 0], [1274027, 2, 0, -1, 0], [658314, 2, 0, 0, 0], [213618, 0, 0, 2, 0],
    [-185116, 0, 1, 0, 0], [-114332, 0, 0, 0, 2], [58793, 2, 0, -2, 0], [57066, 2, -1, -1, 0],
    [53322, 2, 0, 1, 0], [45758, 2, -1, 0, 0], [-40923, 0, 1, -1, 0], [-34720, 1, 0, 0, 0],
    [-30383, 0, 1, 1, 0], [15327, 2, 0, 0, -2], [-12528, 0, 0, 1, 2], [10980, 0, 0, 1, -2],
    [10675, 4, 0, -1, 0], [10034, 0, 0, 3, 0], [8548, 4, 0, -2, 0], [-7888, 2, 1, -1, 0],
    [-6766, 2, 1, 0, 0], [-5163, 1, 0, -1, 0], [4987, 1, 1, 0, 0], [4036, 2, -1, 1, 0],
    [3994, 2, 0, 2, 0], [3861, 4, 0, 0, 0], [3665, 2, 0, -3, 0]
  ];
  var MOON_LAT = [
    [5128122, 0, 0, 0, 1], [280602, 0, 0, 1, 1], [277693, 0, 0, 1, -1], [173237, 2, 0, 0, -1],
    [55413, 2, 0, -1, 1], [46271, 2, 0, -1, -1], [32573, 2, 0, 0, 1], [17198, 0, 0, 2, 1],
    [9266, 2, 0, 1, -1], [8822, 0, 0, 2, -1], [8216, 2, -1, 0, -1], [4324, 2, 0, -2, -1],
    [4200, 2, 0, 1, 1]
  ];
  function moonArgs(jdUT) {
    var jde = tt(jdUT);
    var T = (jde - 2451545.0) / 36525;
    return {
      T: T,
      Lp: 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000,
      D: 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000,
      M: 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000,
      Mp: 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000,
      F: 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000
    };
  }
  function moonLongitude(jdUT) {
    var a = moonArgs(jdUT), T = a.T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var sum = 0, i, t, arg, e;
    for (i = 0; i < MOON_LON.length; i++) {
      t = MOON_LON[i];
      arg = t[1] * a.D + t[2] * a.M + t[3] * a.Mp + t[4] * a.F;
      e = Math.abs(t[2]) === 1 ? E : (Math.abs(t[2]) === 2 ? E * E : 1);
      sum += t[0] * e * sin(arg);
    }
    var A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T;
    sum += 3958 * sin(A1) + 1962 * sin(a.Lp - a.F) + 318 * sin(A2);   // additive terms
    var jde = tt(jdUT);
    var nut = -0.004778 * sin(125.04 - 1934.136 * T);                  // nutation in longitude
    return norm360(a.Lp + sum / 1000000 + nut);
  }
  function moonLatitude(jdUT) {
    var a = moonArgs(jdUT), T = a.T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var sum = 0, i, t, e;
    for (i = 0; i < MOON_LAT.length; i++) {
      t = MOON_LAT[i];
      e = Math.abs(t[2]) === 1 ? E : (Math.abs(t[2]) === 2 ? E * E : 1);
      sum += t[0] * e * sin(t[1] * a.D + t[2] * a.M + t[3] * a.Mp + t[4] * a.F);
    }
    sum += -2235 * sin(a.Lp) + 382 * sin(119.75 + 131.849 * T) + 175 * sin(53.09 + 479264.290 * T);
    return sum / 1000000;
  }
  function elongation(jdUT) { return norm360(moonLongitude(jdUT) - sunLongitude(jdUT)); }

  /* ================= ayanamsa (Lahiri) =================
   * Lahiri (Chitrapaksha) at J2000 is 23°51'11.5" = 23.85319°, advanced by the
   * general precession in longitude: 5028.796"/century with a small t² term.
   */
  function ayanamsa(jdUT) {
    var T = (tt(jdUT) - 2451545.0) / 36525;
    return 23.853194 + (5028.796195 / 3600) * T + (1.1054348 / 3600) * T * T;
  }
  function siderealSun(jdUT) { return norm360(sunLongitude(jdUT) - ayanamsa(jdUT)); }
  function siderealMoon(jdUT) { return norm360(moonLongitude(jdUT) - ayanamsa(jdUT)); }

  /* ================= the real UTC offset for a zone =================
   * Intl carries the world's time zones, so the offset for a given instant is
   * available without shipping a table and without a network. This is what
   * makes daylight saving correct instead of a fixed +5:30.
   */
  function zoneOffset(zone, when) {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset", hour12: false })
        .formatToParts(when || new Date());
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].type === "timeZoneName") {
          var m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(parts[i].value);
          if (!m) return 0;
          var h = parseInt(m[2], 10) + parseInt(m[3] || "0", 10) / 60;
          return m[1] === "-" ? -h : h;
        }
      }
    } catch (e) { /* an unknown zone id */ }
    return null;
  }

  /* ================= equatorial helpers ================= */
  function toEquatorial(lambda, beta, jdv) {
    var eps = obliquity(tt(jdv));
    var sl = sin(lambda), cl = cos(lambda), sb = sin(beta), cb = cos(beta), se = sin(eps), ce = cos(eps);
    var ra = Math.atan2(sl * ce * cb - sb * se, cl * cb) * R2D;
    var dec = asin(sb * ce + cb * se * sl);
    return { ra: norm360(ra), dec: dec };
  }
  /* altitude of a body, degrees */
  function altitude(ra, dec, jdv, lat, lon) {
    var H = norm360(gmst(jdv) + lon - ra);
    return asin(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(H));
  }

  /* ================= rise / set ================= */

  /* The sun, by the standard sunrise equation, with altitude and refraction. */
  function sunRiseSet(dateUTC, lat, lon, opts) {
    opts = opts || {};
    var alt = opts.altitude || 0;                       // metres above the horizon
    var h0 = (opts.h0 == null ? -0.833 - 0.0347 * Math.sqrt(Math.max(0, alt)) : opts.h0);
    var Jdate = jd(dateUTC);
    var jd0 = Math.floor(Jdate + 0.5) - 0.5;
    var n = Math.ceil(Jdate - 2451545.0 + 0.0008);
    var Jstar = n - lon / 360;
    var M = norm360(357.5291 + 0.98560028 * Jstar);
    var C = 1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M);
    var lambda = norm360(M + C + 180 + 102.9372);
    var Jtransit = 2451545.0 + Jstar + 0.0053 * sin(M) - 0.0069 * sin(2 * lambda);
    var delta = asin(sin(lambda) * sin(23.44));
    var cosOmega = (sin(h0) - sin(lat) * sin(delta)) / (cos(lat) * cos(delta));
    if (cosOmega > 1) return { polar: "night", transitUTC: (Jtransit - jd0) * 24 };
    if (cosOmega < -1) return { polar: "day", transitUTC: (Jtransit - jd0) * 24 };
    var omega = acos(cosOmega);
    /* twilight: the same equation at a deeper horizon */
    function at(hh) {
      var c = (sin(hh) - sin(lat) * sin(delta)) / (cos(lat) * cos(delta));
      return c >= 1 || c <= -1 ? null : acos(c);
    }
    var civil = at(-6);
    return {
      transitUTC: (Jtransit - jd0) * 24,
      sunriseUTC: (Jtransit - omega / 360 - jd0) * 24,
      sunsetUTC: (Jtransit + omega / 360 - jd0) * 24,
      dawnUTC: civil == null ? null : (Jtransit - civil / 360 - jd0) * 24,
      duskUTC: civil == null ? null : (Jtransit + civil / 360 - jd0) * 24,
      dayLength: 2 * omega / 15
    };
  }

  /* The moon, by sampling its altitude and bisecting the crossings.
   * `when` is either a Date (its UTC day is searched) or a Julian Day to start
   * from, which is how the app searches its own local day. */
  function moonRiseSet(when, lat, lon) {
    var jd0 = (typeof when === "number") ? when : (Math.floor(jd(when) + 0.5) - 0.5);
    var h0 = 0.125;                                     // parallax less refraction
    function alt(jdv) {
      var eq = toEquatorial(moonLongitude(jdv), moonLatitude(jdv), jdv);
      return altitude(eq.ra, eq.dec, jdv, lat, lon) - h0;
    }
    var step = 10 / 1440, rise = null, set = null, prev = alt(jd0), cur;
    for (var i = 1; i <= 144; i++) {
      cur = alt(jd0 + i * step);
      if (prev < 0 && cur >= 0 && rise === null) rise = bisect(alt, jd0 + (i - 1) * step, jd0 + i * step);
      if (prev >= 0 && cur < 0 && set === null) set = bisect(alt, jd0 + (i - 1) * step, jd0 + i * step);
      prev = cur;
    }
    return { moonrise: rise, moonset: set };
  }

  function bisect(fn, lo, hi) {
    var flo = fn(lo);
    for (var i = 0; i < 40; i++) {
      var mid = (lo + hi) / 2, fmid = fn(mid);
      if (fmid === 0) return mid;
      if (sign(fmid) === sign(flo)) { lo = mid; flo = fmid; } else { hi = mid; }
      if (hi - lo < 1e-7) break;
    }
    return (lo + hi) / 2;
  }

  /* ================= the five limbs ================= */

  var TITHI = ["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami",
    "Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
    "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami",
    "Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Amavasya"];
  var NAKSHATRA = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya",
    "Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha",
    "Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta",
    "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  var YOGA = ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarman","Dhriti",
    "Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata",
    "Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
  var KARANA_MOVABLE = ["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti"];
  var KARANA_FIXED = ["Kimstughna", "Shakuni", "Chatushpada", "Naga"];

  function karanaName(k) {
    if (k === 0) return KARANA_FIXED[0];
    if (k >= 57) return KARANA_FIXED[k - 56];
    return KARANA_MOVABLE[(k - 1) % 7];
  }

  function tithiAt(jdUT) {
    var e = elongation(jdUT), idx = Math.floor(e / 12);
    return { index: idx, number: (idx % 15) + 1, name: TITHI[idx],
      paksha: idx < 15 ? "Shukla" : "Krishna", elongation: e };
  }
  function nakshatraAt(jdUT) {
    var sid = siderealMoon(jdUT), idx = Math.floor(sid / (360 / 27));
    return { index: idx, name: NAKSHATRA[idx], pada: Math.floor(frac(sid / (360 / 27)) * 4) + 1 };
  }
  function yogaAt(jdUT) {
    var s = norm360(siderealSun(jdUT) + siderealMoon(jdUT)), idx = Math.floor(s / (360 / 27));
    return { index: idx, name: YOGA[idx] };
  }
  function karanaAt(jdUT) {
    var idx = Math.floor(elongation(jdUT) / 6);
    return { index: idx, name: karanaName(idx) };
  }

  /* ---------- when does a limb change? ----------
   * The elongation and the sidereal positions are smooth functions of time, so
   * a boundary is a root: find the sign change on a coarse grid, then bisect.
   * This is what turns "which tithi is today" into "the tithi changes at 4:31".
   */
  function angleFor(kind, jdUT) {
    if (kind === "tithi" || kind === "karana") return elongation(jdUT);
    if (kind === "nakshatra") return siderealMoon(jdUT);
    return norm360(siderealSun(jdUT) + siderealMoon(jdUT));   // yoga
  }
  function spanOf(kind) { return (kind === "tithi") ? 12 : (kind === "karana") ? 6 : 360 / 27; }

  /* the next instant at which `kind` reaches `target` degrees, after jdUT */
  function nextCrossing(kind, target, jdUT, maxDays) {
    maxDays = maxDays || 3;
    function g(t) { return norm360(angleFor(kind, t) - target + 180) - 180; }
    var step = 1 / 48, prev = g(jdUT), cur, t;
    for (var i = 1; i <= maxDays * 48; i++) {
      t = jdUT + i * step;
      cur = g(t);
      if (prev < 0 && cur >= 0) return bisect(g, jdUT + (i - 1) * step, t);
      prev = cur;
    }
    return null;
  }

  /* the window a limb occupies around an instant: {start, end} as Dates.
   * The angle travelled since the last boundary, divided by the mean rate, puts
   * us within minutes of it; one bisection then settles it to a second. */
  var RATE = { tithi: 12.1907, karana: 12.1907, nakshatra: 13.1764, yoga: 14.1621 };

  function crossNear(kind, target, est) {
    function g(t) { return norm360(angleFor(kind, t) - target + 180) - 180; }
    var lo = est - 0.45, hi = est + 0.45;
    if (g(lo) < 0 && g(hi) >= 0) return bisect(g, lo, hi);
    for (var w = 0.9; w <= 3; w += 0.9) {
      if (g(est - w) < 0 && g(est + w) >= 0) return bisect(g, est - w, est + w);
    }
    return null;
  }

  function limbWindow(kind, t0) {
    var span = spanOf(kind), rate = RATE[kind] || 12.1907;
    var a = angleFor(kind, t0);
    var idx = Math.floor(a / span);
    var startT = (idx * span) % 360, endT = ((idx + 1) * span) % 360;
    var back = norm360(a - startT), fwd = norm360(endT - a);
    var st = crossNear(kind, startT, t0 - back / rate);
    var en = crossNear(kind, endT, t0 + fwd / rate);
    return { index: idx, start: st == null ? null : fromJd(st), end: en == null ? null : fromJd(en) };
  }

  /* ================= the day's windows ================= */

  var VAARA = ["Ravivara", "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara"];
  var RAHU_PART = [8, 2, 7, 5, 6, 4, 3];        // Sun..Sat
  var YAMA_PART = [5, 4, 3, 2, 1, 7, 6];
  var GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];

  var CHOGHADIYA = ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"];
  var CHOGA_DAY_START = [0, 3, 6, 2, 5, 1, 4];   // Sun..Sat
  var CHOGA_NIGHT_START = [5, 1, 4, 0, 6, 2, 3];
  var CHOGADIYA_GOOD = { Amrit: 1, Shubh: 1, Labh: 1, Char: 1 };

  var HORA_LORDS = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"];
  var HORA_START = [0, 3, 2, 1, 5, 4, 6];        // Sun..Sat

  /* eight equal parts of a span, as Dates */
  function parts(start, end, n) {
    var out = [], a = toJd(start), b = toJd(end), w = (b - a) / n;
    for (var i = 0; i < n; i++) out.push({ start: fromJd(a + i * w), end: fromJd(a + (i + 1) * w) });
    return out;
  }
  function at(arr, i) { return arr[Math.max(0, Math.min(arr.length - 1, i))]; }

  /* ================= the lunar month, and the years ================= */

  var MASA = ["Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashwin", "Kartik", "Margashirsha", "Pausha", "Magha", "Phalguna"];
  var RASHI = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
  var RITU = ["Vasanta", "Grishma", "Varsha", "Sharad", "Hemanta", "Shishira"];
  var SAMVATSARA = ["Prabhava","Vibhava","Shukla","Pramoda","Prajapati","Angirasa","Shrimukha","Bhava",
    "Yuva","Dhata","Ishvara","Bahudhanya","Pramathi","Vikrama","Vrisha","Chitrabhanu","Svabhanu","Tarana",
    "Parthiva","Vyaya","Sarvajit","Sarvadhari","Virodhi","Vikrita","Khara","Nandana","Vijaya","Jaya",
    "Manmatha","Durmukhi","Hemalamba","Vilambi","Vikari","Sharvari","Plava","Shubhakrit","Shobhakrit",
    "Krodhi","Vishvavasu","Parabhava","Plavanga","Kilaka","Saumya","Sadharana","Virodhikrit","Paridhavi",
    "Pramadicha","Ananda","Rakshasa","Nala","Pingala","Kalayukta","Siddharthi","Raudra","Durmati",
    "Dundubhi","Rudhirodgari","Raktakshi","Krodhana","Kshaya"];

  /* The lunar month, amanta and purnimanta.
   * The amanta month runs new moon to new moon and is named for the solar sign
   * at the new moon that begins it: the sun in Meena starts Chaitra. The
   * purnimanta month (the north Indian reckoning, and the one that makes Diwali
   * "Kartik Amavasya") is the next name along during the dark half.
   */
  function lunarMonth(jdUT, paksha) {
    var e = elongation(jdUT);
    var toNew = -e / 12.1907;
    if (toNew > 0) toNew -= 29.530588;
    var nm = jdUT + toNew;
    var sunSign = Math.floor(siderealSun(nm) / 30);
    var amanta = (sunSign + 1) % 12;
    var purnimanta = paksha === "Krishna" ? (amanta + 1) % 12 : amanta;
    return {
      amanta: MASA[amanta], amantaIndex: amanta,
      name: MASA[purnimanta], index: purnimanta,
      newMoon: fromJd(nm), sunSignAtNewMoon: sunSign
    };
  }

  /* Vikram Samvat and Shaka Samvat. The Gujarati Vikram year turns at Kartik
   * (Diwali); the north Indian one at Chaitra. We give the Shaka year plainly
   * and the Vikram year as the common (Chaitra) reckoning. */
  function samvat(jdUT, date) {
    var y = date.getFullYear();
    var month = date.getMonth(), day = date.getDate();
    var afterChaitra = (month > 2) || (month === 2 && day >= 22);
    var shaka = afterChaitra ? y - 78 : y - 79;
    var vikram = shaka + 135;
    return { shaka: shaka, vikram: vikram, vikramName: SAMVATSARA[((vikram - 1) % 60 + 60) % 60] };
  }

  function rituOf(sunSign) { return RITU[Math.floor(sunSign / 2) % 6]; }
  function ayanaOf(sunSign) { return (sunSign >= 9 || sunSign <= 2) ? "Uttarayana" : "Dakshinayana"; }

  /* ================= eclipse likelihood =================
   * A new or full moon near EITHER node. The limits (18.5° and 12.2° of the
   * moon from the nearer node, with a latitude test) are the standard ones.
   * This says an eclipse is possible - never that it is visible from here,
   * which needs a horizon model this file does not claim.
   */
  function nodeLongitude(jdUT) {
    var T = (tt(jdUT) - 2451545.0) / 36525;
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
  }
  function distToNode(jdUT) {
    var d = Math.abs(norm360(moonLongitude(jdUT) - nodeLongitude(jdUT) + 180) - 180);
    return Math.min(d, 180 - d);
  }
  function eclipseAt(jdUT) {
    var e = elongation(jdUT);
    var node = distToNode(jdUT), lat = Math.abs(moonLatitude(jdUT));
    var newMoon = e < 1.5 || e > 358.5;
    var fullMoon = Math.abs(e - 180) < 1.5;
    if (newMoon) {
      if (node < 18.5 && lat < 1.6) return { kind: "solar", likely: node < 10 && lat < 1.0, at: fromJd(jdUT) };
      return null;
    }
    if (fullMoon) {
      if (node < 12.2 && lat < 1.1) return { kind: "lunar", likely: node < 6 && lat < 0.6, at: fromJd(jdUT) };
      return null;
    }
    return null;
  }
  /* The nearest new and full moon instants to an instant. The phase fraction
   * of the mean synodic month puts us within a few hours, and a bisection on
   * the elongation settles it - the estimate alone drifts out of the day. */
  function refineSyzygy(est, target) {
    function g(t) { return norm360(elongation(t) - target + 180) - 180; }
    for (var w = 0.7; w <= 2.1; w += 0.7) {
      if (g(est - w) < 0 && g(est + w) >= 0) return bisect(g, est - w, est + w);
    }
    return null;
  }
  function syzygies(jdUT) {
    var e = elongation(jdUT), syn = 29.530588;
    var newEst = jdUT - (e / 360) * syn;              // the last new moon
    var fullEst = jdUT - (norm360(e - 180) / 360) * syn;
    var tNew = refineSyzygy(newEst, 0);
    if (tNew == null) tNew = newEst;
    var tFull = refineSyzygy(fullEst, 180);
    if (tFull == null) tFull = fullEst;
    /* the next ones matter as much as the last: near the end of a phase the
       syzygy that falls today is the one still ahead */
    var nextNew = refineSyzygy(tNew + syn, 0);
    if (nextNew == null) nextNew = tNew + syn;
    var nextFull = refineSyzygy(tFull + syn, 180);
    if (nextFull == null) nextFull = tFull + syn;
    return { tNew: tNew, nextNew: nextNew, tFull: tFull, nextFull: nextFull };
  }

  /* ================= the day ================= */

  function localDate(y, mo, d) { return new Date(y, mo, d); }

  function compute(date, opts) {
    opts = opts || {};
    var lat = (opts.lat == null ? 19.0760 : opts.lat);
    var lng = (opts.lng == null ? 72.8777 : opts.lng);
    var tz = (opts.tz == null ? 5.5 : opts.tz);
    var atMode = opts.at || "noon";                  // noon | sunrise | midnight

    var y = date.getFullYear(), mo = date.getMonth(), d = date.getDate();
    /* The rise/set routines search a UTC day, so they must be given the UTC
     * midnight of the local date - not the local midnight, which is a different
     * UTC day and puts the sun on the wrong date. */
    var baseUTC = Date.UTC(y, mo, d);
    var localDayStart = baseUTC - tz * 3600000;      // the instant the local day began

    var st = sunRiseSet(new Date(baseUTC), lat, lng, opts);
    var sunrise = st.sunriseUTC == null ? null : new Date(baseUTC + st.sunriseUTC * 3600000);
    var sunset = st.sunsetUTC == null ? null : new Date(baseUTC + st.sunsetUTC * 3600000);
    var transit = st.transitUTC == null ? null : new Date(baseUTC + st.transitUTC * 3600000);

    /* the instant the limbs are read at */
    var refUTC;
    if (atMode === "sunrise" && sunrise) refUTC = toJd(sunrise);
    else if (atMode === "midnight") refUTC = toJd(new Date(localDayStart));
    else refUTC = toJd(new Date(Date.UTC(y, mo, d, 12, 0, 0) - tz * 3600000));

    var jdRef = refUTC;
    var sun = sunLongitude(jdRef), moon = moonLongitude(jdRef), ayan = ayanamsa(jdRef);
    var elong = norm360(moon - sun);
    var tithi = tithiAt(jdRef), nak = nakshatraAt(jdRef), yoga = yogaAt(jdRef), kar = karanaAt(jdRef);
    var vaaraIdx = date.getDay();

    var out = {
      date: localDate(y, mo, d), lat: lat, lng: lng, tz: tz, at: atMode,
      jd: jdRef, deltaT: deltaT(jdRef), ayanamsa: ayan, elongation: elong,
      vaara: { index: vaaraIdx, name: VAARA[vaaraIdx] },
      tithi: { index: tithi.index, number: tithi.number, name: tithi.name,
        paksha: tithi.paksha, elongation: elong },
      nakshatra: { index: nak.index, name: nak.name, pada: nak.pada },
      yoga: { index: yoga.index, name: yoga.name },
      karana: { index: kar.index, name: kar.name },
      sunrise: sunrise, sunset: sunset, transit: transit,
      polar: st.polar || null,
      dayLength: st.dayLength == null ? null : st.dayLength,
      dawn: st.dawnUTC == null ? null : new Date(baseUTC + st.dawnUTC * 3600000),
      dusk: st.duskUTC == null ? null : new Date(baseUTC + st.duskUTC * 3600000)
    };

    /* --- the eight-part windows --- */
    if (sunrise && sunset) {
      var eight = parts(sunrise, sunset, 8);
      out.rahuKaal = at(eight, RAHU_PART[vaaraIdx] - 1);
      out.gulikaKaal = at(eight, GULIKA_PART[vaaraIdx] - 1);
      out.yamaganda = at(eight, YAMA_PART[vaaraIdx] - 1);

      /* abhijit: the eighth of fifteen muhurtas of daylight */
      var muh = parts(sunrise, sunset, 15);
      out.abhijit = at(muh, 7);
      out.muhurtaLength = (toJd(sunset) - toJd(sunrise)) / 15 * 24 * 60;   // minutes

      /* choghadiya: eight of the day, eight of the night */
      var dayC = [], nightC = [], i;
      var dStart = CHOGA_DAY_START[vaaraIdx];
      for (i = 0; i < 8; i++) {
        dayC.push({ name: CHOGHADIYA[(dStart + i) % 7], good: !!CHOGADIYA_GOOD[CHOGHADIYA[(dStart + i) % 7]],
          start: eight[i].start, end: eight[i].end });
      }
      var nextRise = sunRiseSet(new Date(baseUTC + 24 * 3600000), lat, lng, opts);
      var nextSunrise = nextRise.sunriseUTC == null ? null
        : new Date(baseUTC + 24 * 3600000 + nextRise.sunriseUTC * 3600000);
      if (nextSunrise) {
        var nightEight = parts(sunset, nextSunrise, 8);
        var nStart = CHOGA_NIGHT_START[vaaraIdx];
        for (i = 0; i < 8; i++) {
          nightC.push({ name: CHOGHADIYA[(nStart + i) % 7], good: !!CHOGADIYA_GOOD[CHOGHADIYA[(nStart + i) % 7]],
            start: nightEight[i].start, end: nightEight[i].end });
        }
        out.nextSunrise = nextSunrise;
      }
      out.choghadiya = { day: dayC, night: nightC };

      /* hora: twenty-four planetary hours, twelve of the day and twelve of the night */
      var horas = [], hStart = HORA_START[vaaraIdx], k;
      var dayH = parts(sunrise, sunset, 12);
      for (k = 0; k < 12; k++) {
        horas.push({ lord: HORA_LORDS[(hStart + k) % 7], start: dayH[k].start, end: dayH[k].end, night: false });
      }
      if (nextSunrise) {
        var nightH = parts(sunset, nextSunrise, 12);
        for (k = 0; k < 12; k++) {
          horas.push({ lord: HORA_LORDS[(hStart + 12 + k) % 7], start: nightH[k].start, end: nightH[k].end, night: true });
        }
      }
      out.hora = horas;
    }

    /* --- when each limb changes --- */
    out.limbs = {
      tithi: limbWindow("tithi", jdRef),
      nakshatra: limbWindow("nakshatra", jdRef),
      yoga: limbWindow("yoga", jdRef),
      karana: limbWindow("karana", jdRef)
    };

    /* --- the moon --- */
    var mr = moonRiseSet(toJd(new Date(localDayStart)), lat, lng);
    out.moonrise = mr.moonrise == null ? null : fromJd(mr.moonrise);
    out.moonset = mr.moonset == null ? null : fromJd(mr.moonset);
    var mph = elongation(jdRef);
    out.moonPhase = {
      fraction: mph / 360,
      illumination: (1 - cos(mph)) / 2,
      waxing: mph < 180,
      name: phaseName(mph)
    };
    out.moonRashi = { index: Math.floor(siderealMoon(jdRef) / 30), name: RASHI[Math.floor(siderealMoon(jdRef) / 30)] };

    /* --- the month and the years --- */
    var lm = lunarMonth(jdRef, tithi.paksha);
    var sv = samvat(jdRef, date);
    var sunSign = Math.floor(siderealSun(jdRef) / 30);
    out.month = {
      masa: lm.name, masaIndex: lm.index, amanta: lm.amanta, amantaIndex: lm.amantaIndex,
      newMoon: lm.newMoon,
      shaka: sv.shaka, vikram: sv.vikram, samvatsara: sv.vikramName,
      ritu: rituOf(sunSign), ayana: ayanaOf(sunSign),
      sunRashi: { index: sunSign, name: RASHI[sunSign] }
    };

    /* --- bhadra: the Vishti karana --- */
    out.bhadra = kar.name === "Vishti";

    /* --- eclipse possibility: only when the new or full moon falls today --- */
    var sy = syzygies(jdRef);
    var dayLo = toJd(new Date(localDayStart)), dayHi = dayLo + 1;
    out.eclipse = null;
    var cand = [sy.tNew, sy.nextNew, sy.tFull, sy.nextFull];
    for (var ci = 0; ci < cand.length && !out.eclipse; ci++) {
      if (cand[ci] != null && cand[ci] >= dayLo && cand[ci] < dayHi) out.eclipse = eclipseAt(cand[ci]);
    }

    /* --- observances --- */
    out.observances = observancesOf(tithi, nak, vaaraIdx, siderealSun(jdRef), jdRef, out);

    return out;
  }

  function phaseName(e) {
    var f = e / 360;
    return f < 0.03 || f > 0.97 ? "New moon" : f < 0.22 ? "Waxing crescent" : f < 0.28 ? "First quarter"
      : f < 0.47 ? "Waxing gibbous" : f < 0.53 ? "Full moon" : f < 0.72 ? "Waning gibbous"
      : f < 0.78 ? "Last quarter" : "Waning crescent";
  }

  var AUSPICIOUS_TITHI = { 1: 1, 2: 1, 3: 1, 5: 1, 7: 1, 10: 1, 11: 1, 12: 1, 13: 1 };
  var AUSPICIOUS_NAK = ["Rohini", "Mrigashira", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Shravana", "Revati"];

  function observancesOf(tithi, nak, vaaraIdx, sunSid, jdRef, day) {
    var obs = [];
    if (tithi.index === 14) obs.push("Purnima");
    if (tithi.index === 29) obs.push("Amavasya");
    if (tithi.number === 11) obs.push("Ekadashi");
    if (tithi.number === 13) obs.push("Pradosh");
    if (tithi.number === 4) obs.push("Chaturthi");
    if (tithi.number === 8 && tithi.paksha === "Krishna") obs.push("Ashtami");
    if (day.bhadra) obs.push("Bhadra");
    /* Sankranti: the sun changed sign since yesterday */
    var prev = norm360(sunLongitude(jdRef - 1) - ayanamsa(jdRef - 1));
    if (Math.floor(norm360(sunSid) / 30) !== Math.floor(prev / 30)) obs.push("Sankranti");
    return obs;
  }

  /* ================= festivals =================
   * A rule, not a date: {name, masa, paksha, tithi}. `masa` is the purnimanta
   * month name, which is the reckoning that makes Diwali "Kartik Amavasya" and
   * Maha Shivratri "Phalguna Krishna Chaturdashi". A table of dates goes stale;
   * a rule does not, and a reader can check it against any printed panchang.
   *
   * A tithi can touch two local days. When it does, the first day is given -
   * which is the convention most festivals follow - and the tithi's own window
   * is on the day's card, so the second day is visible rather than hidden.
   */
  function festivalsIn(startDate, endDate, rules, opts) {
    opts = opts || {};
    var out = [], matchedYesterday = {};
    var d = localDate(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    var end = toJd(endDate);
    while (toJd(new Date(d.getTime() + 12 * 3600000)) <= end) {
      var p = compute(d, opts), seen = {};
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.masa !== p.month.masa) continue;
        /* the tithi is read at the time the observance is kept: sunrise for
           most, pradosh (the first watch of the night) for the lamp festivals */
        var ref = null;
        if (r.at === "pradosh" && p.sunset) ref = toJd(p.sunset) + 1.5 / 24;
        else if (r.at === "noon") ref = null;
        else if (p.sunrise) ref = toJd(p.sunrise);
        var t = ref == null ? p.tithi : tithiAt(ref);
        if (r.paksha && r.paksha !== t.paksha) continue;
        if (r.tithi !== t.number) continue;
        seen[r.name] = true;
        if (!matchedYesterday[r.name]) out.push({ date: new Date(d), name: r.name, rule: r });
      }
      matchedYesterday = seen;
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  /* ================= the muhurat finder ================= */

  function findMuhurat(startDate, opts) {
    opts = opts || {};
    var days = opts.days || 60, want = opts.count || 5, out = [];
    var d = localDate(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (var i = 0; i < days && out.length < want; i++) {
      var p = compute(d, opts);
      if (AUSPICIOUS_TITHI[p.tithi.number] && AUSPICIOUS_NAK.indexOf(p.nakshatra.name) !== -1 &&
          !p.bhadra) {
        out.push({ date: new Date(d), tithi: p.tithi, nakshatra: p.nakshatra, vaara: p.vaara,
          abhijit: p.abhijit, sunrise: p.sunrise, sunset: p.sunset });
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  /* ================= a month at a glance ================= */

  function monthTable(year, month1, opts) {
    var rows = [], days = new Date(year, month1, 0).getDate();
    for (var i = 1; i <= days; i++) rows.push(compute(localDate(year, month1 - 1, i), opts));
    return rows;
  }

  /* ================= exports ================= */
  return {
    version: "0.4.0",
    compute: compute,
    findMuhurat: findMuhurat,
    festivalsIn: festivalsIn,
    monthTable: monthTable,
    jd: jd, fromJd: fromJd, toJd: toJd,
    deltaT: deltaT, ayanamsa: ayanamsa, gmst: gmst, obliquity: obliquity, zoneOffset: zoneOffset,
    sunLongitude: sunLongitude, moonLongitude: moonLongitude, moonLatitude: moonLatitude,
    siderealSun: siderealSun, siderealMoon: siderealMoon,
    elongation: elongation, nodeLongitude: nodeLongitude,
    sunRiseSet: sunRiseSet, moonRiseSet: moonRiseSet,
    sunTimes: function (date, lat, lng) {
      var s = sunRiseSet(date, lat, lng);
      if (s.polar) return { polar: s.polar };
      var base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      return {
        sunrise: new Date(base + s.sunriseUTC * 3600000),
        sunset: new Date(base + s.sunsetUTC * 3600000),
        transit: new Date(base + s.transitUTC * 3600000)
      };
    },
    tithiAt: tithiAt, nakshatraAt: nakshatraAt, yogaAt: yogaAt, karanaAt: karanaAt,
    limbWindow: limbWindow, nextCrossing: nextCrossing,
    lunarMonth: lunarMonth, samvat: samvat,
    karanaName: karanaName,
    eclipseAt: eclipseAt, syzygies: syzygies, distToNode: distToNode,
    tables: {
      tithi: TITHI, nakshatra: NAKSHATRA, yoga: YOGA, vaara: VAARA,
      karanaMovable: KARANA_MOVABLE, karanaFixed: KARANA_FIXED,
      masa: MASA, rashi: RASHI, ritu: RITU, samvatsara: SAMVATSARA,
      choghadiya: CHOGHADIYA, hora: HORA_LORDS
    }
  };
});
