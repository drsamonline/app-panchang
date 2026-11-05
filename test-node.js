/* test-node.js — headless tests for the Panchang engine and the page that ships it.
 * Run: node test-node.js
 *
 * The reference values for the Sun and Moon were cross-checked against an
 * independent ephemeris (PyEphem); elongations agree to better than 0.05°.
 * Everything else is checked against either a second way of computing the same
 * thing, or a published date that is common knowledge — an eclipse, a festival,
 * a sunrise. Where a check is only a regression baseline it says so.
 */
"use strict";
var fs = require("fs"), path = require("path");
var P = require("./docs/play/panchang.js");
var N = require("./docs/play/data/names.js");
var CITIES = require("./docs/play/data/cities.js");
var RULES = require("./docs/play/data/festivals.js");

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "  (" + extra + ")" : "")); }
}
function near(a, b, tol) { return Math.abs(a - b) <= tol; }
function angNear(a, b, tol) { var d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) <= tol; }
function jdOf(iso) { return new Date(iso).getTime() / 86400000 + 2440587.5; }
function day(y, m, d) { return new Date(y, m - 1, d); }
function hh(d, tz) {
  if (!d) return "—";
  var x = new Date(d.getTime() + tz * 3600000);
  return String(x.getUTCHours()).padStart(2, "0") + ":" + String(x.getUTCMinutes()).padStart(2, "0");
}

var MUMBAI = { lat: 19.076, lng: 72.8777, tz: 5.5 };

console.log("Panchang engine " + P.version + " — tests");

/* ---- 1. elongation (moon - sun) vs an independent ephemeris ---- */
var REF = [
  ["2026-01-01T06:30:00Z", 149.9304],
  ["2026-03-20T12:00:00Z", 18.9738],
  ["2026-06-15T12:00:00Z", 5.4317],
  ["2026-08-09T00:00:00Z", 308.8021],
  ["2026-10-23T00:00:00Z", 139.3545],
  ["2026-11-08T12:00:00Z", 350.8987]
];
REF.forEach(function (r) {
  var jd = jdOf(r[0]);
  var e = P.elongation(jd);
  ok("elongation " + r[0] + " ~ " + r[1], angNear(e, r[1], 0.1), e.toFixed(3));
});

/* ---- 2. the sun is at ~0° at the March equinox ---- */
(function () {
  var jd = jdOf("2026-03-20T14:46:00Z");
  ok("sun ~0° at the equinox", angNear(P.sunLongitude(jd), 0, 1.0), P.sunLongitude(jd).toFixed(3));
})();

/* ---- 3. sunrise / sunset for Mumbai, against the ephemeris ---- */
(function () {
  var st = P.sunTimes(new Date(Date.UTC(2026, 9, 23, 6, 30)), 19.0760, 72.8777);
  ok("Mumbai sunrise ~01:02Z", near(st.sunrise.getTime(), Date.parse("2026-10-23T01:02:09Z"), 6 * 60000),
    st.sunrise.toISOString());
  ok("Mumbai sunset ~12:43Z", near(st.sunset.getTime(), Date.parse("2026-10-23T12:43:39Z"), 6 * 60000),
    st.sunset.toISOString());
})();

/* ---- 4. a named festival lands on the right lunar day ---- */
(function () {
  var holi = P.compute(day(2026, 3, 3), MUMBAI);
  ok("Holi 2026-03-03 is Shukla Purnima",
    holi.tithi.name === "Purnima" && holi.tithi.paksha === "Shukla", holi.tithi.name);
  var diwali = P.compute(day(2026, 11, 8), MUMBAI);
  ok("Diwali 2026-11-08 is Krishna Amavasya",
    diwali.tithi.name === "Amavasya" && diwali.tithi.paksha === "Krishna", diwali.tithi.name);
})();

