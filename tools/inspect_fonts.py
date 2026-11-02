import sys
from fontTools.ttLib import TTFont

NEED = "‘’“”–—…·•×→↗éèñ&@/#%+()[]:;?!0123456789UGXkmKES"
for path in sys.argv[1:]:
    f = TTFont(path, lazy=True)
    n = f["name"]
    def nm(i):
        r = n.getName(i, 3, 1, 0x409) or n.getName(i, 1, 0, 0)
        return str(r) if r else "-"
    os2 = f["OS/2"]
    head = f["head"]
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    # stem proxy: bounding box width of lowercase l
    stem = None
    try:
        from fontTools.pens.boundsPen import BoundsPen
        bp = BoundsPen(gs)
        gs[cmap[ord("l")]].draw(bp)
        b = bp.bounds
        stem = round((b[2]-b[0]) / head.unitsPerEm, 4) if b else None
    except Exception as e:
        stem = f"err {e}"
    missing = [c for c in NEED if ord(c) not in cmap]
    print(path)
    print("  family:", nm(1), "| style:", nm(2), "| full:", nm(4), "| ps:", nm(6))
    print("  usWeightClass:", os2.usWeightClass, "| fsSelection:", bin(os2.fsSelection), "| macStyle:", head.macStyle, "| upem:", head.unitsPerEm, "| glyphs:", len(f.getGlyphOrder()))
    print("  l-width/em:", stem, "| missing chars:", "".join(missing) or "none")
    feats = []
    if "GSUB" in f:
        feats = sorted({fr.FeatureTag for fr in f["GSUB"].table.FeatureList.FeatureRecord})
    print("  GSUB features:", ",".join(feats) or "none")
