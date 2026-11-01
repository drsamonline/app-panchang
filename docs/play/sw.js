/* sw.js — offline for the Panchang app.
 *
 * The HTML is NETWORK-FIRST: the cache is only the offline fallback. A
 * cache-first document hides every release, because a returning reader keeps
 * getting the old page and the cache name never changes. Assets are
 * cache-first with a background refresh, which is safe — a changed asset
 * arrives with a changed build.
 *
 * BUMP `VERSION` on every release - it drives both the cache name and the
 * query on every asset, so a stale entry cannot be matched by a new page. The
 * app prints its build stamp in the footer, and shows a banner if the engine it
 * loaded is older than the page, so "am I on the new one?" is answerable.
 */
"use strict";

var VERSION = "0.2.2";
var CACHE = "panchang-" + VERSION;
var ASSETS = [
  "./",
  "./index.html",
  "./web-kit.js?v=" + VERSION,
  "./panchang.js?v=" + VERSION,
  "./data/names.js?v=" + VERSION,
  "./data/cities.js?v=" + VERSION,
  "./data/festivals.js?v=" + VERSION,
  "./manifest.webmanifest?v=" + VERSION,
  "./icon.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS.map(function (u) { return new Request(u, { cache: "reload" }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // nothing external, ever

  var isDoc = req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") >= 0;

  if (isDoc) {
    /* network-first: fresh page when online, the cached page when not */
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* cache-first, refreshed in the background */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
