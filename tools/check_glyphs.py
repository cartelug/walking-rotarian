"""Checks that every character shown on the site exists in the supplied fonts.
Headings must be covered by MTN Brighter Sans Bold. Everything else by Sky Text.
Run:  python3 -I tools/check_glyphs.py"""
import glob
import html
import os
import re
import sys
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fonts = os.path.join(ROOT, "src", "assets", "fonts")
cm = {n: set(TTFont(os.path.join(fonts, n + ".woff2")).getBestCmap()) for n in ("SkyText-Regular", "SkyText-Bold", "MTNBrighterSans-Bold")}

head_chars, body_chars = set(), set()
for p in glob.glob(os.path.join(ROOT, "dist", "**", "*.html"), recursive=True):
    s = open(p, encoding="utf-8").read()
    s = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", s)
    for m in re.finditer(r"<h[1-6][^>]*>([\s\S]*?)</h[1-6]>", s):
        head_chars |= set(html.unescape(re.sub(r"<[^>]+>", "", m.group(1))))
    body_chars |= set(html.unescape(re.sub(r"<[^>]+>", " ", s)))
ok = True
for name, chars in (("MTNBrighterSans-Bold", head_chars), ("SkyText-Regular", body_chars), ("SkyText-Bold", body_chars)):
    miss = sorted(c for c in chars if not c.isspace() and ord(c) not in cm[name])
    if miss:
        ok = False
        print(f"{name}: missing {''.join(miss)!r}")
print("glyph check:", "OK, every shown character has a glyph" if ok else "PROBLEM")
sys.exit(0 if ok else 1)
