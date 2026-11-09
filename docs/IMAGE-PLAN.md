# Walking Rotarian: image audit and 57-image candid plan

Prepared 9 November 2026 from the live repository, a fresh build of the site, screenshots in Chromium at 1440 and 390 px, and the latest reports in the sister repository `cartelug/spear-line` (read-only). **Nothing in this document has been generated, added to the site or published.** It is a plan for the owner to approve.

## 1. The short answer

- The site is sound and honest, and it passes its own checks (34 pages, no broken links, 22 of 22 tests). Its weakness is **imagery**. It has 22 pictures in total: 10 real or archive items and 12 AI pieces. Only **8 of 34 pages** carry a picture in the page itself. 17 more get only one of eight recycled AI landscape banners painted in by CSS, and 9 have no picture at all.
- **The real photographs cannot get you to 50+.** The 10 real items are what this site already uses from the PCI archive (`cartelug/pdm`). Of what I could check there, the only other real photographs are two items that need permission (section 9); the rest is AI artwork, tiny video stills (about 100 to 150 px) or a blurred YouTube thumbnail. More real candid photographs have to come from Mbanda's phone.
- **What Spear Line did differently** (its 9 November commit: ten founder photographs): the person is caught doing something, attention mostly elsewhere, in ordinary light, among other people, with the setting left untidy. Every image carries the caption "Joh Ayom, AI-generated image", and a unit test enforces it. The Walking Rotarian AI set is composed and glossy: golden light, saturated greens, Mbanda on the right third, and half of it shows no face.
- **Recommended target: 57 images** (10 real kept, 6 scenery kept, 41 new AI in the Spear Line manner), with a standing plan to swap AI for real photographs as Mbanda sends them. Full shot list in section 6; prompts in `docs/candid-prompt-pack.json`.

## 2. What the site has today

| Measure | Result |
|---|---|
| Pages built | 34 (151 files, 6.5 MB) |
| Images in the gallery | 22: 10 real or archive (including one designed poster) and 12 AI |
| AI images that show Mbanda | 6 of 12 (hero, journal, community, portrait, riverside, open road) |
| AI images with no face | 6 of 12 (highlands, forest, evening, footsteps, learning, essentials) |
| Pages with a picture in the page body | 8 of 34 (home 8 distinct pictures, gallery 22, Faith in Motion 7, the other five 1 to 3) |
| Pages with only a CSS banner | 17. In all, 22 pages use a banner, drawn from 8 AI backdrops. All five journey pages share the same "road" banner. Live, Media and Field notes share the "journal" banner. |
| Pages with no picture at all | 9: 404, admin, studio, and the six older journal posts |
| Live journal entries | 0 (`src/data/journal.json` is `[]`); progress has no checkpoints |
| Shop products | 5, all enquiry-led, none with its own photograph; the shop page shows one concept image |
| Image weight in `src/img` | 5.4 MB, 77 WebP files. Each AI set costs about 246 KB across 3 widths. |

## 3. Findings

1. **The real photographs are thin and awkward.** Four of the ten carry a tracker overlay or a poster layout, a fifth is a cropped video still, and none is wider than 1080 px. They cannot hold a full-bleed hero, which is likely why AI images fill the heroes.
2. **The AI set reads as advertising.** Every Mbanda image puts him centred or on the right third in golden light with mist; the hero, community and riverside images have him facing or walking toward the lens, and the rest are composed profiles. The "community" image shows three invented, laughing companions beside him. There is no work, no rest, no meal, no roadside conversation, no one with their back turned.
3. **Candid and genuine material is missing from the pages that need it.** Journeys, Live, Community, Get involved, Partners, Media, Reports and all six older journal posts have no photograph in the page. The "Latest from the road" cards are text only.
4. **Banners repeat.** Eight AI backdrops serve 22 pages. They are CSS backgrounds, so they have no alt text and cannot be tuned per page.
5. **Labelling is weaker than Spear Line's.** The gallery caption says "Created with AI for this website" and the footer says campaign imagery includes AI-generated artwork. But the **home hero's own caption reads "Campaign artwork created from supplied photographs"**, which does not say AI, and the other pages carry only a small "Campaign artwork" tag. Nothing enforces any label: `tools/browser_check.py` tests that the artwork filter works, not that labels exist.
6. **Delivery can improve.** WebP only (no AVIF), widths up to 1913 px for banners, and the gallery loads every tile on one page. At 57 images the gallery needs paging or a "show more" control.
7. **The authentic route already exists and is unused.** The GitHub journal form takes photograph attachments (`journal.yml`, `docs/PUBLISHING.md`). With no entries yet, the real candid supply has not started.

## 4. The Spear Line recipe, and how this site compares

