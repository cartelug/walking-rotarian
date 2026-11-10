# Image generation protocol

Version 1, 9 November 2026. **This is a protocol only. Nothing has been generated, and nothing has been sent to any image service.** It governs every AI picture made for the Walking Rotarian website. Where a rule below is marked *proposed*, it is my suggestion and the owner can change it.

Companion files: `docs/prompts-ready.md` (the prompts), `docs/candid-prompt-pack.json` (their source), `src/data/image-register.json` (the record), `docs/generation-log.csv` (the log), `docs/IMAGE-PLAN.md` (the plan).

## 1. Principles

1. **The original photographs overrule everything.** A generated picture is judged against the authentic portrait and walking photographs, never against another generated picture.
2. **Accuracy beats polish.** A plain picture that looks like Mbanda is better than a beautiful one that looks like someone else.
3. **Invented moments are labelled as invented,** on every page where they appear, and are never presented as a record of a day, place, stage or event.
4. **No claims.** No distance, stage, milestone, named place, date or event in any picture.
5. **No children's faces,** and no invented beneficiaries, refugees or people with disabilities.
6. **No Rotary, Rotarian, Rtn., Club of Akright City or wheel marks** in any derivative image. The fabric is reconstructed naturally.
7. **Real photographs come first.** A generated picture only fills a slot that no usable real photograph can fill.

## 2. Roles

| Role | Who | Does |
|---|---|---|
| Owner | The site owner | Starts a run, keeps the register and the log, decides what is placed |
| Generator | Whoever uses ChatGPT Images (the owner, or someone the owner names) | Runs the prompts exactly as written, logs every attempt |
| Reviewer | A person who knows Mbanda's face, such as the owner or family | Compares each result with the portrait and passes or rejects it. **The face check cannot be done by software.** |
| Director | Mbanda Shyaka | Directed the work. He may look at the pilot if he wants to. No sign-off is needed. |
| Second reader | Claude, if the pictures are shared in the conversation | Checks everything except identity: stray text, hands and boots, Rotary marks, children, place claims. Gives an opinion on likeness only if the portrait is shared too, and that opinion never replaces the Reviewer. |

## 3. Before any run (gate G0)

All of these must be true. If one is not, stop.

- [ ] ChatGPT can reach the Drive folder (or the six reference files are attached by hand). Their names and sizes match the pack: `Shyaka_Mbanda_Portrait_Reference.jpeg` (152,850 bytes), `22-23.jpg.jpeg` (760,612), `22-24.jpg.jpeg` (920,386), `22-29.jpg.jpeg` (642,980), `22-9.jpg.jpeg` (693,701), `22-10.jpg.jpeg` (723,396).
- [ ] The register has a row for the picture, with status `planned`.
- [ ] The prompt is taken from `docs/prompts-ready.md` made from the current `docs/candid-prompt-pack.json`. Note the commit.
- [ ] The tool and model are recorded as shown in the app on the day (for example "ChatGPT Images", with the date).

## 4. Running one picture

The **one-prompt route** (`docs/ONE-PROMPT.md`) follows the same rules: one chat, one picture per reply, references read from the Drive folder (or attached), `next` to continue and `redo` to repeat a picture from the originals.

For a **person picture** run on its own:

1. Open a **new chat**. Never continue an old one.
2. **Attach the listed inputs, portrait first.** The attach list is in `docs/prompts-ready.md`. Typical sets: front or unestablished poses take portrait + `22-23`; side poses take portrait + `22-24`; rear poses take portrait + `22-29`. Add `22-9` or `22-10` only for a broad smile. **Never attach a generated picture or a generated reference sheet as an identity input.**
3. Paste the prompt unchanged. Ask for the size shown (1536 x 1024 or 1024 x 1536). The 16:9 and 4:5 shapes are cropped afterwards by `tools/make_scenes.py`.
4. Generate **one** picture.
5. Review it (section 6). If it passes, go to section 8. If it fails, log the rejection codes and go to step 6.
6. **Regenerate from the originals,** in a new chat, with the same inputs and prompt. Never feed the failed result back in. A single local fix to one defect is allowed (for example a malformed hand), with the face protected and the portrait re-attached.
7. **At most three attempts per picture** *(proposed)*. After three failures, mark the picture `blocked` in the log, note why, and move on. Do not tune the prompt to chase a result; bring the problem to the Owner.

For a **scenery or object picture** (no person): the same steps with no inputs attached and the no-person prompt. The review in section 6 skips the identity items.

## 5. The pilot

The pilot is the first six pictures of the run (P01 to P06), the shots marked `pilot` in the pack: `remake-home-hero`, `remake-live-banner`, `remake-community-banner`, `remake-riverbank`, `road-phone-check`, `met-phone-call`. They cover front, side and rear views. No other person picture is run until the pilot is decided.

**Decision rule** *(proposed)*:

- **Pass:** all six pass the review within three attempts, and the Reviewer judges the set a fair likeness. Waves 2 and 3 may begin.
- **Revise:** one or two pictures fail on identity after three attempts. Stop. The Owner and Reviewer decide whether to change the inputs (for example add the expression photograph, or a second body view), keep the pose closer to an observed view, or replace the shot with a real photograph. Then run the pilot again.
- **Stop:** three or more fail, or the Reviewer (or Mbanda, if he looks) is unhappy with the set. No more person pictures are made. The site keeps real photographs and scenery.

## 6. The review gate (G1)

