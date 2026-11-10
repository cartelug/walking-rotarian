# Walking Rotarian: final image plan

Prepared 9 November 2026. Built on the first audit (commit `f91b4a6`), a second pass through Google Drive (the PCI tree, the Walking Rotarian website folder and Mbanda's reference folder), the sister repository `cartelug/spear-line` and a fresh build of this site. **Nothing here has been generated, added to the site or published.** It is a plan for the owner to approve.

## Decisions recorded 9 November 2026

1. **Mbanda directed this.** He told his son, the site owner and web builder, to generate the labelled AI set and to use the archive candidates. No further approval is needed.
2. **PCI is Mbanda's company,** so its photographs in the archive (church appeal 42, campus 52 and the PCI items already on the site) fall under the same direction. No separate approval is needed.
3. **The three walking photographs (22-23, 22-24, 22-29) are published with no date, place or walk named,** and stay off the journey pages. The two group photographs (22-9, 22-10) stay out: crowd, banners and payment details.
4. **The 28 October ten-image test is skipped.**
5. **Generator: ChatGPT Images, run in the ChatGPT app,** where several reference photographs can be attached. The Zapier ChatGPT action on this account offers only GPT Image 1 and 1.5 and a single source image, so it cannot carry the reference pack. It could make the scenery and objects (no person), at a lower model level, if asked.

6. **First run: one prompt, 30 pictures.** 12 show Mbanda and 18 do not (8 scenery, 5 gear and objects, 5 other adults on the road). The prompt tells ChatGPT to find his portrait and the other reference photographs in the PCI folder in Drive. It is `docs/ONE-PROMPT.md`. The other 16 prepared pictures, including every seated or crouched pose, are held in reserve.

All six are recorded in `src/data/image-register.json`.

**Built and tested** (with dummy images; no real photograph has been ingested yet): the register and its rules, the label audit in `tools/check_site.mjs`, `tools/ingest-drive.mjs`, `tools/make_scenes.py`, and `tools/assemble-prompts.mjs` with its outputs `docs/ONE-PROMPT.md` (the single prompt) and `docs/prompts-ready.md` (one prompt per picture, for redos), and the generation protocol `docs/GENERATION-PROTOCOL.md` with its empty log `docs/generation-log.csv`. The AI label on the home hero and the page banners now says "AI-generated". **Not built yet:** the render-time resolver and page wiring, AVIF output, gallery filters and "show more", the journey-page "Photographs at the source" rows, and the admin-form approval fields.

## 1. What changed since the first version

1. **Drive holds an authoritative identity pack and a rule file.** My first prompt pack contradicted it in seven places (section 3). It is corrected, and the corrected pack is the one to use.
2. **The real-photograph supply is bigger than I first thought, but every item is gated.** The 52-image archive in Drive holds 22 more candidates for this site (19 frames from Mbanda's own public video posts, one Instagram photo, two PCI photographs). Five full-size originals and three 2023 photographs sit in Drive beside them. None has been cleared for publication.
3. **Source waterfall.** A slot takes a real photograph first, then a link to the source, then AI. This replaces "generate 41 images" with "generate only what real photographs cannot fill" (section 4).
4. **A register links every image to its PCI source** by checksum, and records its source, what it claims and how it is labelled. The register is built: `src/data/image-register.json` (93 rows).
5. **Previously generated images** are reused only through a ladder with a decision for each set (section 4.5). Most should not be reused.

**I could not look at any of the Drive reference photographs.** The Drive connector returns text only for images. Everything in section 3 about what each photograph shows comes from the owner's own rule files, not from my eyes. Someone should lay the six reference files beside the first pilot images before anything is approved.

## 2. What the Drive holds

| Where in Drive | What | Use |
|---|---|---|
| PCI > Walk for Education > Project Hub > 05 Photos and Videos > **Shyaka Mbanda - Authoritative References - 2026-10-28** | Primary face portrait, five original photographs (22-23, 22-24, 22-29, 22-9, 22-10), three generated reference sheets (face, hair and headwrap, body), two rule files | The accurate reference pack (section 3). Keep in Drive; do not commit to the public repository. |
| Walking Rotarian website > 05 Deep Research & Photo Archive > **02 Archived Public Photos & Video Previews** | 52 images recovered from a 26 Oct dossier, with `Research_and_Photo_Index.md` (source URL, size, type for each) | Real candidates: 22 new, 10 already on this site, 20 not usable (section 6) |
| Walking Rotarian website > ... > **03 PCI Photos & Drive-wide Collection** | `01 Documentary Photos` (the originals behind this site, plus three 2023 photographs), `02 Campaign Artwork & Generated Scenes` (40+ generated masters and ~30 posters), `03 Original WR Logo & Identity References`, and the register files | The link layer: `Image_Collection_Register.csv` (path, class, bytes, sha256, source ZIP entry) and `Drive_Copied_Image_Register.csv` |
| PCI > Walk for Education > Project Hub > 05 Photos and Videos > **Original Event Media** and **Generated and Enhanced Supporting Images** | One portrait copy; four generated images on the first page (students, library, campus, a Rotary cut-out) | Not usable (section 4.5) |
| PCI root | `PCI_CLAUDE_PART_1_HANDOFF.zip` and `PART_2_ASSETS.zip` (28.9 MB each), the source of the `cartelug/pdm` archive | Already mirrored in `cartelug/pdm` |
| Mbanda's own Drive (2018 to 2020 photographs, shared) | Small older photographs | Not opened. They show how he looked years ago, and the standard asks for current likeness. |

I did not open files that look like account-ID screenshots, payment details or KYC material.

**Proof that the link layer works:** four site originals (the portrait, the Kasese milestone, the poster and the logo) match rows in `Image_Collection_Register.csv` byte for byte on SHA-256, and ten of the twelve match a file in `01 Documentary Photos` by name and size. The primary face portrait appears under three names with one byte size (152,850), including an earlier "Joshua_Walker" name, so the register must match on checksum and never on filename.

## 3. The accurate reference pack

**Authority:** the owner's rule file says the original photographs overrule every generated sheet, and a generation must never use a generated image as its only identity input.

| Role | Drive file | Authority for |
|---|---|---|
| portrait | `Shyaka_Mbanda_Portrait_Reference.jpeg` (also `00_PRIMARY_Original_Face_Portrait.jpg`) | Face, glasses off. Always attached. |
| body-front | `22-23.jpg.jpeg` | Front three-quarter walking view, amber glasses on |
| body-side | `22-24.jpg.jpeg` | Side view, silhouette |
| body-rear | `22-29.jpg.jpeg` | Rear view: headwrap knot, locs, backpack, lower legs |
| expression | `22-9.jpg.jpeg`, `22-10.jpg.jpeg` | Smiling and laughing. He is second from the right. The stockier man beside him is not him. |

**Corrections to my first prompt pack**

| First version said | The Drive standard says |
|---|---|
| "lean athletic build" | Lean observed frame, slim arms, natural shoulders. No muscular bulk, no athletic-model anatomy, and do not over-slim. |
| Four repository photographs as references | Portrait always, plus at least one original full-body photograph, plus the rear one when headwrap or backpack matters, plus an expression photo for a broad smile |
| "charcoal vest, dark backpack, black-and-ivory necklace" | Kit as in the originals. Amber-tinted glasses when the scene follows 22-23. Do not invent anything under the waist wrap. |
| "35mm lens" in the style block | Avoid arbitrary camera specifications and adjectives that compete with likeness. Dropped. |
| "No Rotary marks" | Remove Rotary, Rotarian, Rtn., Club of Akright City and wheel symbols from derivative images and reconstruct the fabric naturally. Now exact in the pack. |
| Any pose | Stay close to an observed view. **10 of the 25 person shots are seated or crouched, which no original establishes.** They are marked high risk and run last. |
| Straight to batches | Establish likeness before elaborate environments. A six-image pilot comes first. |

The six person images already on the site were generated on 7 November from four repository photographs, with an identity block that says "lean athletic torso". They were not made from this pack. Treat them as provisional until compared.

## 4. The logic

### 4.1 Source waterfall (for every slot on every page)

1. **Real, approved:** a documentary, own-post or PCI photograph whose register entry is approved and whose claim is allowed.
2. **Link to the source:** for news photographs (Nile Post, URN) show a "Photographs at the source" link and never copy them, as the README already requires.
3. **Previously generated, re-qualified:** only through the ladder in 4.5.
4. **New AI:** scenery and objects first. A person shot only if nothing above fills the slot.
5. **Banner or nothing.**

A slot is never filled by an image that fails a gate in 4.3.

### 4.2 The register (`src/data/image-register.json`)

One row per image. Built from rows I verified against the repository and the Drive listing, and checked by `tools/check_images.mjs`.

| Field | Meaning |
|---|---|
| `id`, `file`, `bytes`, `sha256`, `width`, `height` | Identity of the bytes |
| `class` | documentary, own-post, pci-photo, news-linkonly, designed-poster, generated-scenery, generated-person, excluded |
| `origin` | archive number, public source URL (a pamodzici.com page or the post), Drive folder and original file name |
| `capture` | date, place, journey, and the **claim** the picture makes (for example "Walk for Education stage: Longonot to Naivasha") |
| `rights` | holder, permission (approved, pending, link-only, excluded), approved by, approved on |
| `people` | adults only, children false, consent noted |
| `label` | kind and the exact caption shown |
| `generation` | tool, date, prompt id, input roles used, review gate result, `supersedes` |
| `status` | live, candidate, retired |

### 4.3 Gates (checked at build time)

- **Permission:** `rights.permission` must be approved, or the class must be link-only.
- **Claim:** a picture that shows a stage of an underway or proposed walk is hidden until the owner confirms that claim (a one-line switch in the register; Mbanda's direction is enough). This ties to the site's existing "last verified update" rule, so Walk for Education frames (archive 44 to 51) stay hidden until a stage is confirmed.
- **Children:** any row flagged `children: true` fails.
- **Branding:** a generated image must record that Rotary and club marks were removed.
- **Label:** every AI image shows its caption, on every page it appears.
- **Place on page:** AI pictures of Mbanda never appear on an individual journey page.
- **Size:** the file must meet the slot's minimum width, or the slot falls to the next source.
- **Checksum:** the register's SHA-256 must match the file in `src/img-original`.

`tools/check_site.mjs` fails the build on any breach. The check that every AI image has its label is the one Spear Line already has and this site lacks.

### 4.4 Linking to the PCI Drive

- **Build-time, not run-time.** The site is static on GitHub Pages and the Drive is private, so pages never load from Drive.
- **Ingest, hash-verified.** `tools/ingest-drive.mjs` takes a folder the owner downloads from Drive (or images saved from ChatGPT). It hashes each file, matches rows by SHA-256, copies the file unchanged into `src/img-original/`, runs the existing derivative step and updates the manifest. An optional mode downloads by Drive file ID when a token is supplied. That mode is a design only and has not been built.
- **Public captions cite the public source** (the PCI page or the post), never a Drive link.
- **Do not commit Drive file IDs or the reference photographs.** The repository is public and the Drive tree also holds payment and identity material. The register stores file names, sizes and checksums only.
- **Admin form:** add "Approve this image" and "Approve this claim" fields to the existing GitHub publishing forms, so the owner approves in the tool he already uses.

### 4.5 Previously generated images

| Set | Count | Decision |
|---|---|---|
| This site, campaign scenery (highlands, forest, evening, footsteps, learning, essentials) | 6 | Keep. Label "AI-generated illustration". |
| This site, campaign with Mbanda | 6 | Provisional. Retire once the remakes pass the review gate. |
| PCI `GENERATED__` masters in Drive (scenes 01 to 20, hero, community, journey-walker, bag, backdrops) | 40+ on the first page | Do not reuse. They carry PCI's campaign identity, scenes 16 and 17 are imagined arrival and welcome, and PCI's permission is needed. |
| PCI `wfe-2026` campus, story, refresh in `cartelug/pdm` | ~270 | Exclude. Children and students. |
| Posters and flyers | ~30 | Exclude. Text, payment details and logos. |
| Generated and Enhanced Supporting Images | 4+ on the first page | Exclude students and the Rotary cut-out. Prefer the original campus photograph (archive 52) to the enhanced copy. |
| The 28 October ten-image test made with the Drive pack | 10 | **Not found.** The rule file says it got positive feedback. Ask the owner where it is. If found it is the first choice for reuse, after the review gate. |

A generated image is reused only if it was made from the Drive pack, passes the review gate, carries its label, contains no Rotary or club marks and has no children.

### 4.6 Page map

| Page | Source order |
|---|---|
| Home hero | A real original at 1600 px or wider (22-23, 22-24 or 22-29), if one is wide enough, else AI `remake-home-hero` |
| Home essay and stories | Real Kiburara photographs (live), route-record frames, AI remakes |
| Journeys index (7 cards) | Scenery only. Never a person. |
| Journey pages | **Real only**, plus a scenery banner. Faith in Motion: live items plus its own-post frames. Walk for Education: its eight frames, hidden until a stage is approved. |
| Nakivale, Makerere and Ishekye journey pages | "Photographs at the source" links to the Nile Post and URN pieces (archive 17 to 20, 22 to 25). No copies. |
| Live | Real own-post frames. One labelled AI candid image on the explainer. |
| Community | Real Kiburara photographs, AI `remake-community-banner` |
| Get involved, Partners, Reports, Media | Scenery and object banners. The church-appeal photograph (42) on Get involved. |
| His story | Real portrait, the Instagram portrait (02), the 2023 photographs if they suit |
| Gallery | Everything, filtered by class: Photographs, Own posts, AI scenes, Scenery |
| Shop | Gear objects, labelled concept |
| Journal posts | Attachments from the form only |

## 5. The numbers

The first run adds **30** AI pictures (12 with Mbanda, 18 without). Everything else on the site stays.

| Scenario | Real | Kept AI scenery | New AI without Mbanda | New AI with Mbanda | Total |
|---|---|---|---|---|---|
| No new real photographs | 10 | 6 | 18 | 12 | **46** |
| The 22 archive candidates used | 32 | 6 | 18 | 12 | **68** |
| Those plus the three walking originals | 35 | 6 | 18 | 12 | **71** |

**With only the 30 new pictures the site has 46, which is under your 50.** Ingesting the 22 archive photographs takes it to 68, so do that too, or draw pictures from the reserve. **Recommended order:** ingest the real photographs first, run the six-picture pilot, then the rest of the 30.

## 6. Real candidates (cleared to use; the crop and claim checks still apply)

The 52-image archive: 10 are already on this site (archive 01, 26 to 28, 34, 37, 39 to 41, 43), 22 are candidates, 8 are news photographs (link only: 17 to 20, 22 to 25), 9 show children or learners (03, 07 to 14) and 3 are promotional posters (04, 05, 15).

| # | Image | Size | Class | Gate |
|---|---|---|---|---|
| 02 | Personal walking portrait (Instagram) | 640x640 | own-post | Cite the Instagram post |
| 42 | Supporters carrying the church appeal | 1079x608 | pci-photo | Published by PCI already |
| 52 | UCU-Kagando University College campus | 750x499 | pci-photo | Caption must say it is not the nursery school |
| 29 | Akright City to Mpigi, day 1 | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 30 | Roadside record, day 2 | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 31 | A reflection from day 4 | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 32 | Maddu to Kyayi trading centre | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 33 | A day 6 journey record | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 35 | Mabaale to Rwimi, day 10 | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 36 | Rwimi to Kasese, posted as 31 km | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 38 | A public record at the Equator | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 06 | Walk4Code: Nyabihoko to Kisizi | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 16 | Public reflection on long-distance walking | 640x1136 | own-post | crop the player bars; show any distance as self-reported |
| 21 | Masaka to Lukaya, posted as day 5 (Peace Walk 2025) | 640x1138 | own-post | crop the player bars; show any distance as self-reported |
| 44 | Announcing the education journey | 640x1136 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |
| 45 | Rift Valley descent: Limuru to Longonot | 640x1136 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |
| 46 | A post titled On top of Mt Longonot | 640x1136 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |
| 47 | Longonot to Naivasha, day 4 | 540x960 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |
| 48 | Kamara to Timboroa, posted as 30 km | 540x960 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |
| 49 | Another Kamara-Timboroa record, 29 km | 640x1136 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |
| 50 | Timboroa to Burnt Forest, 26 km post | 640x360 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |
| 51 | A nature reflection during the trek | 640x1136 | own-post | crop the player bars; show any distance as self-reported; HOLD until a Walk for Education stage is approved on the site |

**Drive-only originals** (not in the archive): `22-23`, `22-24`, `22-29` (full-size walking photographs, 0.6 to 0.9 MB) have no recorded date, place, walk or photographer, so they are published with none of those named and stay off the journey pages. `22-9` and `22-10` show a Walk for Education send-off with banners, a crowd and payment details, so they need cropping and consent or should be skipped. Three `20230308_*.jpg` photographs (1.3 to 1.5 MB each, 8 March 2023) are the only large real photographs of the earlier work. I have not seen them.

**Twelve photographs to ask Mbanda for** (through the journal form, with its own approval box ticked; no child's face): his boots at the start of a day; the road ahead; a bottle being filled; his notebook; a roadside meal; a bridge or river he crossed; a phone route screenshot with the overlay cropped; a companion's shoes beside his; a sunrise start; a market he passed; his pack the night before; a tea stop, with the server's permission.

## 7. The AI shot list (46 designed; the first run is the 30 in `docs/ONE-PROMPT.md`)

The tables below were written for the first 41 designs. Set F (five pictures of other adults on the road: `life-tea-vendor`, `life-market-tomatoes`, `life-boda-waiting`, `life-farmer-path`, `life-cyclist-sacks`) was added for the first run and is in the pack. The run order and the reserve are in the pack (`batch`, `order`).

Wave 1 (16, scenery and objects) can run at any time. Wave 2 (6, the remakes) follows the pilot. Wave 3 (19) runs only for gaps real photographs leave. ★ marks the six pilot shots; two of them (`road-phone-check`, `met-phone-call`) belong to wave 3 and are run only as likeness tests unless real photographs leave a gap. Full prompts are in `docs/candid-prompt-pack.json`.

### Set A: On the road (10)

| # | Image | Shape | Scene | Pose basis (risk) | Where it goes |
|---|---|---|---|---|---|
| A01 ★ | `road-phone-check` | 3:2 | Mid-stride along a tarmac verge, looking down at his phone to check the route. A boda-boda rider passes close in the foreground, motion-blurred and cropped at the frame edge. | side (medium) | Gallery; Journeys index card |
| A02 | `road-bootlace` | 3:2 | Crouched at the road edge retying a boot lace, backpack on the ground beside him, eyes on the lace. A minibus taxi is stopped in the soft background. | unestablished (high) | Gallery; Live page explainer |
| A03 | `road-water-fill` | 3:2 | Filling a water bottle from a jerrycan at a roadside kiosk, head bowed to the task. A woman behind him, turned away, is arranging tomatoes. | front34 (medium) | Gallery; Community page |
| A04 | `road-produce-stall` | 3:2 | Walking past a roadside produce stall, head turned toward something off-frame left. A vendor’s arm enters the frame. | side (medium) | Gallery; Get involved page |
| A05 | `road-footbridge-back` | 2:3 | Seen from behind on a plank footbridge over a small river, mid-stride. One pedestrian pushing a bicycle comes the other way. | rear (low) | Gallery; Journeys index |
| A06 | `road-rest-culvert` | 4:5 | Sitting on a concrete culvert in open shade, backpack open, eating a chapati from paper, looking down the road and not at the camera. | unestablished (high) | His story page; Gallery |
| A07 | `road-map-boda` | 3:2 | Holding a phone map against the wind while a boda-boda rider, in profile, points the way. Both adults look down the road. | side (medium) | Gallery; Live page |
| A08 | `road-long-truck` | 16:9 | Very wide view: a tiny, unidentifiable walker far along a long red-earth road, a loaded truck passing in the foreground. Flat overcast light, large quiet sky for a headline. | - | Journeys index banner |
| A09 | `road-heel-tape` | 3:2 | Close detail: hands taping a heel with medical tape beside worn boots. No face. | - | Field notes page; Gallery |
| A10 | `road-predawn-stretch` | 2:3 | Pre-dawn calf stretch against the wheel arch of a parked minibus at a taxi stage, dim blue light. A vendor lights a charcoal stove behind him. | unestablished (high) | Live page; Gallery |

### Set B: People met along the way (adults only) (8)

| # | Image | Shape | Scene | Pose basis (risk) | Where it goes |
|---|---|---|---|---|---|
| B01 | `met-veranda-elders` | 3:2 | On a veranda bench listening to two older men, seen in profile, leaning forward with hands clasped. The men are mid-conversation, not posing. | unestablished (high) | Community page; Gallery |
| B02 | `met-trestle-table` | 3:2 | At a trestle table in a small hall reviewing papers with two volunteers (side and back views). Plastic chairs, a ceiling fan, no readable text. | unestablished (high) | Get involved page; Partners page |
| B03 | `met-joined-walkers` | 3:2 | Walking alongside two adult companions who have joined him, one carrying a water jug. They are talking, shot from behind-left, none looking at the camera. | rear (low) | Community page; Gallery |
| B04 | `met-tea-kiosk` | 3:2 | At a tea kiosk receiving a cup from a vendor. Hands and cup in sharp focus, his face partly in shadow. | front34 (medium) | Gallery; Media page |
| B05 | `met-notice-board` | 3:2 | Reading a weathered notice board outside a trading centre (writing illegible and out of focus), arms folded, others walking past. | side (medium) | Gallery; Reports page |
| B06 | `met-notebook-market` | 4:5 | Sitting on a wooden bench writing in a notebook while a market bustles behind him, shallow depth of field. | unestablished (high) | Live page; Gallery |
| B07 ★ | `met-phone-call` | 2:3 | Roadside phone call, one hand shading his eyes, backpack straps on, a parked pickup behind him (no plate). | front34 (medium) | Gallery; Contact blocks |
| B08 | `met-greeting` | 3:2 | Pausing to greet a woman carrying a basket on her head. Both smile at each other, turned three-quarters away from the camera. | side (medium) | Community page; Gallery |

### Set C: Rest and recovery (5)

| # | Image | Shape | Scene | Pose basis (risk) | Where it goes |
|---|---|---|---|---|---|
| C01 | `rest-unlacing` | 3:2 | Evening, seated on a guesthouse step unlacing a boot, a plastic basin and towel beside him, eyes on the boot. | unestablished (high) | Live page; Gallery |
| C02 | `rest-foot-soak` | 3:2 | Both feet soaking in a basin on concrete, boots and socks drying on the wall. No face. | - | Field notes page; Gallery |
| C03 | `rest-eatery-charging` | 3:2 | At a roadside eatery table charging a phone from a power bank, a plate of rice and beans in front of him. Fluorescent light, dusk at the window. | unestablished (high) | Gallery; Shop page |
| C04 | `rest-lodging-gear` | 3:2 | A bedroll and gear laid out on a narrow bed in a simple lodging room, window light. Backpack, boots and a folded headwrap. No face. | - | Journeys page; Gallery |
| C05 | `rest-reading-bulb` | 4:5 | Reading a worn paperback under a single bulb in a lodging doorway at dusk, looking down. | unestablished (high) | His story page; Gallery |

### Set D: Route scenery (no person) (7)

| # | Image | Shape | Scene | Where it goes |
|---|---|---|---|---|
| D01 | `route-murram-bananas` | 3:2 | A murram road curving between banana plantations in flat overcast light. A single cyclist far off. | Journeys cards; Gallery |
| D02 | `route-plank-bridge` | 3:2 | A rough footbridge of poles and planks over a small brown stream, wet stones below. | Journeys cards; Gallery |
| D03 | `route-papyrus-causeway` | 16:9 | A causeway through a papyrus swamp under low cloud. | Journey page banners |
| D04 | `route-eucalyptus-cyclists` | 3:2 | A eucalyptus-lined road with two cyclists carrying sacks, riding away from the camera. Tiny and unidentifiable. | Journeys cards; Gallery |
| D05 | `route-dawn-trading-centre` | 3:2 | A trading-centre street at dawn, shutters half open, charcoal smoke, motorbikes parked. No readable signs. | Live page; Gallery |
| D06 | `route-rain-road` | 3:2 | A rain-dark road with puddles reflecting the headlight of a passing boda-boda. | Journeys cards; Gallery |
| D07 | `route-terraces-sunrise` | 16:9 | Cultivated terraces on a hillside at sunrise, smoke rising from a farm kitchen. No figures. | Page banners (Partners, Reports) |

### Set E: Gear and objects (no person) (5)

| # | Image | Shape | Scene | Where it goes |
|---|---|---|---|---|
| E01 | `gear-boots-doorstep` | 3:2 | Worn boots on a concrete doorstep, one lace undone, dust in the creases. | Field notes; Gallery |
| E02 | `gear-pack-laid-out` | 3:2 | Backpack contents laid out on a cloth: notebook, power bank, water bottle, first-aid pouch, a cap. No readable labels. | Shop page; Gallery |
| E03 | `gear-notebook-desk` | 3:2 | A field notebook open with scribbled, illegible lines, a pen, and a phone with a dark screen on a wooden table. | Live page; Media page |
| E04 | `gear-staff-cap` | 3:2 | A walking staff and a cap leaning against a whitewashed wall in hard light. | Get involved; Gallery |
| E05 | `gear-route-sketch` | 3:2 | A paper route sketch with a hand-drawn line and unreadable marks, held down by a stone. | Journey atlas; Gallery |

### Set R: Candid remakes of the six glossy images (6)

| # | Image | Shape | Scene | Pose basis (risk) | Where it goes |
|---|---|---|---|---|---|
| R01 ★ | `remake-home-hero` | 16:9 | Walking along a tarmac verge on the right third, past a parked boda-boda, looking ahead and to the left. Ordinary morning light. Left half open for the headline. | front34 (medium) | Home hero (replaces campaign-hero) |
| R02 ★ | `remake-live-banner` | 16:9 | At a roadside kiosk counter writing in a notebook while the vendor wraps an item. Looks down, three-quarter profile on the right third, left side open. | side (medium) | Live and journal banner (replaces campaign-journal) |
| R03 ★ | `remake-community-banner` | 16:9 | Walking with two adult companions, mid-conversation, seen from slightly behind. One gestures. No one faces the camera. Left third open. | rear (low) | Community banner (replaces campaign-community) |
| R04 | `remake-portrait` | 4:5 | Sitting on a culvert drinking from a bottle, looking off-frame across a field. Unposed. | unestablished (high) | Home and His story portrait (replaces campaign-portrait) |
| R05 ★ | `remake-riverbank` | 3:2 | Standing at a riverbank, hands on hips, assessing the crossing, in profile from a distance. | side (medium) | Home visual story (replaces campaign-riverside) |
| R06 | `remake-narrow-path` | 16:9 | Stepping aside on a narrow ridge path as an adult farmer with two goats passes. Both look forward. Slight telephoto, small figure. | side (medium) | Closing band (replaces campaign-open-road) |

## 8. How to generate

Use `docs/ONE-PROMPT.md` (one prompt for all 30) and follow `docs/GENERATION-PROTOCOL.md` for the rules (checks before a run, the pilot decision, the review gate, the three-attempt limit and the log) and `docs/prompts-ready.md` to redo a single picture. The prompts file holds the final prompt, the reference photographs to attach, the size to ask for and the file name for all 41 pictures, in running order.

1. Run the **pilot** (six shots) in the ChatGPT app, one new chat each, with the reference photographs attached. Compare each face with the portrait at the same size.
2. Wave 1 (scenery and objects) can run at any time.
3. Apply the review gate to every image. Never refine a chain of generated faces: go back to the original photographs for every identity-sensitive revision.
4. Save each result as `<id>.png` in one folder, then run `node tools/ingest-drive.mjs <folder> --write`, `python3 -I tools/make_scenes.py` and `node tools/check_images.mjs`.
5. A person picture stays blocked until its register row has `generation.gate` set to `passed` and `branding.removed` set to `true`.

## 9. What changes in the repository

| # | Change | State |
|---|---|---|
| 1 | `src/data/image-register.json` | **Built** |
| 2 | `tools/ingest-drive.mjs`: ingest by checksum, archive number, name or picture id | **Built, tested with dummy images** |
| 3 | `tools/make_scenes.py`: web copies at 480, 960 and 1400 (1672 for heroes), crops and aspect | **Built, tested with dummy images.** AVIF not yet. Estimate, not measured: 41 sets at today's 246 KB each is about 10 MB. |
| 4 | `tools/check_images.mjs`, the register rules in `src/lib/image-register.mjs`, and the AI-label audit in `tools/check_site.mjs` | **Built** (29 of 29 tests pass) |
| 5 | AI labels on the home hero caption and the page banners | **Done** |
| 6 | `tools/assemble-prompts.mjs` and `docs/prompts-ready.md` | **Built** |
| 7 | Render-time resolver for the waterfall, with the page map in `src/data/image-slots.mjs` | Not built |
| 8 | `src/data/gallery.mjs` and `src/data/campaign-artwork.mjs`: classes, filters, "show more" after 24 tiles, captions from the register | Not built |
| 9 | `src/assets/visuals.css`: per-page banners replace the six shared ones | Not built |
| 10 | Journey pages: "Photographs at the source" rows for the news photographs | Not built |
| 11 | Admin forms: approve-image and approve-claim fields | Not built |

## 10. Still open

1. **Get the files into one folder.** The Drive connector cannot move image files, so download the 22 archive items (Drive folder "02 Archived Public Photos & Video Previews") and the three walking originals, then run the ingest tool. Leave out the three 2023 photographs until someone has looked at them.
2. **Run the pilot** in ChatGPT and check it against the portrait.
3. **Look at the 2023 photographs** (`20230308_*.jpg`) and decide.
4. **Check the crop of each video preview.** The register carries a default crop for the status and player bars, flagged `needsCropReview` until someone has looked.
5. The Zapier route is **not authorised** (protocol section 11). Nothing is generated until the Owner starts a run.
6. **Collect the place, vehicle and object photographs** for the 18 pictures without Mbanda and the backgrounds of the others: `docs/REFERENCE-REQUEST.md` (18 must-have folders, 6 extras, one zip). When the zip is in the Drive folder `WR website references`, `docs/ONE-PROMPT.md` gets a step that points each picture at its folder.

## 11. What I did not verify

- I could not see any Drive photograph. Descriptions of the reference photographs come from the owner's rule files.
- I read the start of `Image_Collection_Register.csv` (seven rows) and its description, not all 69 KB.
- I did not open the three 2023 photographs, the three generated reference sheets, the Creative Website Blueprint PDF or the later pages of the PCI generated folder.
- I did not check the rights of any post or photograph. "Rights are not established by inclusion" is the Drive archive's own note.
- Whether the 22-series photographs show the Walk for Education in progress is unknown.
- The ingest tool, web-copy script and checks were tested with dummy images, not real photographs. The default crop for video previews is a guess. The resolver and the page wiring are not built.
- The Spear Line comparisons from the first version still rest on 480 px views.
