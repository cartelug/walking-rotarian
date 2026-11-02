# The Walking Rotarian: website

A small, fast website for Mbanda Shyaka, the Walking Rotarian. 15 pages. No database, no logins, nothing to keep patched. It is plain files you upload to any web host.

**Built from:** the Walking Rotarian creative plan and typography tokens in Google Drive, the PCI archive (read-only), and the research notes on Shyaka's walks.

> **The files in `dist/` and in the site zip are a private preview build.** They tell search engines *not* to list the site, so you can review it first. Everything else works. When you are ready to launch, make the launch build with your domain (section 3, items 3 and 6).

---

## What is in this folder

| Folder or file | What it is |
|---|---|
| `dist/` | **The finished website.** Upload this. (In the site zip, these files are at the top level.) |
| `src/data/` | All the words and facts. Edit these to change the site. |
| `src/assets/` | Look and feel (`main.css`), small helpers (`main.js`), fonts. |
| `src/img/` | Web-ready photos. `src/img-original/` keeps the untouched originals. |
| `build.mjs` | The one command that turns `src/` into `dist/`. |
| `tools/` | Checkers. They test links, fonts, layout at six screen sizes, and the form. |

---

## 1. See it on your computer

1. Open the `dist` folder.
2. Double-click `index.html`.

That is all. It opens in your browser.

---

## 2. Put it online (cPanel)

1. Log in to cPanel and open **File Manager**.
2. Go into `public_html` (or the folder of the domain you are using).
3. Click **Upload** and choose `walking-rotarian-site.zip`.
4. Right-click the zip and choose **Extract**. Make sure `index.html` ends up **directly** inside `public_html`, not in a sub-folder.
5. Hidden files: in File Manager open **Settings** and tick **Show Hidden Files**. Check that `.htaccess` is there. It keeps folders from being listed, shows the friendly 404 page and compresses pages.
6. Turn on the padlock: cPanel, **SSL/TLS Status**, run **AutoSSL** for the domain.
7. Once the padlock works, open `.htaccess` and remove the `#` at the start of the two lines under "When the SSL certificate is installed". Save.
8. Open the live address and click through every page once.

---

## 3. Before you announce it: things that need the owner's OK

Nothing here blocks the site from working. These are decisions, not bugs.

1. **The short biography.** It is on the home page, His story and Media. Wording comes from the research notes and reads as publication-ready, but Mbanda should approve it. Edit it in `src/data/story.mjs` (`bio.short`).
2. **Photo permission.** Every picture is credited as supplied by the project owner or published by PCI. Please confirm Mbanda and PCI are happy for each to be public, **especially the three Kiburara crowd photos, which show members of the public and children.** To hide one, delete its entry in `src/data/gallery.mjs`.
3. **The web address (needed for the launch build).** Build with it set so share previews, canonical links and the sitemap work:
   `SITE_URL=https://your-domain.org node build.mjs`
4. **The contact email.** The form currently uses PCI's own public campaign address (`pci.uganda@gmail.com`) as a stand-in. Put the real booking address in `src/data/site.mjs` (`email`).
5. **Form delivery (optional).** Without a form service, the form opens the visitor's email app and says plainly "Nothing has been sent yet". That is honest but needs two clicks from the visitor. To have the site send messages itself, sign up to a form service (Formspree or similar), then build with
   `FORM_ENDPOINT=https://the-address-they-give-you node build.mjs`
   The form then says "Delivered" or "Not delivered" based on what the service actually answers.
6. **Search engines.** The preview build in this package uses `NOINDEX=1`, so Google is asked not to list it. For launch, build **without** `NOINDEX` (for example the command in item 3), then upload the new `dist/` contents.
7. **Fonts.** See section 6. Please read it before a public launch.

---

## Design notes (v2)

- **Page loader** on every page: the logo, a short line of footprints and "Every step has a story." Full length on the first page of a visit, brief after that, skipped for visitors who ask their device for less motion, and it never waits more than 5 seconds.
- **Logo without its background:** `src/img/logo-ink-*.webp`, made by `tools/make_design_assets.py` from the supplied logo (the drawing is unchanged; only the white paper is removed). Media page offers both versions for download.
- **Backgrounds:** landscape illustrations from PCI's Walk for Education campaign (no people), under dark washes so text stays readable, plus a light contour-map texture. They are credited in the footer.

## 4. Changing things

You need Node 18 or newer on your computer only for this part. (Download "LTS" from nodejs.org.)

1. Edit a file in `src/data/` (the comments at the top of each file say what goes where).
2. In a terminal, in this folder, run: `node build.mjs`
3. Run: `node tools/check_site.mjs` (it lists any broken link or missing text).
4. Upload the new contents of `dist/` to `public_html`, replacing the old files.

