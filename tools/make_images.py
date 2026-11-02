"""Make the web-ready photos for the Walking Rotarian site.

Reads the real photographs and the real logo from the PCI archive (read-only),
writes responsive WebP copies into src/img/, copies the untouched originals into
src/img-original/, and writes src/img/manifest.json so the site builder knows
the true size of every picture.

Rules this script follows:
  * Never upscale. The largest copy is the original width.
  * The logo is only trimmed of empty white margin (and the grey strip at the
    very top of the supplied file). The mark itself is never touched.
  * The video still has its phone interface (status bar and player bar) cut off,
    the same way PCI cut the black bands off the portrait. Nothing else changes.

Run:  python3 -I tools/make_images.py
"""
import json
import os
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get("PCI_ASSETS", "/home/claude/cartelug/pdm/assets")  # the PCI archive's assets folder (read-only)
OUT = os.path.join(ROOT, "src", "img")
ORIG = os.path.join(ROOT, "src", "img-original")
os.makedirs(OUT, exist_ok=True)
os.makedirs(ORIG, exist_ok=True)

manifest = {}


def save_set(name, im, widths, quality=80):
    """Save im at each width (never larger than itself) and record it."""
    w0, h0 = im.size
    made = []
    for w in sorted(set(widths)):
        if w > w0:
            w = w0
        if w in made:
            continue
        h = round(h0 * w / w0)
        copy = im if w == w0 else im.resize((w, h), Image.LANCZOS)
        copy.save(os.path.join(OUT, f"{name}-{w}.webp"), "WEBP", quality=quality, method=6)
        made.append(w)
    manifest[name] = {"w": w0, "h": h0, "widths": made}
    return made


def keep_original(rel):
    src = os.path.join(SRC, rel)
    shutil.copy2(src, os.path.join(ORIG, os.path.basename(rel)))
    return Image.open(src).convert("RGB")


# ---- photographs -----------------------------------------------------------
photos = [
    ("portrait", "walk-for-education/walking-rotarian-photo.jpg", [480, 710]),
    ("river-crossing", "faith-in-motion/walking-rotarian-river-crossing.jpg", [480, 774]),
    ("arrival-celebration", "faith-in-motion/walk-day-arrival-celebration.jpg", [480, 800, 1080]),
    ("kiburara-procession", "faith-in-motion/walk-day-procession-kiburara.jpg", [480, 800, 1079]),
    ("kiburara-crowd", "faith-in-motion/walk-day-crowd-welcome.jpg", [480, 800, 1080]),
    ("route-kasese", "faith-in-motion/kasese-milestone-345km.jpg", [360, 540]),
    ("route-riverside", "faith-in-motion/walking-rotarian-riverside-35km.jpg", [360, 540]),
    ("route-mpara-biguli", "faith-in-motion/mpara-biguli-day-8.jpg", [360, 540]),
    ("poster-345", "faith-in-motion/faith-in-motion-345km-poster.jpg", [480, 720]),
]
for name, rel, widths in photos:
    im = keep_original(rel)
    print(name, save_set(name, im, widths), im.size)

# ---- video still: cut the phone interface, keep only the picture -----------
rel = "faith-in-motion/walking-rotarian-sunset-video-frame.jpg"
im = keep_original(rel)
w, h = im.size
# Measured on the supplied file: the phone status bar ends at row 97 and the
# player bar starts at about row 983. Only those two bands are removed.
top, bottom = 98, 982
still = im.crop((0, top, w, bottom))
print("evening-road crop rows", top, bottom, still.size)
print(save_set("evening-road", still, [360, still.size[0]]))

# ---- logo: trim empty margin only ------------------------------------------
logo = keep_original("brand/walking-rotarian/walking-rotarian-logo.jpeg")
lw, lh = logo.size
mask = logo.convert("L").point(lambda v: 255 if v < 150 else 0)
mask = mask.crop((0, 18, lw, lh))  # ignore the grey strip at the top
bx0, by0, bx1, by1 = mask.getbbox()
by0 += 18
by1 += 18
pad = 26
box = (max(0, bx0 - pad), max(18, by0 - pad), min(lw, bx1 + pad), min(lh, by1 + pad))
logo_c = logo.crop(box)
print("logo box", box, logo_c.size)
logo_widths = save_set("logo", logo_c, [96, 192, 288, logo_c.size[0]], quality=92)
# square icon copies of the same mark (white background, centred, no recolouring)
side = max(logo_c.size)
square = Image.new("RGB", (side, side), (255, 255, 255))
square.paste(logo_c, ((side - logo_c.size[0]) // 2, (side - logo_c.size[1]) // 2))
square.resize((32, 32), Image.LANCZOS).save(os.path.join(OUT, "favicon-32.png"))
square.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, "apple-touch-icon.png"))
square.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "icon-512.png"))

# ---- social share card (1200 x 630) ----------------------------------------
from fontTools.ttLib import TTFont  # noqa: E402

tmp = os.path.join(ROOT, "build-notes")
os.makedirs(tmp, exist_ok=True)


def ttf_from_woff2(woff2, out):
    f = TTFont(woff2)
    f.flavor = None
    f.save(out)
    return out


fonts_dir = os.path.join(ROOT, "src", "assets", "fonts")
head_ttf = ttf_from_woff2(os.path.join(fonts_dir, "MTNBrighterSans-Bold.woff2"), os.path.join(tmp, "_head.ttf"))
bold_ttf = ttf_from_woff2(os.path.join(fonts_dir, "SkyText-Bold.woff2"), os.path.join(tmp, "_bold.ttf"))
reg_ttf = ttf_from_woff2(os.path.join(fonts_dir, "SkyText-Regular.woff2"), os.path.join(tmp, "_reg.ttf"))

PAPER, INK, CLAY, CLAYTEXT = (243, 239, 230), (21, 42, 48), (185, 92, 59), (140, 64, 40)
card = Image.new("RGB", (1200, 630), PAPER)
d = ImageDraw.Draw(card)
photo = Image.open(os.path.join(SRC, "faith-in-motion/walking-rotarian-river-crossing.jpg")).convert("RGB")
pw, ph = 504, 630
scale = pw / photo.size[0]
ph_scaled = photo.resize((pw, round(photo.size[1] * scale)), Image.LANCZOS)
top_off = int((ph_scaled.size[1] - ph) * 0.45)
card.paste(ph_scaled.crop((0, top_off, pw, top_off + ph)), (1200 - pw, 0))
d.rectangle((72, 84, 72 + 56, 88), fill=CLAY)
d.text((72, 112), "MBANDA SHYAKA  ·  THE WALKING ROTARIAN", font=ImageFont.truetype(bold_ttf, 22), fill=CLAYTEXT)
big = ImageFont.truetype(head_ttf, 92)
y = 178
for line in ("Every step", "has a story."):
    d.text((72, y), line, font=big, fill=INK)
    y += 100
d.text((72, 424), "One man. Extraordinary journeys.", font=ImageFont.truetype(reg_ttf, 30), fill=INK)
d.text((72, 466), "Meaningful change.", font=ImageFont.truetype(reg_ttf, 30), fill=INK)
logo_small = logo_c.resize((round(logo_c.size[0] * 96 / logo_c.size[1]), 96), Image.LANCZOS)
d.rectangle((72, 520, 72 + logo_small.size[0] + 24, 520 + 96 + 8), fill=(255, 255, 255))
card.paste(logo_small, (84, 524))
card.save(os.path.join(OUT, "share-card.jpg"), "JPEG", quality=86, optimize=True)

with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=1)
print("done:", len(os.listdir(OUT)), "files in src/img")