| | Spear Line, 9 Nov founder set | Walking Rotarian, 7 Nov campaign set |
|---|---|---|
| Moment | Mid-task: on a call, reading, choosing tomatoes, inspecting timber | Walking toward the camera, smiling to camera, seated and posed |
| Attention | Looks away from the lens in 7 of 10 (the portrait looks at it; two are unclear at thumbnail size) | Hero, community and riverside face or walk toward the lens; the rest are composed profiles |
| Other people | Present, cropped, turned away, in the way | Absent, or invented companions who pose |
| Setting | Untidy and real: rust, puddles, market clutter | Clean, lit, scenic |
| Light | Ordinary, overcast, muted | Golden hour, mist, saturated green |
| Framing | Off-centre, found obstructions in the foreground | Centred or right third, clear foreground |
| Wardrobe | Several outfits across the set | One vest throughout (good for recognition) |
| Label | "Joh Ayom, AI-generated image" on every picture, plus a note, enforced by a unit test (commit message) | Gallery caption and footer note; the home hero caption does not say AI; no test |
| Source rule | Real approved photography first, AI fills gaps (`docs/V12-IMAGE-PRODUCTION.md`); Joh to approve the set before launch (`ASSETS.md`) | Same intent, not written down as a rule for this site |

## 5. Rules the new images must keep

From this site's README and Spear Line's `docs/V12-IMAGE-PRODUCTION.md`:

1. **Approval first.** Mbanda approves the likeness set in writing before anything is published. These are invented moments of a real person.
2. **Label every AI image** with its caption, on every page it appears, and add a test that fails without it.
3. **No claims.** No distances, stages, places, events, dates or milestones in any scene. The Dar es Salaam walk stays a proposal. Walk for Education stays "planned route, not distance walked". For that reason **AI pictures of Mbanda stay off the individual journey pages**: a generated image of him on the road, placed on the Walk for Education page, would read as progress that has not been confirmed. Journey pages keep real photographs (Faith in Motion already does) plus, at most, a scenery banner. AI scenes of him appear on the home, hub and gallery pages, labelled.
4. **No children's faces and no beneficiaries.** The README already flags the real Kiburara photographs. Do not generate pupils, classrooms with pupils, refugees, or people with disabilities. Walk for Education and the Ishekye and Nakivale walks raise money, and invented beneficiaries would read as evidence. Those six older journal posts get real photographs, or none.
5. **No Rotary or PCI marks** in generated images. The footer says this is not an official Rotary International website. A real photograph that shows a club badge is a different matter.
6. **Nothing in Mbanda's voice.** Captions describe the picture. They never quote or speak for him.
7. **Check every image** for stray text, hands, boots, duplicate people, likeness against the reference photographs, and anything that reads as a real place.

## 6. The plan: 57 images

| Tier | Count | What |
|---|---|---|
| Real, kept | 10 | portrait, river-crossing, evening-road, arrival-celebration, kiburara-procession, kiburara-crowd, three route records, poster-345 |
| AI scenery, kept | 6 | highlands, forest, evening, footsteps, learning, essentials |
| AI scenery and objects, new | 16 | route scenery and gear, no person |
| AI with Mbanda, new | 25 | candid scenes; includes 6 remakes of the glossy images, which are then retired |
| **Total on the site** | **57** | |

Real photographs replace AI ones one for one as they arrive. The total stays above 50.

### Set A: On the road (10)

| # | Image | Shape | Scene | Where it goes |
|---|---|---|---|---|
| A01 | `road-phone-check` | 3:2 | Mid-stride along a tarmac verge, looking down at his phone to check the route. A boda-boda rider passes close in the foreground, motion-blurred and cropped at the frame edge. | Gallery; Journeys index card |
| A02 | `road-bootlace` | 3:2 | Crouched at the road edge retying a boot lace, backpack on the ground beside him, eyes on the lace. A minibus taxi is stopped in the soft background. | Gallery; Live page explainer |
| A03 | `road-water-fill` | 3:2 | Filling a water bottle from a jerrycan at a roadside kiosk, head bowed to the task. A woman behind him, turned away, is arranging tomatoes. | Gallery; Community page |
| A04 | `road-produce-stall` | 3:2 | Walking past a roadside produce stall, head turned toward something off-frame left. A vendor’s arm enters the frame. | Gallery; Get involved page |
| A05 | `road-footbridge-back` | 2:3 | Seen from behind on a plank footbridge over a small river, mid-stride. One pedestrian pushing a bicycle comes the other way. | Gallery; Journeys index |
| A06 | `road-rest-culvert` | 4:5 | Sitting on a concrete culvert in open shade, backpack open, eating a chapati from paper, looking down the road and not at the camera. | His story page; Gallery |
| A07 | `road-map-boda` | 3:2 | Holding a phone map against the wind while a boda-boda rider, in profile, points the way. Both adults look down the road. | Gallery; Live page |
| A08 | `road-long-truck` | 16:9 | Very wide view: a tiny figure far along a long red-earth road, a loaded truck passing in the foreground. Flat overcast light, large quiet sky for a headline. | Journeys index banner |
| A09 | `road-heel-tape` | 3:2 | Close detail: hands taping a heel with medical tape beside worn boots. No face. | Field notes page; Gallery |
| A10 | `road-predawn-stretch` | 2:3 | Pre-dawn calf stretch against the wheel arch of a parked minibus at a taxi stage, dim blue light. A vendor lights a charcoal stove behind him. | Live page; Gallery |