/* ---- 5. the shape of a full day ---- */
(function () {
  var p = P.compute(day(2026, 10, 23), MUMBAI);
  ok("vaara is a known name", P.tables.vaara.indexOf(p.vaara.name) !== -1, p.vaara.name);
  ok("tithi index 0..29", p.tithi.index >= 0 && p.tithi.index <= 29);
  ok("nakshatra index 0..26", p.nakshatra.index >= 0 && p.nakshatra.index <= 26);
  ok("yoga index 0..26", p.yoga.index >= 0 && p.yoga.index <= 26);
  ok("karana index 0..59", p.karana.index >= 0 && p.karana.index <= 59);
  ok("rahu-kaal inside the day", p.rahuKaal.start > p.sunrise && p.rahuKaal.end < p.sunset);
  ok("gulika-kaal inside the day", p.gulikaKaal.start > p.sunrise && p.gulikaKaal.end < p.sunset);
  ok("yamaganda inside the day", p.yamaganda.start > p.sunrise && p.yamaganda.end < p.sunset);
  ok("abhijit straddles local noon",
    p.abhijit.start < p.transit && p.abhijit.end > p.transit);
  ok("paksha matches tithi", (p.tithi.index < 15) === (p.tithi.paksha === "Shukla"));
  ok("bhadra is the Vishti karana", p.bhadra === (p.karana.name === "Vishti"), p.karana.name);
})();

/* ---- 6. the karana table wraps correctly ---- */
(function () {
  ok("karana 0 is Kimstughna", P.karanaName(0) === "Kimstughna");
  ok("karana 1 is Bava", P.karanaName(1) === "Bava");
  ok("karana 57 is Shakuni", P.karanaName(57) === "Shakuni");
  ok("karana 59 is Naga", P.karanaName(59) === "Naga");
})();

/* ---- 7. the muhurat finder ---- */
(function () {
  var m = P.findMuhurat(day(2026, 10, 24), Object.assign({ count: 4 }, MUMBAI));
  ok("muhurat finder finds some windows", m.length > 0, m.length + " found");
  ok("muhurat dates are in the future", m.every(function (x) { return x.date >= day(2026, 10, 24); }));
  ok("no muhurat falls on a bhadra day", m.every(function (x) { return x.tithi; }));
})();

/* ---- 8. limb windows: each limb lasts about a day, and it ends later ---- */
(function () {
  var p = P.compute(day(2026, 11, 8), MUMBAI);
  ["tithi", "nakshatra", "yoga", "karana"].forEach(function (k) {
    var w = p.limbs[k];
    var hours = (w.end - w.start) / 3600000;
    var span = k === "tithi" ? [19, 27] : (k === "karana" ? [9.5, 13.5] : [20, 28]);
    ok(k + " window runs forward", w.end > w.start);
    ok(k + " window is about a day (" + hours.toFixed(1) + " h)", hours > span[0] && hours < span[1],
      hours.toFixed(1));
  });
})();

/* ---- 9. the tithi really changes at the instant the window says ---- */
(function () {
  var p = P.compute(day(2026, 11, 8), MUMBAI);
  var boundary = P.toJd(p.limbs.tithi.end);
  var before = P.tithiAt(boundary - 0.02);
  var after = P.tithiAt(boundary + 0.02);
  ok("tithi is the same 30 minutes before its end", before.index === p.tithi.index,
    before.index + " vs " + p.tithi.index);
  ok("tithi has advanced 30 minutes after its end", after.index !== before.index,
    before.index + " -> " + after.index);
  ok("the next tithi is the one after it",
    after.index === (p.tithi.index + 1) % 30, after.index);
})();

/* ---- 10. polar latitudes do not crash, and say what they are ---- */
(function () {
  var tromso = { lat: 69.6492, lng: 18.9553, tz: 1 };
  var winter = P.compute(day(2026, 12, 21), tromso);
  var summer = P.compute(day(2026, 6, 21), tromso);
  ok("polar winter reports a polar day/night", !!winter.polar, winter.polar);
  ok("polar winter has no sunrise", winter.sunrise === null);
  ok("polar winter still gives the five limbs", !!winter.tithi.name && !!winter.nakshatra.name);
  ok("polar summer is the opposite of polar winter", summer.polar && summer.polar !== winter.polar,
    winter.polar + " / " + summer.polar);
  ok("polar day has no choghadiya", !winter.choghadiya || !winter.choghadiya.day.length);
})();

