#!/usr/bin/env python3
"""Screenshot this repo's landing page and app with headless Chromium.

The landing page embeds the app in a same-origin iframe. From `file://` that
iframe does not paint in headless Chromium, so the shot would show an empty
box (or, worse, the poster behind it and look fine while proving nothing).
This serves the repo over a throwaway local HTTP server instead — the same
same-origin situation as GitHub Pages — and shuts it down afterwards.

  python3 scripts/shot.py app        # -> docs/assets/app-desktop.png, app-mobile.png
  python3 scripts/shot.py landing    # -> docs/assets/landing-desktop.png, landing-mobile.png
  python3 scripts/shot.py all

Take the app shot first: the landing page uses it as the poster behind the frame.
"""
import functools
import http.server
import os
import shutil
import subprocess
import sys
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "docs", "assets")

TARGETS = {
    # name, path, width, height, virtual time budget (ms)
    "app-desktop": ("/docs/play/index.html#d=2026-11-08", 1280, 1500, 5000),
    "app-mobile": ("/docs/play/index.html#d=2026-11-08", 430, 860, 5000),
    "landing-desktop": ("/docs/index.html", 1280, 1900, 9000),
    "landing-mobile": ("/docs/index.html", 430, 1250, 9000),
}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    handler = functools.partial(Quiet, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def chrome():
    for name in ("chromium", "chromium-browser", "google-chrome"):
        path = shutil.which(name)
        if path:
            return path
    sys.exit("no chromium on PATH")


def shot(browser, port, name):
    path, w, h, budget = TARGETS[name]
    out = os.path.join(ASSETS, name + ".png")
    cmd = [
        browser, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
        "--no-proxy-server", "--force-device-scale-factor=1",
        "--virtual-time-budget=%d" % budget,
        "--window-size=%d,%d" % (w, h),
        "--screenshot=" + out,
        "http://127.0.0.1:%d%s" % (port, path),
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    if not os.path.exists(out):
        sys.exit("chromium wrote nothing for " + name)
    print("wrote docs/assets/%s.png (%d bytes)" % (name, os.path.getsize(out)))


def main():
    want = (sys.argv[1] if len(sys.argv) > 1 else "all").lower()
    if want not in ("app", "landing", "all"):
        sys.exit("usage: shot.py [app|landing|all]")
    os.makedirs(ASSETS, exist_ok=True)
    httpd, port = serve()
    try:
        browser = chrome()
        if want in ("app", "all"):
            shot(browser, port, "app-desktop")
            shot(browser, port, "app-mobile")
        if want in ("landing", "all"):
            shot(browser, port, "landing-desktop")
            shot(browser, port, "landing-mobile")
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