### Set B: People met along the way (adults only) (8)

| # | Image | Shape | Scene | Where it goes |
|---|---|---|---|---|
| B01 | `met-veranda-elders` | 3:2 | On a veranda bench listening to two older men, seen in profile, leaning forward with hands clasped. The men are mid-conversation, not posing. | Community page; Gallery |
| B02 | `met-trestle-table` | 3:2 | At a trestle table in a small hall reviewing papers with two volunteers (side and back views). Plastic chairs, a ceiling fan, no readable text. | Get involved page; Partners page |
| B03 | `met-joined-walkers` | 3:2 | Walking alongside two adult companions who have joined him, one carrying a water jug. They are talking, shot from behind-left, none looking at the camera. | Community page; Gallery |
| B04 | `met-tea-kiosk` | 3:2 | At a tea kiosk receiving a cup from a vendor. Hands and cup in sharp focus, his face partly in shadow. | Gallery; Media page |
| B05 | `met-notice-board` | 3:2 | Reading a weathered notice board outside a trading centre (writing illegible and out of focus), arms folded, others walking past. | Gallery; Reports page |
| B06 | `met-notebook-market` | 4:5 | Sitting on a wooden bench writing in a notebook while a market bustles behind him, shallow depth of field. | Live page; Gallery |
| B07 | `met-phone-call` | 2:3 | Roadside phone call, one hand shading his eyes, backpack straps on, a parked pickup behind him (no plate). | Gallery; Contact blocks |
| B08 | `met-greeting` | 3:2 | Pausing to greet a woman carrying a basket on her head. Both smile at each other, turned three-quarters away from the camera. | Community page; Gallery |

### Set C: Rest and recovery (5)

| # | Image | Shape | Scene | Where it goes |
|---|---|---|---|---|
| C01 | `rest-unlacing` | 3:2 | Evening, seated on a guesthouse step unlacing a boot, a plastic basin and towel beside him, eyes on the boot. | Live page; Gallery |
| C02 | `rest-foot-soak` | 3:2 | Both feet soaking in a basin on concrete, boots and socks drying on the wall. No face. | Field notes page; Gallery |
| C03 | `rest-eatery-charging` | 3:2 | At a roadside eatery table charging a phone from a power bank, a plate of rice and beans in front of him. Fluorescent light, dusk at the window. | Gallery; Shop page |
| C04 | `rest-lodging-gear` | 3:2 | A bedroll and gear laid out on a narrow bed in a simple lodging room, window light. Backpack, boots and a folded headwrap. No face. | Journeys page; Gallery |
| C05 | `rest-reading-bulb` | 4:5 | Reading a worn paperback under a single bulb in a lodging doorway at dusk, looking down. | His story page; Gallery |

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

| # | Image | Shape | Scene | Where it goes |
|---|---|---|---|---|
| R01 | `remake-home-hero` | 16:9 | Walking along a tarmac verge on the right third, past a parked boda-boda, looking ahead and to the left. Ordinary morning light. Left half open for the headline. | Home hero (replaces campaign-hero) |
| R02 | `remake-live-banner` | 16:9 | At a roadside kiosk counter writing in a notebook while the vendor wraps an item. Looks down, three-quarter profile on the right third, left side open. | Live and journal banner (replaces campaign-journal) |
| R03 | `remake-community-banner` | 16:9 | Walking with two adult companions, mid-conversation, seen from slightly behind. One gestures. No one faces the camera. Left third open. | Community banner (replaces campaign-community) |
| R04 | `remake-portrait` | 4:5 | Sitting on a culvert drinking from a bottle, looking off-frame across a field. Unposed. | Home and His story portrait (replaces campaign-portrait) |
| R05 | `remake-riverbank` | 3:2 | Standing at a riverbank, hands on hips, assessing the crossing, in profile from a distance. | Home visual story (replaces campaign-riverside) |
| R06 | `remake-narrow-path` | 16:9 | Stepping aside on a narrow ridge path as an adult farmer with two goats passes. Both look forward. Slight telephoto, small figure. | Closing band (replaces campaign-open-road) |

