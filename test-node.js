/* test-node.js — headless tests for the Panchang engine.
 * Run: node test-node.js
 * Reference values for the Sun/Moon were cross-checked against an independent
 * ephemeris (PyEphem); elongations agree to better than 0.05°.
 */
"use strict";
var P = require("./docs/play/panchang.js");

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "  (" + extra + ")" : "")); }
}
function near(a, b, tol) { return Math.abs(a - b) <= tol; }
function angNear(a, b, tol) { var d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) <= tol; }

function jdOf(iso) { return new Date(iso).getTime() / 86400000 + 2440587.5; }

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
  var e = (P.moonLongitude(jd) - P.sunLongitude(jd) + 360) % 360;
  ok("elongation " + r[0] + " ~ " + r[1], angNear(e, r[1], 0.1), e.toFixed(3));
});

/* ---- 2. sun longitude at the March equinox is ~0° ---- */
(function () {
  var jd = jdOf("2026-03-20T14:46:00Z"); // equinox instant
  ok("sun ~0° at the equinox", angNear(P.sunLongitude(jd), 0, 1.0), P.sunLongitude(jd).toFixed(3));
})();

/* ---- 3. sunrise / sunset for Mumbai on 2026-10-23 (vs ephemeris) ---- */
(function () {
  var st = P.sunTimes(new Date(Date.UTC(2026, 9, 23, 6, 30)), 19.0760, 72.8777);
  var rise = st.sunrise.toISOString(), set = st.sunset.toISOString();
  ok("Mumbai sunrise ~01:02Z", near(new Date(rise).getTime(), Date.parse("2026-10-23T01:02:09Z"), 6 * 60000), rise);
  ok("Mumbai sunset ~12:43Z", near(new Date(set).getTime(), Date.parse("2026-10-23T12:43:39Z"), 6 * 60000), set);
})();

/* ---- 4. named festivals land on the right lunar day ---- */
(function () {
  var holi = P.compute(new Date(2026, 2, 3), { lat: 19.076, lng: 72.8777, tz: 5.5 });
  ok("Holi (Phalguna Purnima) 2026-03-03 is Purnima", holi.tithi.name === "Purnima" && holi.tithi.paksha === "Shukla");
  var diwali = P.compute(new Date(2026, 10, 8), { lat: 19.076, lng: 72.8777, tz: 5.5 });
  ok("Diwali (Kartik Amavasya) 2026-11-08 is Amavasya", diwali.tithi.name === "Amavasya" && diwali.tithi.paksha === "Krishna");
})();

/* ---- 5. structure of a full day's panchang ---- */
(function () {
  var p = P.compute(new Date(2026, 9, 23), { lat: 19.076, lng: 72.8777, tz: 5.5 });
  ok("vaara is a known name", P.tables.vaara.indexOf(p.vaara.name) !== -1, p.vaara.name);
  ok("tithi index 0..29", p.tithi.index >= 0 && p.tithi.index <= 29);
  ok("nakshatra index 0..26", p.nakshatra.index >= 0 && p.nakshatra.index <= 26);
  ok("yoga index 0..26", p.yoga.index >= 0 && p.yoga.index <= 26);
  ok("karana index 0..59", p.karana.index >= 0 && p.karana.index <= 59);
  ok("rahu-kaal inside the day", p.rahuKaal.start > p.sunrise && p.rahuKaal.end < p.sunset);
  ok("paksha matches tithi", (p.tithi.index < 15) === (p.tithi.paksha === "Shukla"));
})();

/* ---- 6. karana name table wraps correctly ---- */
(function () {
  ok("karana 0 is Kimstughna", P.karanaName(0) === "Kimstughna");
  ok("karana 1 is Bava", P.karanaName(1) === "Bava");
  ok("karana 57 is Shakuni", P.karanaName(57) === "Shakuni");
  ok("karana 59 is Naga", P.karanaName(59) === "Naga");
})();

