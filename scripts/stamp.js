#!/usr/bin/env node
/* stamp.js — record what shipped, and refuse a stale version tag.
 *
 * The assets are cache-busted with ?v=<VERSION>, which only works if VERSION
 * changes whenever a shipped file does. Nothing enforced that: a commit could
 * edit panchang.js, leave VERSION alone, and pass every test — and then a
 * returning reader would get the new HTML beside the old engine, which is the
 * frozen page 0.2.1 was about.
 *
 * So: this records the SHA-256 of every file the browser can fetch, and if one
 * of them has changed while VERSION has not, it refuses to write and says so.
 *
 *   node scripts/stamp.js          # after a VERSION bump
 *   node scripts/stamp.js --check  # verify only; exit 1 if the record is stale
 *
 * BUILD.json is committed, and test-node.js checks it, so CI refuses the same
 * thing this does.
 */
"use strict";
var fs = require("fs"), path = require("path"), crypto = require("crypto");

var ROOT = path.dirname(__dirname);
var OUT = path.join(ROOT, "BUILD.json");
var VERSION = fs.readFileSync(path.join(ROOT, "VERSION"), "utf8").trim();
var CHECK = process.argv.indexOf("--check") !== -1;

/* everything a reader's browser can fetch, in a stable order, from the repo root */
var SHIPPED = [
  "docs/index.html",
  "docs/play/index.html",
  "docs/play/web-kit.js",
  "docs/play/panchang.js",
  "docs/play/data/names.js",
  "docs/play/data/cities.js",
  "docs/play/data/festivals.js",
  "docs/play/sw.js",
  "docs/play/manifest.webmanifest",
  "docs/play/icon.svg",
  "docs/play/icon-192.png",
  "docs/play/icon-512.png",
  "docs/play/icon-maskable-512.png",
  "docs/play/icon-adaptive-fg-432.png",
  "docs/play/icon-adaptive-bg-432.png",
  "docs/play/icon.ico"
];

function current() {
  var out = {};
  SHIPPED.forEach(function (f) {
    var full = path.join(ROOT, f);
    if (!fs.existsSync(full)) return;
    out[f] = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  });
  return out;
}

var files = current();
var previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
var recorded = previous && previous.files ? previous.files : null;

/* ---- --check: is the record still true? ---- */
if (CHECK) {
  var bad = 0;
  if (!previous) { console.log("FAIL no BUILD.json — run node scripts/stamp.js"); process.exit(1); }
  if (previous.version !== VERSION) {
    console.log("FAIL BUILD.json is for " + previous.version + " but VERSION is " + VERSION);
    bad++;
  }
  Object.keys(files).forEach(function (f) {
    if (!recorded[f]) { console.log("FAIL " + f + " is shipped but not recorded"); bad++; }
    else if (recorded[f] !== files[f]) { console.log("FAIL " + f + " changed since the record was written"); bad++; }
  });
  Object.keys(recorded || {}).forEach(function (f) {
    if (!files[f]) { console.log("FAIL " + f + " is recorded but no longer shipped"); bad++; }
  });
  console.log(bad ? bad + " problem(s)" : "BUILD.json is current for " + VERSION);
  process.exit(bad ? 1 : 0);
}

/* ---- the guard: assets changed, version did not ---- */
if (previous && previous.version === VERSION) {
  var changed = [], added = [], removed = [];
  Object.keys(files).forEach(function (f) {
    if (!recorded[f]) added.push(f);
    else if (recorded[f] !== files[f]) changed.push(f);
  });
  Object.keys(recorded || {}).forEach(function (f) { if (!files[f]) removed.push(f); });
  if (changed.length || added.length || removed.length) {
    console.error("REFUSED — shipped files changed but VERSION is still " + VERSION + ".");
    if (changed.length) console.error("  changed: " + changed.join(", "));
    if (added.length) console.error("  added:   " + added.join(", "));
    if (removed.length) console.error("  removed: " + removed.join(", "));
    console.error("");
    console.error("The assets are cache-busted by VERSION, so a release that changes one");
    console.error("of them must change VERSION too — otherwise a returning reader gets the");
    console.error("new page beside the old engine, which is the bug 0.2.1 fixed.");
    console.error("");
    console.error("  bump VERSION, then run this again.");
    process.exit(1);
  }
}

fs.writeFileSync(OUT, JSON.stringify({
  version: VERSION,
  generated: new Date().toISOString().slice(0, 10),
  note: "SHA-256 of every file the app serves. Written by scripts/stamp.js; checked by test-node.js.",
  files: files
}, null, 2) + "\n");
console.log("stamped " + VERSION + " — " + Object.keys(files).length + " files recorded in BUILD.json");