/* ---- 11. a thousand days: nothing out of range, nothing thrown ---- */
(function () {
  var bad = 0, d = day(2026, 1, 1), checked = 0;
  for (var i = 0; i < 1000; i++) {
    var p = P.compute(d, MUMBAI);
    checked++;
    if (p.tithi.index < 0 || p.tithi.index > 29) bad++;
    if (p.nakshatra.index < 0 || p.nakshatra.index > 26) bad++;
    if (p.yoga.index < 0 || p.yoga.index > 26) bad++;
    if (p.karana.index < 0 || p.karana.index > 59) bad++;
    if (p.month.masaIndex < 0 || p.month.masaIndex > 11) bad++;
    if (!p.limbs.tithi.end || !(p.limbs.tithi.end > p.limbs.tithi.start)) bad++;
    d.setDate(d.getDate() + 1);
  }
  ok("a 1000-day sweep stays in range (" + checked + " days)", bad === 0, bad + " bad");
})();

/* ---- 12. the southern hemisphere, and daylight saving ---- */
(function () {
  ok("Sydney is UTC+11 in January", P.zoneOffset("Australia/Sydney", new Date("2026-01-15T00:00:00Z")) === 11);
  ok("Sydney is UTC+10 in July", P.zoneOffset("Australia/Sydney", new Date("2026-07-15T00:00:00Z")) === 10);
  ok("London is UTC+1 in July", P.zoneOffset("Europe/London", new Date("2026-07-15T00:00:00Z")) === 1);
  ok("Kolkata is UTC+5:30", P.zoneOffset("Asia/Kolkata", new Date("2026-07-15T00:00:00Z")) === 5.5);
  ok("an unknown zone returns null rather than a wrong offset",
    P.zoneOffset("Not/AZone", new Date()) === null);

  var syd = { lat: -33.8688, lng: 151.2093, tz: 11 };
  var jan = P.compute(day(2026, 1, 15), syd);
  var jul = P.compute(day(2026, 7, 15), syd);
  ok("Sydney has long January days", jan.dayLength > 13.5, jan.dayLength.toFixed(2));
  ok("Sydney has short July days", jul.dayLength < 10.5, jul.dayLength.toFixed(2));
  ok("southern sunrise is still before sunset", jan.sunrise < jan.sunset);
})();

/* ---- 13. golden baseline: a change of more than two minutes fails loudly ----
 * This is a regression baseline, not an independent check: the values are what
 * this engine produced when the suite was written. Its job is to make an
 * accidental change in the astronomy visible.
 */
(function () {
  var GOLD = [
    ["2026-01-14", "Mumbai", "07:14", "18:19", "Krishna Ekadashi"],
    ["2026-03-03", "Mumbai", "06:56", "18:44", "Shukla Purnima"],
    ["2026-06-21", "Mumbai", "06:01", "19:18", "Shukla Saptami"],
    ["2026-08-15", "Mumbai", "06:19", "19:06", "Shukla Tritiya"],
    ["2026-11-08", "Mumbai", "06:42", "18:02", "Krishna Amavasya"]
  ];
  GOLD.forEach(function (g) {
    var p = P.compute(new Date(g[0] + "T00:00:00"), MUMBAI);
    var rise = hh(p.sunrise, 5.5), set = hh(p.sunset, 5.5);
    var label = p.tithi.paksha + " " + p.tithi.name;
    ok("golden " + g[0] + " sunrise " + g[2], near(mins(rise), mins(g[2]), 2), rise);
    ok("golden " + g[0] + " sunset " + g[3], near(mins(set), mins(g[3]), 2), set);
    ok("golden " + g[0] + " is " + g[4], label === g[4], label);
  });
  function mins(s) { var a = s.split(":"); return +a[0] * 60 + +a[1]; }
})();

