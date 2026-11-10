// Assembles the ChatGPT prompts from docs/candid-prompt-pack.json.
//
// Run:  node tools/assemble-prompts.mjs              writes docs/ONE-PROMPT.md (one prompt for the 30 pictures)
//                                                    and docs/prompts-ready.md (one prompt per picture, for redoing single pictures)
//       node tools/assemble-prompts.mjs road-bootlace  prints the full prompt for one picture
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "candid-prompt-pack.json"), "utf8"));
const F = "`".repeat(3);

// ChatGPT makes square, 3:2 and 2:3 pictures. Other shapes are cropped by tools/make_scenes.py.
const SHAPE = {
  "3:2": "landscape 1536 x 1024",
  "16:9": "landscape 1536 x 1024 (I will crop it to 16:9, so keep the subject away from the top and bottom edges)",
  "2:3": "portrait 1024 x 1536",
  "4:5": "portrait 1024 x 1536 (I will crop it to 4:5)",
};
const FILE = { portrait: "00_PRIMARY_Original_Face_Portrait.jpg", "body-front": "22-23.jpg.jpeg", "body-side": "22-24.jpg.jpeg", "body-rear": "22-29.jpg.jpeg", expression: "22-9.jpg.jpeg" };
const nn = (s) => "P" + String(s.order).padStart(2, "0");
const run = pack.shots.filter((s) => s.batch === "final30").sort((a, b) => a.order - b.order);

/** The full prompt for one picture, to paste into a new chat with the photographs attached. */
export function assemble(s) {
  const style = s.kind === "person" ? pack.styleBlock : s.subject === "others" ? pack.styleBlockOthers : pack.styleBlockNoPerson;
  return s.kind === "person"
    ? `${pack.identityBlock} Scene: ${s.scene} ${style} ${pack.negativeBlock} Aspect ratio ${s.aspect}.`
    : `${style} Scene: ${s.scene} ${pack.negativeBlock} Aspect ratio ${s.aspect}.`;
}

// ---- the one prompt ---------------------------------------------------------------------
function onePrompt() {
  const list = run.map((s) => [
    `${nn(s)} ${s.id}`,
    s.kind === "person" ? `Mbanda: yes. References: ${s.inputs.map((k) => FILE[k]).join(" + ")}.` : "Mbanda: no. Do not use the reference photographs.",
    `Shape: ${SHAPE[s.aspect]}.`,
    `Scene: ${s.scene}`,
  ].join("\n"));
  return [
    `You are going to make ${run.length} pictures for a website about Mbanda Shyaka, known as "the Walking Rotarian". Work through them one at a time, in order.`,
    "",
    "STEP 1. FIND THE REFERENCE PHOTOGRAPHS IN GOOGLE DRIVE",
    `Search my Google Drive for the folder "Shyaka Mbanda - Authoritative References - 2026-10-28". It is inside: PCI > Walk for Education > PCI - Walk for Education - Project Hub > 05 Photos and Videos.`,
    "First read the two text files in that folder, READ_FIRST_SHYAKA_REFERENCE_RULES.txt and SHYAKA_FACE_IDENTITY_STANDARD.txt, and follow them. Then open these photographs. They are the authority, and they overrule everything else, including any picture you make:",
    "- 00_PRIMARY_Original_Face_Portrait.jpg: his face, glasses off. (It is also named Shyaka_Mbanda_Portrait_Reference.jpeg.)",
    "- 22-23.jpg.jpeg: front three-quarter view, walking, glasses on.",
    "- 22-24.jpg.jpeg: side view, walking.",
    "- 22-29.jpg.jpeg: rear view, walking (headwrap knot, locs, backpack).",
    "- 22-9.jpg.jpeg and 22-10.jpg.jpeg: group photographs, for his smile. He is second from the right, with the black headwrap and amber glasses. The stockier man beside him is NOT him.",
    `The folder also holds three generated "Reference Sheet" images. Ignore them. Never use a picture you made earlier as a reference for his face or body.`,
    `If you cannot find that folder, the same photographs are in "THE WALKING ROTARIAN — Mbanda Shyaka Website" > "05 — Deep Research & Photo Archive — 31 Oct 2026" > "01 — Original Photo References" (named Original_reference_22-23.jpg.jpeg and so on).`,
    "If you cannot reach my Drive, or cannot use those photographs as references when you make a picture, STOP and tell me before making anything.",
    "",
    "STEP 2. THE RULES FOR EVERY PICTURE",
    `For pictures marked "Mbanda: yes" (in the text below, "the attached photographs" means the Step 1 photographs):`,
    pack.identityBlock,
    pack.styleBlock,
    `For pictures marked "Mbanda: no":`,
    pack.styleBlockOthers,
    "For every picture:",
    pack.negativeBlock,
    "Before every picture that includes Mbanda, look at the portrait and the listed body photograph again. Do not rely on the earlier pictures in this chat.",
    "",
    "STEP 3. HOW TO WORK",
    "- Make ONE picture per reply, in the shape given. Do not put any text, logo or caption in a picture.",
    `- Under each picture write one line, for example "P01 remake-home-hero done", and add anything you were unsure about. Then wait for me to type "next".`,
    `- If I type "redo", make that picture again from the original reference photographs, not from your last result. If I type "stop", stop.`,
    "- Pictures P01 to P06 come first so that I can check his likeness. Do not skip ahead.",
    "",
    `STEP 4. THE ${run.length} PICTURES`,
    "",
    list.join("\n\n"),
  ].join("\n");
}