/* ---- 7. muhurat finder returns sane results ---- */
(function () {
  var m = P.findMuhurat(new Date(2026, 9, 24), { lat: 19.076, lng: 72.8777, tz: 5.5, count: 4 });
  ok("muhurat finder finds some windows", m.length > 0, m.length + " found");
  ok("muhurat dates are in the future", m.every(function (x) { return x.date >= new Date(2026, 9, 24); }));
})();


/* ---- 8. the page actually wires the engine up ----
 * This is the bug that shipped once: the astronomy was split out of panchang.js
 * into a kit and the script tag was never added, so panchang.js threw on load and
 * the app rendered an empty day. A test on the page, not just the engine, catches
 * it - and the estate's kit guard forbids fixing that by retrofitting the kit back
 * into an existing page, so the core is inline and the page loads only its own
 * scripts. */
(function () {
  var fs = require("fs"), path = require("path");
  var dir = path.join(__dirname, "docs", "play");
  var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  var srcs = [], m, re = /<script[^>]+src="([^"]+)"/g;
  while ((m = re.exec(html))) srcs.push(m[1]);
  ok("the page loads a script at all", srcs.length > 0, srcs.join(", "));
  ok("every script the page loads exists", srcs.every(function (s) {
    return fs.existsSync(path.join(dir, s));
  }), srcs.join(", "));
  /* web-kit.js is the one kit this page shipped with; the kit guard allows an
   * existing load to stay and refuses a new one, so anything else is a retrofit. */
  var kits = srcs.filter(function (s) { return /-kit\.js$/.test(s); });
  ok("the page retrofits no kit (only the web-kit it already had)",
    kits.every(function (k) { return k === "web-kit.js"; }), kits.join(", "));
  ok("panchang.js is self-contained: no kit, no require, no global it depends on",
    /\brequire\(/.test(require("fs").readFileSync(path.join(dir, "panchang.js"), "utf8")) === false &&
    /root\.Astro/.test(require("fs").readFileSync(path.join(dir, "panchang.js"), "utf8")) === false);
  ok("the service worker is registered", html.indexOf('navigator.serviceWorker.register("sw.js")') !== -1);
  ok("the page links a manifest", /<link[^>]+rel="manifest"/.test(html));
  ok("a build stamp is printed", html.indexOf('id="buildstamp"') !== -1);
})();

/* ---- 9. nothing is loaded from another origin ----
 * The promise is "no network at runtime". A stray CDN font or an external
 * badge would break it silently, so the shipped app is scanned for one. */
(function () {
  var fs = require("fs"), path = require("path");
  var dir = path.join(__dirname, "docs", "play");
  var offenders = [];
  fs.readdirSync(dir).forEach(function (f) {
    if (!/\.(html|js|webmanifest|css)$/.test(f)) return;
    var text = fs.readFileSync(path.join(dir, f), "utf8");
    var re = /(?:src|href)\s*=\s*["']https?:\/\/([^"'/]+)/g, m;
    while ((m = re.exec(text))) offenders.push(f + " -> " + m[1]);
    if (f !== "sw.js" && /\bfetch\s*\(\s*["']https?:/.test(text)) offenders.push(f + " -> fetch()");
  });
  ok("the app loads nothing from another origin", offenders.length === 0, offenders.join("; "));
})();

/* ---- 10. the offline shell covers every file the app needs ---- */
(function () {
  var fs = require("fs"), path = require("path");
  var dir = path.join(__dirname, "docs", "play");
  var sw = fs.readFileSync(path.join(dir, "sw.js"), "utf8");
  ["web-kit.js", "panchang.js", "index.html"].forEach(function (f) {
    ok("sw.js precaches " + f, sw.indexOf(f) !== -1);
  });
  var v = JSON.parse(fs.readFileSync(path.join(dir, "manifest.webmanifest"), "utf8"));
  ok("the manifest start_url is the app", v.start_url === "./" || v.start_url === "index.html", v.start_url);
  ok("the manifest ships a maskable icon",
    (v.icons || []).some(function (i) { return i.purpose === "maskable"; }));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
