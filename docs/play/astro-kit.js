/* astro-kit — the shared astronomy core for drsamonline apps. Zero dependencies.
 *
 * The primitives a panchang (Indian almanac) needs, and nothing app-specific:
 * Julian day, solar and lunar longitude, ayanamsa, sunrise/sunset, moon phase,
 * and the derived tithi / nakshatra / yoga / karana.
 *
 * Algorithms: Meeus, "Astronomical Algorithms" (2nd ed.) — the sun (ch. 25),
 * the moon (ch. 47, reduced series), and the standard sunrise equation.
 *
 * ACCURACY: solar and lunar longitude are good to about 0.01–0.05°, which puts
 * a tithi/nakshatra boundary within roughly a minute of time. Panchang timings
 * are therefore APPROXIMATE — do not present them as exact, and local tradition
 * may differ. Verified against the published Meeus worked examples.
 *
 * MIT License. (c) 2026 Dr Sohil Momin.
 */
(function (root, factory) {
  var api = factory();
  root.Astro = api;                                   // browser global / globalThis
  if (typeof module === "object" && module.exports) module.exports = api;  // Node import
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var A = { version: "0.1.0" };
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function sin(d) { return Math.sin(d * D2R); }
  function cos(d) { return Math.cos(d * D2R); }
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function frac(x) { return x - Math.floor(x); }

  /* ---------- time ---------- */
  /* Julian Day from a JS Date (interpreted as UTC) or {y,m,d,h}. */
  A.jd = function (when) {
    var y, m, d, h;
    if (when instanceof Date) {
      y = when.getUTCFullYear(); m = when.getUTCMonth() + 1; d = when.getUTCDate();
      h = when.getUTCHours() + when.getUTCMinutes() / 60 + when.getUTCSeconds() / 3600;
    } else { y = when.y; m = when.m; d = when.d; h = when.h || 0; }
    var yy = y, mm = m;
    if (mm <= 2) { yy -= 1; mm += 12; }
    var a = Math.floor(yy / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + b - 1524.5 + h / 24;
  };
  A.jdFromDate = function (dt) { return A.jd(dt); };

  /* ---------- the sun (Meeus ch. 25) ---------- */
  A.sunLongitude = function (jde) {
    var T = (jde - 2451545.0) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
          + (0.019993 - 0.000101 * T) * sin(2 * M)
          + 0.000289 * sin(3 * M);
    var trueLong = L0 + C;
    var omega = 125.04 - 1934.136 * T;
    return norm360(trueLong - 0.00569 - 0.00478 * sin(omega));  // apparent
  };

  /* ---------- the moon (Meeus ch. 47, reduced series) ---------- */
  var MOON_TERMS = [
    [6288774, 0, 0, 1, 0], [1274027, 2, 0, -1, 0], [658314, 2, 0, 0, 0], [213618, 0, 0, 2, 0],
    [-185116, 0, 1, 0, 0], [-114332, 0, 0, 0, 2], [58793, 2, 0, -2, 0], [57066, 2, -1, -1, 0],
    [53322, 2, 0, 1, 0], [45758, 2, -1, 0, 0], [-40923, 0, 1, -1, 0], [-34720, 1, 0, 0, 0],
    [-30383, 0, 1, 1, 0], [15327, 2, 0, 0, -2], [-12528, 0, 0, 1, 2], [10980, 0, 0, 1, -2],
    [10675, 4, 0, -1, 0], [10034, 0, 0, 3, 0], [8548, 4, 0, -2, 0], [-7888, 2, 1, -1, 0],
    [-6766, 2, 1, 0, 0], [-5163, 1, 0, -1, 0], [4987, 1, 1, 0, 0], [4036, 2, -1, 1, 0],
    [3994, 2, 0, 2, 0], [3861, 4, 0, 0, 0], [3665, 2, 0, -3, 0]
  ];
  A.moonLongitude = function (jde) {
    var T = (jde - 2451545.0) / 36525;
    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841;
    var D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868;
    var M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    var F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
    var sum = 0;
    for (var i = 0; i < MOON_TERMS.length; i++) {
      var t = MOON_TERMS[i];
      sum += t[0] * sin(t[1] * D + t[2] * M + t[3] * Mp + t[4] * F);
    }
    return norm360(Lp + sum / 1000000);
  };

  /* ---------- ayanamsa (Lahiri, approximate) ---------- */
  A.ayanamsa = function (jde) {
    return 23.853 + 0.013969 * ((jde - 2451545.0) / 365.25);
  };

  /* ---------- sunrise / sunset (standard sunrise equation) ---------- */
  A.sunriseSunset = function (dateUTC, lat, lon) {
    var Jdate = A.jd(dateUTC);
    var jd0 = Math.floor(Jdate + 0.5) - 0.5;            // 0h UTC that day
    var n = Math.ceil(Jdate - 2451545.0 + 0.0008);      // integer days since J2000
    var Jstar = n - lon / 360;
    var M = norm360(357.5291 + 0.98560028 * Jstar);
    var C = 1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M);
    var lambda = norm360(M + C + 180 + 102.9372);
    var Jtransit = 2451545.0 + Jstar + 0.0053 * sin(M) - 0.0069 * sin(2 * lambda);
    var delta = Math.asin(sin(lambda) * sin(23.44)) * R2D;
    var cosOmega = (sin(-0.833) - sin(lat) * sin(delta)) / (cos(lat) * cos(delta));
    if (cosOmega > 1) return { polar: "night" };
    if (cosOmega < -1) return { polar: "day" };
    var omega = Math.acos(cosOmega) * R2D;
    return {
      transitUTC: (Jtransit - jd0) * 24,
      sunriseUTC: (Jtransit - omega / 360 - jd0) * 24,
      sunsetUTC: (Jtransit + omega / 360 - jd0) * 24
    };
  };

  /* ---------- derived: tithi, nakshatra, yoga, karana, phase ---------- */
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
  var KARANA_MOVABLE = ["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti"];

  A.elongation = function (jde) { return norm360(A.moonLongitude(jde) - A.sunLongitude(jde)); };

  A.tithi = function (jde) {
    var e = A.elongation(jde), idx = Math.floor(e / 12);   // 0..29
    return { index: idx + 1, name: TITHI[idx], paksha: idx < 15 ? "Shukla" : "Krishna", elongation: e, fraction: frac(e / 12) };
  };
  A.nakshatra = function (jde) {
    var sid = norm360(A.moonLongitude(jde) - A.ayanamsa(jde));
    var idx = Math.floor(sid / (360 / 27));
    return { index: idx + 1, name: NAKSHATRA[idx], longitude: sid, pada: Math.floor(frac(sid / (360 / 27)) * 4) + 1 };
  };
  A.yoga = function (jde) {
    // yoga uses the SIDEREAL sum of the sun and moon longitudes
    var ayan = A.ayanamsa(jde);
    var s = norm360((A.sunLongitude(jde) - ayan) + (A.moonLongitude(jde) - ayan));
    var idx = Math.floor(s / (360 / 27));
    return { index: idx + 1, name: YOGA[idx] };
  };
  A.karana = function (jde) {
    var idx = Math.floor(A.elongation(jde) / 6);            // 0..59
    var name;
    if (idx === 0) name = "Kimstughna";
    else if (idx >= 57) name = ["Shakuni","Chatushpada","Naga"][idx - 57];
    else name = KARANA_MOVABLE[(idx - 1) % 7];
    return { index: idx + 1, name: name };
  };
  A.moonPhase = function (jde) {
    var e = A.elongation(jde), f = e / 360;
    var name = f < 0.03 || f > 0.97 ? "New moon" : f < 0.22 ? "Waxing crescent" : f < 0.28 ? "First quarter"
      : f < 0.47 ? "Waxing gibbous" : f < 0.53 ? "Full moon" : f < 0.72 ? "Waning gibbous"
      : f < 0.78 ? "Last quarter" : "Waning crescent";
    return { fraction: f, illumination: (1 - cos(e)) / 2, name: name };
  };

  A.panchang = function (when, opts) {
    opts = opts || {};
    var jde = A.jd(when);
    var out = { jd: jde, sunLongitude: A.sunLongitude(jde), moonLongitude: A.moonLongitude(jde),
                ayanamsa: A.ayanamsa(jde), tithi: A.tithi(jde), nakshatra: A.nakshatra(jde),
                yoga: A.yoga(jde), karana: A.karana(jde), moonPhase: A.moonPhase(jde) };
    if (opts.lat !== undefined && opts.lon !== undefined) {
      var d = (when instanceof Date) ? when : new Date(Date.UTC(when.y, when.m - 1, when.d, when.h || 0));
      out.sun = A.sunriseSunset(d, opts.lat, opts.lon);
    }
    return out;
  };

  /* ---------- helpers for consumers ---------- */
  A.fromJd = function (jd) { return new Date((jd - 2440587.5) * 86400000); };
  A.tables = { tithi: TITHI, nakshatra: NAKSHATRA, yoga: YOGA, karanaMovable: KARANA_MOVABLE };

  return A;
});
