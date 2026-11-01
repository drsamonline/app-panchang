/* offline-check.js — does the app actually render with no network?
 *
 * test-node.js proves nothing is *loaded* from another origin; it does not
 * prove the app *works* without a connection. This runs the page in Chromium
 * with every host resolving to nothing, then reads the DOM back and looks for
 * the day's tithi. No dependency: the browser does the work and --dump-dom
 * prints the result.
 *
 *   node scripts/offline-check.js
 */
"use strict";
var fs = require("fs"), path = require("path"), os = require("os");
var child = require("child_process");

var ROOT = path.dirname(__dirname);
var PAGE = path.join(ROOT, "docs", "play", "index.html");

function chrome() {
  var names = ["chromium", "chromium-browser", "google-chrome"];
  for (var i = 0; i < names.length; i++) {
    try {
      var p = child.execSync("command -v " + names[i], { stdio: ["ignore", "pipe", "ignore"] })
        .toString().trim();
      if (p) return p;
    } catch (e) { /* not installed */ }
  }
  return null;
}

var browser = chrome();
if (!browser) {
  console.log("SKIP offline render check: no chromium on this machine");
  process.exit(0);
}

/* every host fails to resolve: nothing can be fetched, including our own */
var out = child.execSync(
  '"' + browser + '" --headless --no-sandbox --disable-gpu --hide-scrollbars ' +
  '--host-resolver-rules="MAP * ~NOTFOUND" --virtual-time-budget=6000 --dump-dom "file://' + PAGE + '"',
  { encoding: "utf8", timeout: 120000, maxBuffer: 32 * 1024 * 1024 });

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "  (" + extra + ")" : "")); }
}

/* the hero holds "<paksha> <tithi>"; an empty day leaves it as an em dash */
var hero = (out.match(/id="hero"[^>]*>([^<]*)</) || [])[1] || "";
ok("the page rendered its hero with no network", hero.length > 3 && hero !== "—", JSON.stringify(hero));

var limbs = (out.match(/id="limbs"[\s\S]{0,4000}?<\/section>/) || [out])[0];
ok("the five limbs rendered", /class="v"/.test(out) && out.indexOf('id="limbs"') !== -1);
ok("a sunrise time rendered", /\d{2}:\d{2}/.test(out));
ok("the build stamp rendered", /build \d+\.\d+\.\d+/.test(out));
ok("no script error was recorded", out.indexOf("__bootError") === -1 || out.indexOf("__bootError") === undefined);
ok("the data files loaded (a city name is in the DOM)",
  out.indexOf("Mumbai") !== -1 || out.indexOf("Delhi") !== -1);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
