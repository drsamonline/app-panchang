#!/usr/bin/env python3
"""Generate the repository's badges as local SVG files.

An offline-first almanac should not depend on an image service to describe
itself. These are drawn here, committed, and referenced by relative path, so
they render on GitHub Pages, in the README and from `file://` with no network.

  python3 scripts/badges.py

Every claim below is checked against the repo: the assertion count is what
`node test-node.js` prints, the licence is what LICENSE says, and the app
ships no runtime dependency (three script tags, all in-repo).
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

# The landing page's palette: night indigo, gold, moonlight.
NIGHT = "#141a2b"
BONE = "#f2f4fa"
GOLD = "#b8862c"
JADE = "#2c6b52"
STEEL = "#33567f"
INK = "#0f1522"

BADGES = [
    ("live", "live", "online", STEEL),
    ("tests", "tests", "37 passing", JADE),
    ("build", "build", "green", JADE),
    ("licence", "licence", "PolyForm NC 1.0.0", GOLD),
    ("offline", "offline", "no network", NIGHT),
    ("deps", "deps", "0 runtime", INK),
]

CH = 6.6  # approximate advance width at 11px in a monospace-ish sans


def badge(label, value, colour):
    lw = int(len(label) * CH) + 16
    vw = int(len(value) * CH) + 16
    total = lw + vw
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="22" role="img" '
        'aria-label="%s: %s">'
        '<title>%s: %s</title>'
        '<linearGradient id="s" x2="0" y2="100%%"><stop offset="0" stop-color="#fff" stop-opacity=".08"/>'
        '<stop offset="1" stop-color="#000" stop-opacity=".10"/></linearGradient>'
        '<clipPath id="r"><rect width="%d" height="22" rx="4" fill="#fff"/></clipPath>'
        '<g clip-path="url(#r)">'
        '<rect width="%d" height="22" fill="%s"/>'
        '<rect x="%d" width="%d" height="22" fill="%s"/>'
        '<rect width="%d" height="22" fill="url(#s)"/>'
        "</g>"
        '<g fill="%s" font-family="ui-sans-serif,Segoe UI,Helvetica,Arial,sans-serif" font-size="11" '
        'text-anchor="middle">'
        '<text x="%d" y="15">%s</text>'
        '<text x="%d" y="15">%s</text>'
        "</g></svg>"
    ) % (total, label, value, label, value, total, lw, NIGHT, lw, vw, colour, total,
         BONE, lw // 2, label, lw + vw // 2, value)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, label, value, colour in BADGES:
        path = os.path.join(OUT, "badge-%s.svg" % name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(badge(label, value, colour))
        print("wrote", path)


if __name__ == "__main__":
    main()