### Real photographs to ask Mbanda for (the 12 that beat any AI image)

Send through the journal form, ticking the approval box. Anyone who is recognisable must have agreed, and no child's face.

1. His boots at the start of a day.
2. The road ahead from where he stands.
3. A bottle being filled.
4. His notebook open.
5. A meal at a roadside eatery.
6. A bridge or river he crossed.
7. A phone map or route screenshot with the overlay cropped.
8. A companion's shoes beside his.
9. A sunrise start.
10. A market he passed (no faces without consent).
11. His pack laid out the night before.
12. A tea stop with the person who served it, with their permission.

## 7. Prompts

The full pack is `docs/candid-prompt-pack.json` (41 shots, one shared style block, one identity block, one negative block). Each prompt is assembled as: style, the scene, the identity block (people shots only), the negative block, the aspect ratio.

**Style block**

> Unposed documentary photograph, 35mm lens, ordinary natural daylight (overcast or open shade preferred), muted honest colour, real texture on skin, cloth, dust and metal, slightly imperfect framing with the subject off-centre. His attention is on the task or the road, not the camera. Any other people are adults shown from behind, in profile or partly cropped, and are doing something of their own. The foreground may be partly blocked by a passing object or person. Believable Ugandan roadside and trading-centre settings. The look of a photojournalist's contact sheet, not an advertisement.

**Negative block**

> No text, numbers, signs, banners, logos, Rotary or club emblems, licence plates, mileage or tracker overlays. No children's faces. No named place, stage, milestone or event. No golden-hour glow, mist, light shafts or lens flare. No looking into the lens. No staged laughing group, no handshake pose, no hero pose. No extra fingers, no duplicated people, no melted hands or boots.

Captions: people shots read "Mbanda Shyaka, AI-generated image"; scenery and object shots read "AI-generated illustration". Both are followed by: "Illustrates the walks. Not a record of a specific place, day, stage, person or project."

## 8. What changes in the repository once images exist

1. `tools/make_scenes.py`: ingest masters, write WebP at 480, 960 and 1400 (1672 for heroes only) and AVIF beside them, update `src/img/manifest.json`. Suggested budget: 40 KB at 480, 90 KB at 960, 170 KB at 1400. Estimate, not measured: 41 sets at today's 246 KB is about 10 MB of extra files, and about 8 MB if non-hero images stop at 1400 px. Serving AVIF first with WebP as fallback cuts what a visitor downloads, at the cost of more files in the repository.
2. `src/data/campaign-artwork.mjs`: add a `subject` field (`mbanda` or `none`) and generate the caption from it.
3. `src/data/gallery.mjs`: add filters "Photographs", "AI scenes" and "Scenery"; show 24 tiles then "Show more".
4. `src/assets/visuals.css`: replace the six shared `page-head--*` banners with per-page banners from the new set.
5. Pages: journey cards (scenery only), Live, Community, Get involved, Partners, Media, Reports and His story gain pictures with real alt text. Individual journey pages keep real photographs only.
6. `tests/`: a test that every AI image shown on any page has its visible caption (the Spear Line approach), and that no page references an image missing from the manifest.
7. Run `node build.mjs`, `node tools/check_site.mjs`, `node --test tests/*.test.mjs` and `python3 -I tools/browser_check.py`.

## 9. Decisions needed from the owner

1. **Approval of the likeness approach.** Is Mbanda happy to have an AI-generated set of invented candid moments published, labelled, on his site?
2. **Who generates.** This session has no image-generation tool. The Walking Rotarian set was made with a built-in image tool (`campaign-prompts.json`). Spear Line's 26 October set used Zapier's ChatGPT image action on the owner's OpenAI account (`ASSETS.md`); how its founder set was made is not recorded. Either route can run the prompt pack, but that sends Mbanda's reference photographs to an outside service and spends credits.
3. **Count and mix.** 57 is a recommendation. A smaller first batch (the 6 remakes plus Sets A and D, 23 images) would fix the homepage and gallery first.
4. **Archive permissions.** Two further real photographs exist in `cartelug/pdm` and are not on this site: `friends-of-st-joseph-rwembyo-poster.jpg` (1079 x 608) and `kagando-campus.webp` (750 x 499, from a proposal). Both need permission before use.

## 10. What I did not verify

- I opened the Faith in Motion and Walk for Education folders of `cartelug/pdm` and read its provenance note for the rest. I did not open all of its roughly 1,080 files.
- I looked at the Spear Line images at 480 px only, and did not judge how well they resemble Joh Ayom.
- I did not test the Walking Rotarian AI images against the real photographs for likeness.
- I have not seen Mbanda's own wishes, or PCI's, on any of this.
- Screenshots were taken locally with reduced motion; I did not run the Chromium check suite, Lighthouse, or any test on a phone.
