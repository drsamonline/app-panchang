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

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