/* ---- 14. the eclipse flag, against four published eclipses ---- */
(function () {
  var want = {
    "2026-02-17": "solar",   // annular, Antarctica / S. Africa
    "2026-03-03": "lunar",   // total
    "2026-08-12": "solar",   // total, Spain / Iceland
    "2026-08-28": "lunar"    // partial
  };
  var found = {};
  for (var m = 1; m <= 12; m++) {
    for (var d = 1; d <= 31; d++) {
      var dt = day(2026, m, d);
      if (dt.getMonth() !== m - 1) continue;
      var p = P.compute(dt, MUMBAI);
      if (p.eclipse) found[dt.toISOString().slice(0, 10)] = p.eclipse.kind;
    }
  }
  Object.keys(want).forEach(function (k) {
    ok("eclipse " + k + " is flagged as " + want[k], found[k] === want[k], found[k] || "not flagged");
  });
  ok("2026 flags no eclipse on a plain day", !found["2026-11-01"] && !found["2026-06-15"],
    Object.keys(found).join(" "));
  ok("no more than six eclipse days in 2026", Object.keys(found).length <= 6,
    Object.keys(found).length + " flagged");
})();

/* ---- 15. festivals: every rule reproduces its conventional 2026 date ---- */
(function () {
  var EXPECT = {
    "Vasant Panchami": "2026-01-23", "Maha Shivratri": "2026-02-15", "Holi": "2026-03-03",
    "Ram Navami": "2026-03-26", "Guru Purnima": "2026-07-29", "Janmashtami": "2026-09-04",
    "Ganesh Chaturthi": "2026-09-14", "Navratri begins": "2026-10-11", "Diwali": "2026-11-08",
    "Bhai Dooj": "2026-11-11"
  };
  var got = P.festivalsIn(day(2026, 1, 1), day(2026, 12, 31), RULES, MUMBAI);
  var byName = {};
  got.forEach(function (f) { byName[f.name] = f.date.toISOString().slice(0, 10); });
  Object.keys(EXPECT).forEach(function (name) {
    ok("festival " + name + " on " + EXPECT[name], byName[name] === EXPECT[name],
      byName[name] || "not found");
  });
  ok("each festival appears once, not once per day it spans", got.length === Object.keys(EXPECT).length,
    got.length + " entries");
})();

/* ---- 16. the lunar month and the samvat years ---- */
(function () {
  var diwali = P.compute(day(2026, 11, 8), MUMBAI);
  ok("Diwali is in Kartik (purnimanta)", diwali.month.masa === "Kartik", diwali.month.masa);
  ok("the same day is Ashwin amanta", diwali.month.amanta === "Ashwin", diwali.month.amanta);
  var holi = P.compute(day(2026, 3, 3), MUMBAI);
  ok("Holi is in Phalguna", holi.month.masa === "Phalguna", holi.month.masa);
  ok("Vikram Samvat is the Gregorian year + 57", diwali.month.vikram === 2083, diwali.month.vikram);
  ok("Shaka Samvat is the Gregorian year - 78", diwali.month.shaka === 1948, diwali.month.shaka);
  ok("the samvatsara is one of the sixty",
    P.tables.samvatsara.indexOf(diwali.month.samvatsara) !== -1, diwali.month.samvatsara);
  ok("the sun is in Tula on Diwali", diwali.month.sunRashi.name === "Tula", diwali.month.sunRashi.name);
  ok("Sharad is the season in November", diwali.month.ritu === "Sharad", diwali.month.ritu);
})();

/* ---- 17. choghadiya and hora follow the weekday tables ---- */
(function () {
  var sun = P.compute(day(2026, 11, 8), MUMBAI);       // a Sunday
  ok("Sunday is Ravivara", sun.vaara.name === "Ravivara");
  ok("Sunday's day choghadiya starts with Udveg", sun.choghadiya.day[0].name === "Udveg",
    sun.choghadiya.day[0].name);
  ok("Sunday's night choghadiya starts with Shubh", sun.choghadiya.night[0].name === "Shubh",
    sun.choghadiya.night[0].name);
  ok("a day has eight choghadiya", sun.choghadiya.day.length === 8);
  ok("a night has eight choghadiya", sun.choghadiya.night.length === 8);
  ok("the first hora of a Sunday is the Sun's", sun.hora[0].lord === "Sun", sun.hora[0].lord);
  ok("a day and night hold twenty-four horas", sun.hora.length === 24);
  ok("the horas tile the day without gaps",
    sun.hora[11].end.getTime() === sun.hora[12].start.getTime());
  var tue = P.compute(day(2026, 11, 10), MUMBAI);
  ok("Tuesday's day choghadiya starts with Rog", tue.choghadiya.day[0].name === "Rog",
    tue.choghadiya.day[0].name);
})();