Review at **full size** and at the **size it will be shown** (phone and desktop). Compare with the portrait at a similar face size and angle. Record one pass or fail per line.

**Identity** (person pictures; skip if the face is hidden, and say so)

| # | Check |
|---|---|
| I1 | Face outline, forehead, temples and cheeks: not wider or squarer |
| I2 | Eyes: spacing, size, lids, natural asymmetry, under-eye texture |
| I3 | Brows: natural, not sculpted or symmetrical |
| I4 | Nose: bridge, tip, nostrils, width |
| I5 | Mouth: lips, moustache overlap, and a smile that matches an observed expression |
| I6 | Teeth: natural, not uniformly white |
| I7 | Beard and moustache: outline, length, uneven grey |
| I8 | Complexion and skin texture: no de-ageing, smoothing or invented pores or scars |
| I9 | Headwrap, locs and glasses: as in the originals |
| I10 | Neck width and head-to-body scale: no thick neck or large head |
| I11 | Body: lean frame, natural shoulders, slim arms; no muscular bulk and no over-slimming |

**Picture** (all pictures)

| # | Check |
|---|---|
| P1 | No readable or half-readable text, numbers, signs, logos or tracker overlays |
| P2 | No Rotary, Rotarian, Rtn., club or wheel marks, and the fabric looks natural |
| P3 | Hands, fingers, boots, bags: correct; no extra or merged parts; no duplicated people |
| P4 | Any other person is an adult, from behind, in profile or partly cropped; **no child's face** |
| P5 | No named place, stage, milestone or event; nothing that reads as a real, identifiable location |
| P6 | Candid: his attention is on the task, not the camera (unless the shot says otherwise); muted ordinary light; no glamour glow, mist or light shafts; not a hero pose |
| P7 | Composition does what the slot needs (for example open space for a headline) |
| P8 | The label that will be shown matches the picture ("Mbanda Shyaka, AI-generated image" or "AI-generated illustration") |

**Reject outright:** a polished generic lookalike, a younger version, a widened face, an overgrown beard, a changed smile, or body inflation (the Drive standard's own list). Record any limitation (a soft or hidden face) rather than inventing detail.

**Rejection codes** for the log: `I1` to `I11`, `P1` to `P8`, plus `R0` for "looks like someone else" and `R9` for "other". Use the code of the first failing line and list others in the note.

## 7. Order and stop rules

1. The first run is the **30 pictures in `docs/ONE-PROMPT.md`**. P01 to P06 are the pilot, P07 to P12 are the other Mbanda pictures, and P13 to P30 show no Mbanda (scenery, gear and other adults). P13 to P30 carry no identity risk, so they can also be run first, in a separate chat.
2. After P06, decide (section 5) before going on.
3. The other 16 prepared pictures are **reserve**. Before using any of them, check which slots real photographs have filled.
4. **Seated and crouched poses are all in reserve.** No original shows them, so identity drift is most likely. Run them last, if at all.
5. **Stop and report** if two pictures in a row fail on identity, if the tool changes its behaviour or model, or if credits run low.

## 8. After a picture passes

1. **Export a JPEG at quality 92** (about 400 to 600 KB) from the PNG, named `<id>.jpg`, and keep the original PNG in Drive. *Reason: 41 PNG masters of 2 to 3 MB would add about 100 MB to a public repository.*
2. Put the exports in one folder. Run `node tools/ingest-drive.mjs <folder>` to see the plan, then with `--write`.
3. Run `python3 -I tools/make_scenes.py`.
4. In `src/data/image-register.json`, for each picture set `generation.gate` to `passed`, `branding.removed` to `true`, and add `reviewedBy` and `reviewedOn`.
5. Run `node tools/check_images.mjs`, then `node build.mjs`, `node tools/check_site.mjs` and `node --test tests/*.test.mjs`.
6. Placing the picture on a page is a separate step. **AI pictures of Mbanda never go on an individual journey page.**

## 9. The log

Every attempt, pass or fail, gets one row in `docs/generation-log.csv`:

| Column | Content |
|---|---|
| `date` | Day of the attempt |
| `picture_id` | The register id |
| `attempt` | 1, 2 or 3 |
| `tool` | Tool and model as shown in the app |
| `inputs` | File names attached, in order |
| `prompt_commit` | Git commit of the prompt pack used |
| `result_file` | Name the result was saved under |
| `outcome` | `pass`, `fail` or `blocked` |
| `codes` | Rejection codes (section 6) |
| `reviewer` | Who reviewed |
| `note` | Anything the next person needs |

## 10. Retiring a picture

Retire a picture, and rebuild the site, if Mbanda or the family asks, if a later review finds identity drift, or if a real photograph becomes available for the same slot. Set its status to `retired` in the register, remove it from the pages, and add a note. Keep its log rows.

## 11. If the Zapier route is ever chosen

Not authorised. It would apply only to scenery and objects. The ChatGPT action on this account offers `gpt-image-1` and `gpt-image-1.5`, sizes 1024x1024, 1536x1024 and 1024x1536, and a single source image, so it cannot carry the reference pack. Use quality `high`, moderation `auto`, and follow sections 4 (no-person steps), 6, 8 and 9. It spends the owner's OpenAI credits.

## 12. What I could not check

- I have not seen the six reference photographs, so the attach table follows the owner's rule files, not my own viewing.
- The attempt limit, the pilot decision rule and the JPEG export rule are my proposals.
- ChatGPT Images' behaviour (sizes, number of attachments, model name) is as the owner described it; I have not tested it.
