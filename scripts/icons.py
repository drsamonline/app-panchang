#!/usr/bin/env python3
"""Render every icon this app needs from the one SVG master.

docs/play/icon.svg is the source of truth. Hand-made PNGs drift from it, so
nothing here is drawn twice: Chromium renders the SVG at each size and Pillow
packs the Windows .ico and the Android adaptive layers.

  python3 scripts/icons.py

Writes into docs/play/:
  icon-192.png  icon-512.png  icon-maskable-512.png  icon.ico
  icon-adaptive-fg-432.png  icon-adaptive-bg-432.png
"""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAY = os.path.join(ROOT, "docs", "play")
SVG = os.path.join(PLAY, "icon.svg")
BRAND = "#ea580c"

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{margin:0;padding:0;width:{size}px;height:{size}px;background:{bg};overflow:hidden}}
.wrap{{width:{size}px;height:{size}px;display:grid;place-items:center}}
svg{{display:block;width:{inner}px;height:{inner}px}}
</style></head><body><div class="wrap">{svg}</div></body></html>"""


def chrome():
    for name in ("chromium", "chromium-browser", "google-chrome"):
        found = shutil.which(name)
        if found:
            return found
    sys.exit("no chromium on PATH")


def render(browser, svg, size, inner, bg, out):
    html = PAGE.format(size=size, inner=inner, bg=bg, svg=svg)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as fh:
        fh.write(html)
        page = fh.name
    subprocess.run([browser, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    "--default-background-color=00000000", "--force-device-scale-factor=1",
                    "--virtual-time-budget=3000", "--window-size=%d,%d" % (size, size),
                    "--screenshot=" + out, "file://" + page],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    os.unlink(page)
    if not os.path.exists(out):
        sys.exit("chromium wrote nothing for " + out)
    print("wrote docs/play/%s (%d bytes)" % (os.path.basename(out), os.path.getsize(out)))


def main():
    from PIL import Image
    svg = open(SVG, encoding="utf-8").read()
    browser = chrome()

    render(browser, svg, 192, 192, "transparent", os.path.join(PLAY, "icon-192.png"))
    render(browser, svg, 512, 512, "transparent", os.path.join(PLAY, "icon-512.png"))
    # maskable: the mark inside the 80% safe zone, on the brand colour
    render(browser, svg, 512, 320, BRAND, os.path.join(PLAY, "icon-maskable-512.png"))
    # Android adaptive: a transparent foreground and a flat background
    render(browser, svg, 432, 288, "transparent", os.path.join(PLAY, "icon-adaptive-fg-432.png"))
    render(browser, "", 432, 0, BRAND, os.path.join(PLAY, "icon-adaptive-bg-432.png"))

    # Windows wants a real .ico with several sizes inside it
    big = Image.open(os.path.join(PLAY, "icon-512.png")).convert("RGBA")
    big.save(os.path.join(PLAY, "icon.ico"),
             sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("wrote docs/play/icon.ico (%d bytes)" % os.path.getsize(os.path.join(PLAY, "icon.ico")))


if __name__ == "__main__":
    main()