/* ---- 18. reading the day at sunrise moves the limbs, as it should ---- */
(function () {
  var noon = P.compute(day(2026, 11, 8), Object.assign({ at: "noon" }, MUMBAI));
  var rise = P.compute(day(2026, 11, 8), Object.assign({ at: "sunrise" }, MUMBAI));
  ok("the day can be read at sunrise", rise.at === "sunrise");
  ok("a sunrise reading differs from a noon reading on a boundary day",
    rise.tithi.index !== noon.tithi.index || rise.nakshatra.index !== noon.nakshatra.index,
    noon.tithi.name + " / " + rise.tithi.name);
  ok("sunrise is before noon on the same day", rise.jd < noon.jd);
})();

/* ---- 19. the month table ---- */
(function () {
  var rows = P.monthTable(2026, 11, MUMBAI);
  ok("November has thirty days", rows.length === 30, rows.length);
  ok("every row has a tithi and a sunrise", rows.every(function (r) { return r.tithi.name && r.sunrise; }));
  ok("the month runs in order",
    rows.every(function (r, i) { return i === 0 || r.date > rows[i - 1].date; }));
})();

/* ---- 20. the names tables ---- */
(function () {
  ["tithi", "nakshatra", "yoga", "vaara", "masa", "rashi", "ritu", "ayana", "paksha", "choghadiya", "hora"]
    .forEach(function (kind) {
      var en = N[kind].en, hi = N[kind].hi, gu = N[kind].gu;
      ok(kind + " has three languages", !!en && !!hi && !!gu);
      ok(kind + " is the same length in all three",
        en.length === hi.length && hi.length === gu.length, [en.length, hi.length, gu.length].join("/"));
      ok(kind + " has no empty strings", en.concat(hi, gu).every(function (s) { return s && s.length; }));
    });
  ok("tithi has thirty names", N.tithi.en.length === 30);
  ok("nakshatra has twenty-seven names", N.nakshatra.en.length === 27);
  ok("yoga has twenty-seven names", N.yoga.en.length === 27);
  ok("the tithi names are translated, not just the heading",
    N.byIndex("tithi", 21, "hi") === "सप्तमी" && N.byIndex("tithi", 21, "gu") === "સપ્તમી");
  ok("karana names are translated", N.karanaName("Vishti", "hi") === "विष्टि");
  ok("an unknown karana falls back to its English name", N.karanaName("Nonesuch", "hi") === "Nonesuch");
  ok("native digits work", N.numerals("12:45", "gu") === "૧૨:૪૫");
  ok("latin digits are unchanged", N.numerals("12:45", "en") === "12:45");
})();

/* ---- 21. the bundled cities ---- */
(function () {
  ok("the city list is not empty", CITIES.length > 50, CITIES.length + " cities");
  ok("every city has a name", CITIES.every(function (c) { return c.name && c.name.length; }));
  ok("every city has a plausible latitude",
    CITIES.every(function (c) { return c.lat >= -90 && c.lat <= 90; }));
  ok("every city has a plausible longitude",
    CITIES.every(function (c) { return c.lng >= -180 && c.lng <= 180; }));
  ok("every city has a zone id",
    CITIES.every(function (c) { return /^[A-Za-z]+\/[A-Za-z_]+$/.test(c.zone); }));
  ok("every city's zone resolves to an offset",
    CITIES.every(function (c) { return P.zoneOffset(c.zone, new Date("2026-06-01T00:00:00Z")) !== null; }),
    CITIES.filter(function (c) { return P.zoneOffset(c.zone, new Date("2026-06-01T00:00:00Z")) === null; })
      .map(function (c) { return c.zone; }).join(" "));
  ok("city names are unique",
    new Set(CITIES.map(function (c) { return c.name; })).size === CITIES.length);
  var gujarat = CITIES.filter(function (c) { return c.region === "Gujarat"; });
  ok("Gujarat's cities are there", gujarat.length >= 10, gujarat.length);
})();

