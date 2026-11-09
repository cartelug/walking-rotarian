"""Make the web copies of newly ingested pictures.

Reads src/data/image-register.json. For every row whose status is "ingested" it:
  * applies the row's crop (derive.crop top/bottom fractions, derive.aspect such as 16:9 or 4:5),
  * writes responsive WebP copies into src/img/ (never larger than the original),
  * adds the picture to src/img/manifest.json,
  * sets the row to "ready".
A row whose derive.needsCropReview is true is built, then flagged by tools/check_images.mjs until
someone has looked at the crop and set it to false.

Widths: 480, 960 and 1400 where the original is larger; the original width for a smaller picture;
and 1672 as well when derive.hero is true.

Run:  python3 -I tools/make_scenes.py [--only id,id]
Environment overrides (used by tests): WR_ROOT
"""
import json
import os
import sys
from PIL import Image

ROOT = os.environ.get("WR_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REG = os.path.join(ROOT, "src", "data", "image-register.json")
MAN = os.path.join(ROOT, "src", "img", "manifest.json")
OUT = os.path.join(ROOT, "src", "img")


def widths_for(w0, hero):
    top = 1672 if hero else 1400
    ws = [w for w in (480, 960, 1400) if w < w0 and w < top]
    ws.append(min(w0, top))
    return sorted(set(ws))


def apply_crop(im, derive):
    w, h = im.size
    crop = derive.get("crop") or {}
    t, b = crop.get("top", 0), crop.get("bottom", 0)
    if t or b:
        im = im.crop((0, round(h * t), w, h - round(h * b)))
        w, h = im.size
    aspect = derive.get("aspect")
    if aspect and ":" in aspect:
        aw, ah = (int(x) for x in aspect.split(":"))
        target = aw / ah
        if w / h > target:  # too wide: trim the sides
            nw = round(h * target)
            x0 = round((w - nw) * crop.get("focalX", 0.5))
            im = im.crop((x0, 0, x0 + nw, h))
        elif w / h < target:  # too tall: trim top and bottom
            nh = round(w / target)
            y0 = round((h - nh) * crop.get("focalY", 0.5))
            im = im.crop((0, y0, w, y0 + nh))
    return im


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    reg = json.load(open(REG, encoding="utf-8"))
    manifest = json.load(open(MAN, encoding="utf-8"))
    made = 0
    for r in reg["images"]:
        if r.get("status") != "ingested" or (only and r["id"] not in only):
            continue
        derive = r.get("derive") or {}
        im = apply_crop(Image.open(os.path.join(ROOT, r["file"])).convert("RGB"), derive)
        w0, h0 = im.size
        ws = widths_for(w0, derive.get("hero"))
        for w in ws:
            copy = im if w == w0 else im.resize((w, round(h0 * w / w0)), Image.LANCZOS)
            copy.save(os.path.join(OUT, f"{r['id']}-{w}.webp"), "WEBP", quality=80, method=6)
        manifest[r["id"]] = {"w": w0, "h": h0, "widths": ws}
        r["status"] = "ready"
        r["derive"] = {**derive, "widths": ws, "size": [w0, h0]}
        made += 1
        print(f"{r['id']}: {w0}x{h0} -> {ws}")
    json.dump(manifest, open(MAN, "w", encoding="utf-8"), indent=1)
    open(MAN, "a").write("\n")
    json.dump(reg, open(REG, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    open(REG, "a").write("\n")
    print(f"Built {made} picture(s).")


if __name__ == "__main__":
    main()
