"""Design assets for the upgraded look.

1. The logo without its white background: the supplied one-colour mark is
   separated from the paper by brightness, so edges stay smooth. Two versions:
   navy (the logo's own colour) for light backgrounds, and an ivory knockout
   for dark backgrounds. The drawing itself is not changed.
2. Background artwork from PCI's Walk for Education campaign (landscape
   illustrations only, no people), resized for the web.

Run:  python3 -I tools/make_design_assets.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "img")
PCI = os.environ.get("PCI_ASSETS", "/home/claude/cartelug/pdm/assets")

NAVY = (36, 31, 92)      # sampled from the supplied logo
IVORY = (243, 239, 230)  # site paper colour


def cut_logo():
    src = Image.open(os.path.join(OUT, "logo-397.webp")).convert("RGB")
    # upscale 2x with a smooth filter first so the alpha edge is clean at large sizes
    big = src.resize((src.width * 2, src.height * 2), Image.LANCZOS)
    L = big.convert("L")
    navy_l = 0.299 * NAVY[0] + 0.587 * NAVY[1] + 0.114 * NAVY[2]
    lut = [max(0, min(255, round((250 - v) * 255 / (250 - navy_l)))) for v in range(256)]
    alpha = L.point(lut)
    bbox = alpha.getbbox()
    alpha = alpha.crop(bbox)
    for name, rgb in (("logo-ink", NAVY), ("logo-light", IVORY)):
        im = Image.new("RGBA", alpha.size, rgb + (0,))
        im.putalpha(alpha)
        for w in (160, 320, 640):
            h = round(alpha.height * w / alpha.width)
            im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f"{name}-{w}.webp"), quality=90, method=6)
        if name == "logo-ink":
            im.save(os.path.join(ROOT, "src", "img-original", "walking-rotarian-logo-transparent.png"), optimize=True)
    print("logo", alpha.size)


def bg(name, src, widths, crop=None, q=72):
    im = Image.open(os.path.join(PCI, src)).convert("RGB")
    if crop:
        im = im.crop(crop)
    for w in widths:
        w2 = min(w, im.width)
        h = round(im.height * w2 / im.width)
        im.resize((w2, h), Image.LANCZOS).save(os.path.join(OUT, f"bg-{name}-{w}.webp"), quality=q, method=6)
    print(name, im.size)


cut_logo()
bg("path", "wfe-2026/campaign/full/02-progress-path-background.webp", (960, 1672))
bg("road", "wfe-2026/campaign/hd/05-journey-transition-background-2x.webp", (960, 1920))
bg("paths", "home-backgrounds/paths-wide-1680.webp", (840, 1680))
bg("purpose", "wfe-2026/campaign/full/03-project-purpose-background.webp", (960, 1672))