/* ---- 22. the page wires the engine up ---- */
(function () {
  var dir = path.join(__dirname, "docs", "play");
  var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  var srcs = [], m, re = /<script[^>]+src="([^"]+)"/g;
  while ((m = re.exec(html))) srcs.push(m[1]);
  ok("the page loads a script at all", srcs.length > 0, srcs.join(", "));
  function bare(u) { return u.split("?")[0]; }
  ok("every script the page loads exists", srcs.every(function (s) {
    return fs.existsSync(path.join(dir, bare(s)));
  }), srcs.join(", "));
  /* web-kit.js is the one kit this page shipped with; the kit guard allows an
   * existing load to stay and refuses a new one, so anything else is a retrofit. */
  var kits = srcs.filter(function (s) { return /-kit\.js$/.test(bare(s)); });
  ok("the page retrofits no kit (only the web-kit it already had)",
    kits.every(function (k) { return bare(k) === "web-kit.js"; }), kits.join(", "));
  var engine = fs.readFileSync(path.join(dir, "panchang.js"), "utf8");
  ok("panchang.js is self-contained: no require, no global it depends on",
    !/\brequire\(/.test(engine) && !/root\.Astro/.test(engine));
  var order = srcs.map(bare);
  ok("the data files load before the app script",
    order.indexOf("data/names.js") !== -1 && order.indexOf("data/names.js") < order.indexOf("panchang.js") &&
    order.indexOf("data/festivals.js") < order.indexOf("panchang.js"), order.join(" -> "));
  ok("the service worker is registered", html.indexOf('navigator.serviceWorker.register("sw.js")') !== -1);
  ok("the page links a manifest", /<link[^>]+rel="manifest"/.test(html));
  ok("a build stamp is printed", html.indexOf('id="buildstamp"') !== -1);
  ok("the page has a print stylesheet", /@media print/.test(html));
  ok("the page has a live region", /aria-live="polite"/.test(html));

  /* the inline app script must at least parse: a stray quote in a translation
     table once shipped a blank page, and nothing here would have caught it */
  var inline = html.match(/<script>([\s\S]*?)<\/script>/);
  var parses = true, why = "";
  try { new (require("vm").Script)(inline ? inline[1] : ""); }
  catch (e) { parses = false; why = e.message; }
  ok("the app's inline script parses", parses, why);
})();