// ---- per-picture prompts ----------------------------------------------------------------
const attach = (s) => (s.kind === "person" ? s.inputs.map((k) => FILE[k]).join(" + ") : "none");
const block = (s) => `### ${nn(s)} ${s.id}${s.pilot ? " (pilot)" : ""}

- **Shape:** ${s.aspect}. Ask ChatGPT for ${SHAPE[s.aspect].split(" (")[0]}${s.aspect === "16:9" || s.aspect === "4:5" ? `; cropped to ${s.aspect} afterwards` : ""}.
- **Attach:** ${attach(s)}
- **Save as:** \`${nn(s)}_${s.id}.png\`
- **Label that will be shown:** ${s.caption}${s.poseBasis ? `\n- **Pose basis:** ${s.poseBasis}. Drift risk: ${s.driftRisk}.` : ""}

${F}text
${assemble(s)}
${F}
`;

const arg = process.argv[2];
if (arg) {
  const s = pack.shots.find((x) => x.id === arg);
  if (!s) { console.error("No such picture: " + arg); process.exit(2); }
  console.log(assemble(s));
} else {
  const prompt = onePrompt();
  fs.writeFileSync(path.join(ROOT, "docs", "ONE-PROMPT.md"), [
    "# One prompt for all 30 pictures",
    "",
    `Generated by \`node tools/assemble-prompts.mjs\` from \`docs/candid-prompt-pack.json\`. Edit the pack, not this file. **Nothing has been generated.** The rules for the run are in \`docs/GENERATION-PROTOCOL.md\`.`,
    "",
    `**${run.filter((s) => s.kind === "person").length} pictures show Mbanda, ${run.filter((s) => s.kind !== "person").length} do not** (scenery, gear and other adults). Pictures with Mbanda use his photographs from Drive; the others use none. Seated and crouched poses are held back, because no original photograph shows them.`,
    "",
    "## How to use it",
    "",
    "1. Open ChatGPT (with Google Drive connected) and start **one new chat**.",
    `2. Paste everything in the box below, as one message. ChatGPT should find his portrait and the other reference photographs in the PCI folder in your Drive, then stop and wait.`,
    `3. If it says it cannot reach Drive or cannot use the photographs, attach the photographs yourself (the file names are in Step 1) and send the same message again.`,
    `4. Type **next** for each picture. Check P01 to P06 against his portrait before you go on. Type **redo** to repeat one.`,
    `5. Save each picture as \`P01_remake-home-hero.png\` and so on (the number, an underscore, the id as written in the list). The ingest tool ignores the number.`,
    "6. In the repository: `node tools/ingest-drive.mjs <folder>`, then with `--write`; then `python3 -I tools/make_scenes.py`; then `node tools/check_images.mjs`.",
    "",
    "A long chat can drift. If a face starts to look wrong, start a new chat, paste the prompt again, and give it only the pictures still to do (keep the numbers).",
    "",
    "## The prompt",
    "",
    F + "text",
    prompt,
    F,
    "",
  ].join("\n"));

  const groups = [["Pilot: P01 to P06 (Mbanda, front, side and rear views)", (s) => s.order <= 6], ["P07 to P12 (Mbanda)", (s) => s.order > 6 && s.order <= 12], ["P13 to P30 (no Mbanda: scenery, gear and other adults)", (s) => s.order > 12]];
  const out = [`# One prompt per picture

Generated by \`node tools/assemble-prompts.mjs\` from \`docs/candid-prompt-pack.json\`. Edit the pack, not this file.

**The main route is \`docs/ONE-PROMPT.md\`.** Use this file only to redo a single picture in a new chat: attach the listed photographs from the Drive folder **Shyaka Mbanda - Authoritative References - 2026-10-28** (or let ChatGPT find them there), paste the full prompt, ask for the shape shown, and save the result as shown.

## Review gate

${pack.reviewGate.map((x) => "- " + x).join("\n")}
`];
  for (const [title, f] of groups) {
    const list = run.filter(f);
    out.push(`## ${title}\n\n${list.map(block).join("\n")}`);
  }
  const reserve = pack.shots.filter((s) => s.batch !== "final30");
  out.push(`## Held in reserve (${reserve.length})\n\nNot part of the first run. Their prompts are in the pack and can be printed one at a time with \`node tools/assemble-prompts.mjs <id>\`.\n\n${reserve.map((s) => `- \`${s.id}\`${s.poseBasis === "unestablished" ? " (seated or crouched: no original shows this pose)" : ""}`).join("\n")}\n`);
  fs.writeFileSync(path.join(ROOT, "docs", "prompts-ready.md"), out.join("\n"));
  console.log(`Wrote docs/ONE-PROMPT.md (${prompt.length} characters, ${run.length} pictures) and docs/prompts-ready.md.`);
}