| To change... | Edit |
|---|---|
| Site name, motto, menu, contact email, font credit | `src/data/site.mjs` |
| The current walk (button in the header, home page panel) | `currentWalk` in `src/data/site.mjs` |
| A journey, its facts and its chapters | `src/data/journeys.mjs` |
| His story timeline | `src/data/story.mjs` |
| Field notes | `src/data/fieldnotes.mjs` |
| Gallery pictures and captions | `src/data/gallery.mjs` |
| Press list, listen and watch, press-kit rules | `src/data/media.mjs` |

### When Walk for Education has a confirmed stage

The site shows **no live location and no distance walked**, because none has been approved for publication. When the campaign team confirms a dated stage:

1. In `src/data/site.mjs`, set `lastVerifiedUpdate: "2026-11-10"` (the real date).
2. In `src/data/fieldnotes.mjs`, copy an existing note, give it the real date, place, one or two sentences the source supports, and the source link.
3. Build and upload.

### Adding a photo

Each photo needs several widths (480, 800, 1080 pixels wide, as `.webp`) in `src/img/`, plus an entry in `src/img/manifest.json` with the true width and height, then an entry in `src/data/gallery.mjs`. The easiest way is to send the photo and its caption and credit to Claude or a developer. `tools/make_images.py` records how the current pictures were prepared.

---

## 5. The rules this site keeps (so it stays trustworthy)

- **Every distance says who reported it** (Organiser-reported, Media-reported, Club-reported, Self-reported). The words are the same everywhere.
- **Underway, completed and proposed are kept apart.** The Dar es Salaam walk is a proposal and is never counted.
- **A target is not a total.** UGX 414 million (Faith in Motion) and UGX 25 billion (Walk for Education) are goals, not money received.
- **345 km and 400 km are the same walk.** 345 km is an earlier estimate. They are never added.
- **Walk for Education's 1,100 km is the planned route.** It is not distance walked.
- **Nothing is written in Mbanda's voice** unless he wrote the words himself.
- **No payment details, phone numbers or money totals** are shown. Giving happens on PCI's own pages.
- **News photographs are linked, not copied.**
- **Wellbeing statements are personal views, not medical advice.**
- **The footer says this is not an official Rotary International website.**

---

## 6. Fonts: please read

The design plan asks for **MTN Brighter Sans Bold** (headings) and **Sky Text** (everything else). The font files came from the Drive package, which credits "Web Fonts" (onlinewebfonts.com) under CC BY 4.0, and the footer carries that credit.

However, the files themselves state that the copyright belongs to **Newlyn Works Limited** (Brighter Sans) and **BSkyB Ltd / Dalton Maag Ltd** (Sky Text). These are brand typefaces for MTN and Sky. A "CC BY 4.0" label on a download site does not by itself give you the owners' permission.

- Fine for building, reviewing and a private preview.
- **Before a public launch,** confirm you may use them, or swap to fonts you are licensed for. To swap: put the new `.woff2` files in `src/assets/fonts/` and change the `@font-face` lines at the top of `src/assets/main.css`. Nothing else needs to change.

---

## 7. Checks that were run on this build

| Check | Result |
|---|---|
| `node tools/check_site.mjs` (links, anchors, headings, image sizes, labels, leftover text) | No problems found |
| `python3 -I tools/check_glyphs.py` (every character on every page exists in the fonts) | OK |
| `python3 -I tools/browser_check.py` (real Chromium, 15 pages at 320, 375, 640, 768, 1024 and 1440 px) | Passed: no sideways scrolling, every picture loads, headings only in Brighter Sans, no italics, text contrast and button sizes pass, no console errors, menu, filters, gallery viewer and form all work |

The browser check needs Python with Playwright installed. You do not need it to run the site.

External links were checked by reading the pages where the web allowed. About 20 of the 26 opened and matched what the site says about them. **Not opened from here:** both YouTube links, the LinkedIn post, the Medium workshop account, the two Rotary Club of Akright City magazine PDFs and the Daily Monitor Elamin feature (those sites refuse automated readers; a search did confirm the Elamin article exists). Please click each once before launch. `node tools/check_site.mjs --list-links` prints the full list.

One source was left out on purpose: a Uganda Radio Network copy of the 2020 "digital learning tide" story could not be confirmed, so the site links The Independent's copy, which was.

A note on one source: POA TV's older web address now redirects to an unrelated site. The site links the working one, `poatvug.com`.

---

## 8. Settings summary

| Setting | How | What it does |
|---|---|---|
| `SITE_URL` | `SITE_URL=https://domain node build.mjs` | Adds share links, canonical links and a sitemap |
| `NOINDEX` | `NOINDEX=1 node build.mjs` | Asks search engines not to list the site |
| `FORM_ENDPOINT` | `FORM_ENDPOINT=https://... node build.mjs` | The form sends messages through that service |
| `OUT_DIR` | `OUT_DIR=build2 node build.mjs` | Writes the site into a different folder |
| `BASE_PATH` | `BASE_PATH=/walk node build.mjs` | Only for a site that lives in a sub-folder, such as `domain.org/walk/` |