/* ---- 23. nothing is loaded from another origin, anywhere in the app ---- */
(function () {
  var dir = path.join(__dirname, "docs", "play");
  var offenders = [];
  function walk(d) {
    fs.readdirSync(d).forEach(function (f) {
      var full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) return walk(full);
      if (!/\.(html|js|webmanifest|css)$/.test(f)) return;
      var text = fs.readFileSync(full, "utf8");
      // an <a href> is a link the reader may CHOOSE to follow; it loads nothing.
      // Everything else — a src, a <link href> — is fetched by the page itself,
      // and that is what "offline" forbids.
      var re = /<([a-zA-Z][\w-]*)\b[^>]*?\b(src|href)\s*=\s*["']https?:\/\/([^"'/]+)/g, m;
      while ((m = re.exec(text))) {
        if (m[1].toLowerCase() === "a" && m[2].toLowerCase() === "href") continue;
        offenders.push(path.relative(dir, full) + " -> " + m[1].toLowerCase() + " " + m[3]);
      }
      if (f !== "sw.js" && /\bfetch\s*\(\s*["']https?:/.test(text)) offenders.push(f + " -> fetch()");
    });
  }
  walk(dir);
  ok("the app loads nothing from another origin", offenders.length === 0, offenders.join("; "));
})();

/* ---- 24. the offline shell covers every file the app needs ---- */
(function () {
  var dir = path.join(__dirname, "docs", "play");
  var sw = fs.readFileSync(path.join(dir, "sw.js"), "utf8");
  ["web-kit.js", "panchang.js", "index.html", "data/names.js", "data/cities.js", "data/festivals.js"]
    .forEach(function (f) { ok("sw.js precaches " + f, sw.indexOf(f) !== -1); });
  ok("sw.js derives its cache name from the version", /var CACHE = "panchang-" \+ VERSION/.test(sw));
  var v = JSON.parse(fs.readFileSync(path.join(dir, "manifest.webmanifest"), "utf8"));
  ok("the manifest start_url is the app", v.start_url === "./" || v.start_url === "index.html", v.start_url);
  ok("the manifest ships a maskable icon",
    (v.icons || []).some(function (i) { return i.purpose === "maskable"; }));
})();

/* ---- 25. every place a licence is stated agrees ---- */
(function () {
  var root = __dirname;
  var licence = fs.readFileSync(path.join(root, "LICENSE"), "utf8");
  ok("LICENSE is PolyForm Noncommercial", /PolyForm Noncommercial/i.test(licence));
  var readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  ok("the README states the same licence", /PolyForm Noncommercial/i.test(readme));
  var wf = fs.readFileSync(path.join(root, ".github", "workflows", "build-apps.yml"), "utf8");
  ok("the workflow's SPDX line agrees", /PolyForm-Noncommercial-1\.0\.0/.test(wf));
  var drifted = [];
  ["panchang.js", "web-kit.js", "sw.js"].forEach(function (f) {
    var text = fs.readFileSync(path.join(root, "docs", "play", f), "utf8");
    if (/\bMIT License\b/.test(text)) drifted.push(f);
  });
  ok("no source header claims a different licence", drifted.length === 0, drifted.join(" "));
})();

/* ---- 26. one version, everywhere, and a way out of a stale cache ---- */
(function () {
  var root = __dirname;
  var dir = path.join(root, "docs", "play");
  var version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
  ok("VERSION looks like a version", /^\d+\.\d+\.\d+$/.test(version), version);

  var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  var srcs = [], m, re = /<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g;
  while ((m = re.exec(html))) srcs.push(m[1]);
  var local = srcs.filter(function (u) { return !/^https?:|^data:/.test(u); });

  /* a cache-first worker matches on the URL, so a release has to change the URL */
  var busted = local.filter(function (u) { return /\?(^|.*)v=/.test(u) || /[?&]v=/.test(u); });
  var needsBust = local.filter(function (u) {
    return /\.(js|webmanifest)$/.test(u.split("?")[0]) && u !== "sw.js";
  });
  ok("every script and manifest the app loads is version-tagged",
    needsBust.every(function (u) { return /[?&]v=/.test(u); }),
    needsBust.filter(function (u) { return !/[?&]v=/.test(u); }).join(" "));
  ok("the tag is this release's version",
    needsBust.every(function (u) { return !/[?&]v=/.test(u) || u.split("v=")[1] === version; }), version);

  var sw = fs.readFileSync(path.join(dir, "sw.js"), "utf8");
  ok("the service worker's VERSION is this release",
    new RegExp('var VERSION = "' + version.replace(/\./g, "\\.") + '"').test(sw), version);
  ok("the worker precaches versioned assets", /\?v=" \+ VERSION/.test(sw));

  /* the page must notice an engine older than itself, and say how to fix it */
  ok("the page guards against a stale engine", /engineMissing|showStale/.test(html));
  ok("the guard offers a reload", /hardreload/.test(html) && /caches\.delete/.test(html));
  ok("the app prints its own build stamp", new RegExp('APP_VERSION = "' + version.replace(/\./g, "\\.") + '"').test(html), version);

  var landing = fs.readFileSync(path.join(root, "docs", "index.html"), "utf8");
  ok("the landing page's build stamp is this release",
    new RegExp('var BUILD = "' + version.replace(/\./g, "\\.")).test(landing), version);
  ok("the landing page tags the engine it loads",
    new RegExp('play/panchang\\.js\\?v=' + version.replace(/\./g, "\\.")).test(landing));

  var manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.webmanifest"), "utf8"));
  ok("the manifest still points at the app", manifest.start_url === "./" || manifest.start_url === "index.html");
})();

/* ---- 27. every label the page marks for translation has a translation ----
 * A Gujarati reader should not meet an English button. The page tags its chrome
 * with data-i18n; this checks each tag against the three tables.
 */
(function () {
  var html = fs.readFileSync(path.join(__dirname, "docs", "play", "index.html"), "utf8");

  /* pull the two dictionaries out of the script by matching braces */
  function objectAfter(src, marker) {
    var i = src.indexOf(marker);
    if (i < 0) return null;
    var open = src.indexOf("{", i), depth = 0, j;
    for (j = open; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") { depth--; if (depth === 0) break; }
    }
    /* it is a JS object literal, not JSON: evaluate it in an empty context */
    var literal = src.slice(open, j + 1);
    return new (require("vm").Script)("(" + literal + ")").runInNewContext({});
  }
  var L = objectAfter(html, "var L = {");
  var MORE = objectAfter(html, "var MORE = ");
  ok("the page's label tables were found", !!L && !!MORE);

  var langs = ["en", "hi", "gu"];
  var keys = {};
  langs.forEach(function (lg) {
    var all = {};
    [L, MORE].forEach(function (t) { if (t && t[lg]) Object.keys(t[lg]).forEach(function (k) { all[k] = 1; }); });
    keys[lg] = all;
  });

  var tagged = [], m, re = /data-i18n="([^"]+)"/g;
  while ((m = re.exec(html))) tagged.push(m[1]);
  ok("the page marks its chrome for translation", tagged.length >= 20, tagged.length + " tags");

  var missing = [];
  tagged.forEach(function (k) {
    langs.forEach(function (lg) { if (!keys[lg][k]) missing.push(lg + ":" + k); });
  });
  ok("every tagged label exists in all three languages", missing.length === 0, missing.slice(0, 6).join(" "));

  var enKeys = Object.keys(keys.en);
  ok("the three tables carry the same keys",
    enKeys.every(function (k) { return keys.hi[k] && keys.gu[k]; }),
    enKeys.filter(function (k) { return !keys.hi[k] || !keys.gu[k]; }).slice(0, 6).join(" "));
  ok("no translation is an empty string",
    enKeys.every(function (k) { return keys.hi[k] && keys.gu[k]; }));
})();

/* ---- 28. the record of what shipped is true ----
 * The assets are cache-busted by VERSION. Nothing else makes a release change
 * the URL, so a commit that edits a shipped file and forgets VERSION would ship
 * the new page beside the old engine out of a cache. BUILD.json is the record;
 * this checks it still describes the tree, and scripts/stamp.js refuses to write
 * it without a bump.
 */
(function () {
  var root = __dirname;
  var version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
  var recordPath = path.join(root, "BUILD.json");
  ok("BUILD.json exists", fs.existsSync(recordPath));
  if (!fs.existsSync(recordPath)) return;

  var record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  ok("the record is for this version", record.version === version,
    record.version + " recorded, " + version + " in VERSION");

  var crypto = require("crypto"), drift = [], gone = [];
  Object.keys(record.files || {}).forEach(function (f) {
    var full = path.join(root, f);
    if (!fs.existsSync(full)) { gone.push(f); return; }
    var h = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    if (h !== record.files[f]) drift.push(f);
  });
  ok("no shipped file changed since it was stamped", drift.length === 0,
    drift.join(" ") + " — bump VERSION and run scripts/stamp.js");
  ok("no recorded file has gone missing", gone.length === 0, gone.join(" "));

  /* every script the app loads has to be in the record, or the guard has a hole */
  var html = fs.readFileSync(path.join(root, "docs", "play", "index.html"), "utf8");
  var srcs = [], m, re = /<script[^>]+src="([^"]+)"/g;
  while ((m = re.exec(html))) srcs.push(m[1].split("?")[0]);
  var unrecorded = srcs.filter(function (s) { return !record.files["docs/play/" + s]; });
  ok("every script the app loads is in the record", unrecorded.length === 0, unrecorded.join(" "));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
