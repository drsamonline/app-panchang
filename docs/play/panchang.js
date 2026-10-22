/* panchang.js — the app-specific layer of the Panchang app.
 *
 * The ASTRONOMY (sun/moon longitude, ayanamsa, sunrise/sunset, and the derived
 * tithi/nakshatra/yoga/karana) now lives in the shared **astro-kit**; this file
 * keeps only what is specific to this app: vaara, rahu-kaal, the day's
 * observances, and the muhurat finder.
 *
 * Part of the Forge system. MIT License. (c) 2026 Dr Sohil Momin.
 * Works in the browser (window.Panchang) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./astro-kit.js"));
  else root.Panchang = factory(root.Astro);
})(typeof self !== "undefined" ? self : this, function (Astro) {
  "use strict";
  if (!Astro) throw new Error("panchang.js requires astro-kit.js to be loaded first");

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function toJD(date) { return date.getTime() / 86400000 + 2440587.5; }
  function fromJD(jd) { return Astro.fromJd(jd); }

  /* astronomy comes from the kit */
  var sunLongitude = Astro.sunLongitude;
  var moonLongitude = Astro.moonLongitude;
  var ayanamsa = Astro.ayanamsa;

  /* ---------- app-specific tables ---------- */
  var VAARA = ["Ravivara", "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara"];
  var RAHU_PART = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat: which 1/8 of daylight is Rahu Kaal
  var KARANA_FIXED = ["Kimstughna", "Shakuni", "Chatushpada", "Naga"];
  var KARANA_MOVABLE = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"];

  function karanaName(k) {
    if (k === 0) return KARANA_FIXED[0];
    if (k >= 57) return KARANA_FIXED[k - 56];
    return KARANA_MOVABLE[(k - 1) % 7];
  }

  /* ---------- sunrise / sunset as Dates (delegate to the kit) ---------- */
  function sunTimes(date, lat, lng) {
    var s = Astro.sunriseSunset(date, lat, lng);
    if (s.polar) return { polar: s.polar };
    var base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return {
      sunrise: new Date(base + s.sunriseUTC * 3600000),
      sunset: new Date(base + s.sunsetUTC * 3600000),
      transit: new Date(base + s.transitUTC * 3600000)
    };
  }

  /* ---------- the day's panchang ---------- */
  function compute(date, opts) {
    opts = opts || {};
    var lat = (opts.lat == null ? 19.0760 : opts.lat);   // default: Mumbai
    var lng = (opts.lng == null ? 72.8777 : opts.lng);
    var tz = (opts.tz == null ? 5.5 : opts.tz);          // hours east of UTC

    var y = date.getFullYear(), mo = date.getMonth(), d = date.getDate();
    var noon = new Date(Date.UTC(y, mo, d, 12, 0, 0) - tz * 3600000); // local noon
    var jd = toJD(noon);

    var sun = sunLongitude(jd), moon = moonLongitude(jd), ayan = ayanamsa(jd);
    var elongation = norm360(moon - sun);

    var tithiIdx = Math.floor(elongation / 12);
    var paksha = tithiIdx < 15 ? "Shukla" : "Krishna";
    var nakshatraIdx = Math.floor(norm360(moon - ayan) / (360 / 27));
    var yogaIdx = Math.floor(norm360((sun - ayan) + (moon - ayan)) / (360 / 27));
    var karanaIdx = Math.floor(elongation / 6);

    var st = sunTimes(noon, lat, lng);
    var vaaraIdx = date.getDay();
    var rahu = null;
    if (st.sunrise && st.sunset) {
      var rise = toJD(st.sunrise), set = toJD(st.sunset);
      var part = RAHU_PART[vaaraIdx], span = (set - rise) / 8;
      rahu = { start: fromJD(rise + (part - 1) * span), end: fromJD(rise + part * span) };
    }

    var observances = [];
    if (tithiIdx === 14) observances.push("Purnima (full moon)");
    if (tithiIdx === 29) observances.push("Amavasya (new moon)");
    if (tithiIdx === 10 || tithiIdx === 25) observances.push("Ekadashi");
    if (tithiIdx === 12 || tithiIdx === 27) observances.push("Pradosh");
    var sunSid = norm360(sun - ayan);
    var prevSid = norm360(sunLongitude(jd - 1) - ayanamsa(jd - 1));
    if (Math.floor(sunSid / 30) !== Math.floor(prevSid / 30)) observances.push("Sankranti (sun enters a new sign)");

    return {
      date: new Date(y, mo, d), lat: lat, lng: lng, tz: tz,
      vaara: { index: vaaraIdx, name: VAARA[vaaraIdx] },
      tithi: { index: tithiIdx, name: Astro.tables.tithi[tithiIdx], paksha: paksha, number: (tithiIdx % 15) + 1 },
      nakshatra: { index: nakshatraIdx, name: Astro.tables.nakshatra[nakshatraIdx] },
      yoga: { index: yogaIdx, name: Astro.tables.yoga[yogaIdx] },
      karana: { index: karanaIdx, name: karanaName(karanaIdx) },
      elongation: elongation, ayanamsa: ayan,
      sunrise: st.sunrise || null, sunset: st.sunset || null, rahuKaal: rahu, observances: observances
    };
  }

  /* ---------- muhurat finder ---------- */
  var AUSPICIOUS_TITHI = { 1: 1, 2: 1, 3: 1, 5: 1, 7: 1, 10: 1, 11: 1, 12: 1, 13: 1 };
  var AUSPICIOUS_NAK = ["Rohini", "Mrigashira", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Shravana", "Revati"];

  function findMuhurat(startDate, opts) {
    opts = opts || {};
    var days = opts.days || 60, want = opts.count || 5, out = [];
    var d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (var i = 0; i < days && out.length < want; i++) {
      var p = compute(d, opts);
      if (AUSPICIOUS_TITHI[p.tithi.number] && AUSPICIOUS_NAK.indexOf(p.nakshatra.name) !== -1) {
        out.push({ date: new Date(d), tithi: p.tithi, nakshatra: p.nakshatra, vaara: p.vaara });
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  return {
    version: "0.2.0",
    compute: compute,
    findMuhurat: findMuhurat,
    sunLongitude: sunLongitude,
    moonLongitude: moonLongitude,
    ayanamsa: ayanamsa,
    sunTimes: sunTimes,
    tables: { tithi: Astro.tables.tithi, nakshatra: Astro.tables.nakshatra, yoga: Astro.tables.yoga, vaara: VAARA },
    karanaName: karanaName
  };
});
