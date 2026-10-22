/* panchang.js — an offline Panchang engine (the daily Indian almanac core).
 * Part of the Forge system. MIT License. (c) 2026 Dr Sohil Momin.
 *
 * Computes, for a place and a day, entirely offline:
 *   tithi, nakshatra, yoga, karana, paksha, vaara,
 *   sunrise, sunset, rahu-kaal, and the day's observances.
 *
 * Method: Meeus, "Astronomical Algorithms" — low-precision apparent solar and
 * lunar longitudes (ch. 25 & 47), the standard sunrise equation, and a linear
 * Lahiri ayanamsa. This is a FIRST PASS: it is accurate to a few minutes near a
 * tithi/nakshatra boundary. For ritual-critical use, cross-check against a
 * printed panchang for your city.
 *
 * Works in the browser (window.Panchang) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Panchang = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var RAD = Math.PI / 180;
  function sin(x) { return Math.sin(x * RAD); }
  function cos(x) { return Math.cos(x * RAD); }
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  /* ---------- time ---------- */
  function toJD(date) { return date.getTime() / 86400000 + 2440587.5; }
  function fromJD(jd) { return new Date((jd - 2440587.5) * 86400000); }

  /* ---------- apparent longitudes (Meeus) ---------- */
  function sunLongitude(jd) {
    var T = (jd - 2451545.0) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
          + (0.019993 - 0.000101 * T) * sin(2 * M)
          + 0.000289 * sin(3 * M);
    var om = 125.04 - 1934.136 * T;
    return norm360(L0 + C - 0.00569 - 0.00478 * sin(om));
  }

  function moonLongitude(jd) {
    var T = (jd - 2451545.0) / 36525;
    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + (T * T * T) / 538841 - (T * T * T * T) / 65194000;
    var D  = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + (T * T * T) / 545868 - (T * T * T * T) / 113065000;
    var M  = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T * T * T) / 24490000;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + (T * T * T) / 69699 - (T * T * T * T) / 14712000;
    var F  = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - (T * T * T) / 3526000 + (T * T * T * T) / 863310000;
    var lon = Lp
      + 6.288774 * sin(Mp)
      + 1.274027 * sin(2 * D - Mp)
      + 0.658314 * sin(2 * D)
      + 0.213618 * sin(2 * Mp)
      - 0.185116 * sin(M)
      - 0.114332 * sin(2 * F)
      + 0.058793 * sin(2 * D - 2 * Mp)
      + 0.057066 * sin(2 * D - M - Mp)
      + 0.053322 * sin(2 * D + Mp)
      + 0.045758 * sin(2 * D - M)
      - 0.040923 * sin(M - Mp)
      - 0.034720 * sin(D)
      - 0.030383 * sin(M + Mp)
      + 0.015327 * sin(2 * D - 2 * F)
      - 0.012528 * sin(Mp + 2 * F)
      + 0.010980 * sin(Mp - 2 * F);
    return norm360(lon);
  }

  /* Lahiri ayanamsa (degrees), linear around J2000 (~50.29"/yr). */
  function ayanamsa(jd) {
    var T = (jd - 2451545.0) / 36525;
    return 23.85258 + 1.39724 * T;
  }

  /* ---------- sunrise / sunset (standard sunrise equation) ---------- */
  function sunTimes(date, lat, lng) {
    var n = Math.floor(toJD(date) - 2451545.0 + 0.5); // whole days since 2000-01-01
    var Jstar = n - lng / 360; // mean solar noon, days since 2000-01-01
    var M = norm360(357.5291 + 0.98560028 * Jstar);
    var C = 1.9148 * sin(M) + 0.0200 * sin(2 * M) + 0.0003 * sin(3 * M);
    var lambda = norm360(M + C + 180 + 102.9372);
    var Jtransit = 2451545.0 + Jstar + 0.0053 * sin(M) - 0.0069 * sin(2 * lambda);
    var sinDec = sin(lambda) * sin(23.44);
    var cosDec = Math.sqrt(1 - sinDec * sinDec);
    var cosOmega = (sin(-0.833) - sin(lat) * sinDec) / (cos(lat) * cosDec);
    if (cosOmega > 1) return { polar: "night" };
    if (cosOmega < -1) return { polar: "day" };
    var omega = Math.acos(cosOmega) * 180 / Math.PI;
    return {
      sunrise: fromJD(Jtransit - omega / 360),
      sunset: fromJD(Jtransit + omega / 360),
      transit: fromJD(Jtransit)
    };
  }

  /* ---------- name tables ---------- */
  var TITHI = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
    "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
    "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya"];

  var NAKSHATRA = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
    "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
    "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

  var YOGA = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
    "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi",
    "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma",
    "Indra", "Vaidhriti"];

  var KARANA_MOVABLE = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"];
  var KARANA_FIXED = ["Kimstughna", "Shakuni", "Chatushpada", "Naga"];

  var VAARA = ["Ravivara", "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara"];
  var RAHU_PART = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat: which 1/8 of daylight is Rahu Kaal

  function karanaName(k) { // k = 0..59 half-tithi index
    if (k === 0) return KARANA_FIXED[0];
    if (k >= 57) return KARANA_FIXED[k - 56]; // 57->Shakuni,58->Chatushpada,59->Naga
    return KARANA_MOVABLE[(k - 1) % 7];
  }

  /* ---------- the day's panchang ---------- */
  function compute(date, opts) {
    opts = opts || {};
    var lat = (opts.lat == null ? 19.0760 : opts.lat);   // default: Mumbai
    var lng = (opts.lng == null ? 72.8777 : opts.lng);
    var tz = (opts.tz == null ? 5.5 : opts.tz);          // hours east of UTC

    var y = date.getFullYear(), mo = date.getMonth(), d = date.getDate();
    // the instant used: local noon at the place (a panchang is "for the day")
    var noon = new Date(Date.UTC(y, mo, d, 12, 0, 0) - tz * 3600000);
    var jd = toJD(noon);

    var sun = sunLongitude(jd);
    var moon = moonLongitude(jd);
    var ayan = ayanamsa(jd);
    var elongation = norm360(moon - sun);

    var tithiIdx = Math.floor(elongation / 12);          // 0..29
    var paksha = tithiIdx < 15 ? "Shukla" : "Krishna";
    var nakshatraIdx = Math.floor(norm360(moon - ayan) / (360 / 27));
    var yogaIdx = Math.floor(norm360((sun - ayan) + (moon - ayan)) / (360 / 27));
    var karanaIdx = Math.floor(elongation / 6);          // 0..59

    var st = sunTimes(noon, lat, lng);
    var vaaraIdx = date.getDay(); // 0=Sun
    var rahu = null;
    if (st.sunrise && st.sunset) {
      var rise = toJD(st.sunrise), set = toJD(st.sunset);
      var part = RAHU_PART[vaaraIdx];
      var span = (set - rise) / 8;
      rahu = { start: fromJD(rise + (part - 1) * span), end: fromJD(rise + part * span) };
    }

    var observances = [];
    if (tithiIdx === 14) observances.push("Purnima (full moon)");
    if (tithiIdx === 29) observances.push("Amavasya (new moon)");
    if (tithiIdx === 10 || tithiIdx === 25) observances.push("Ekadashi");
    if (tithiIdx === 12 || tithiIdx === 27) observances.push("Pradosh");
    // Sankranti: the sun crossing into a new sidereal sign during the day
    var sunSid = norm360(sun - ayan);
    var prevSid = norm360(sunLongitude(jd - 1) - ayanamsa(jd - 1));
    if (Math.floor(sunSid / 30) !== Math.floor(prevSid / 30)) observances.push("Sankranti (sun enters a new sign)");

    return {
      date: new Date(y, mo, d),
      lat: lat, lng: lng, tz: tz,
      vaara: { index: vaaraIdx, name: VAARA[vaaraIdx] },
      tithi: { index: tithiIdx, name: TITHI[tithiIdx], paksha: paksha, number: (tithiIdx % 15) + 1 },
      nakshatra: { index: nakshatraIdx, name: NAKSHATRA[nakshatraIdx] },
      yoga: { index: yogaIdx, name: YOGA[yogaIdx] },
      karana: { index: karanaIdx, name: karanaName(karanaIdx) },
      elongation: elongation,
      ayanamsa: ayan,
      sunrise: st.sunrise || null,
      sunset: st.sunset || null,
      rahuKaal: rahu,
      observances: observances
    };
  }

  /* ---------- muhurat finder ---------- */
  var AUSPICIOUS_TITHI = { 1: 1, 2: 1, 3: 1, 5: 1, 7: 1, 10: 1, 11: 1, 12: 1, 13: 1 }; // 1..15 within paksha
  var AUSPICIOUS_NAK = ["Rohini", "Mrigashira", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Shravana", "Revati"];

  function findMuhurat(startDate, opts) {
    opts = opts || {};
    var days = opts.days || 60, want = opts.count || 5;
    var out = [];
    var d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (var i = 0; i < days && out.length < want; i++) {
      var p = compute(d, opts);
      var t = p.tithi.number;
      if (AUSPICIOUS_TITHI[t] && AUSPICIOUS_NAK.indexOf(p.nakshatra.name) !== -1) {
        out.push({ date: new Date(d), tithi: p.tithi, nakshatra: p.nakshatra, vaara: p.vaara });
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  return {
    version: "0.1.0",
    compute: compute,
    findMuhurat: findMuhurat,
    sunLongitude: sunLongitude,
    moonLongitude: moonLongitude,
    ayanamsa: ayanamsa,
    sunTimes: sunTimes,
    tables: { tithi: TITHI, nakshatra: NAKSHATRA, yoga: YOGA, vaara: VAARA },
    karanaName: karanaName
  };
});
