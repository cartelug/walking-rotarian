// The image register: rules every picture must follow before it can appear on the site.
// The data is in src/data/image-register.json. Used by tools/check_images.mjs, tools/check_site.mjs and the tests.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const REGISTER_PATH = path.join(ROOT, "src", "data", "image-register.json");
export const loadRegister = (file = REGISTER_PATH) => JSON.parse(fs.readFileSync(file, "utf8"));
export const sha256File = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

const WITH_FILE = new Set(["ingested", "ready", "live"]);
const WITH_PIXELS = new Set(["ready", "live"]);
const isAI = (r) => /^generated-/.test(r.class);
const JOURNEY_PAGE = /^\/journeys\/[^/]+\/?$/;

/** Returns a list of problems. An empty list means the register follows its rules. */
export function validateRegister(reg, { root = ROOT, manifest = {} } = {}) {
  const problems = [];
  const bad = (id, msg) => problems.push(`${id}: ${msg}`);
  const seen = new Set();
  const states = new Set(Object.keys(reg.states || {}));
  for (const r of reg.images) {
    if (!r.id) { bad("(row)", "missing id"); continue; }
    if (seen.has(r.id)) bad(r.id, "duplicate id");
    seen.add(r.id);
    if (!r.class) bad(r.id, "missing class");
    if (!states.has(r.status)) bad(r.id, `unknown status "${r.status}"`);

    if (r.class === "news-linkonly" && (r.file || WITH_FILE.has(r.status))) bad(r.id, "news photographs are linked, never copied");
    if (r.people?.children === true && r.status !== "excluded") bad(r.id, "shows children");

    if (WITH_FILE.has(r.status)) {
      if (r.permission !== "approved") bad(r.id, `permission is "${r.permission}", not approved`);
      if (!r.file && !r.derivativesOnly) bad(r.id, "no file recorded");
      if (r.file) {
        const f = path.join(root, r.file);
        if (!fs.existsSync(f)) bad(r.id, `file missing: ${r.file}`);
        else if (r.sha256 && sha256File(f) !== r.sha256) bad(r.id, "checksum does not match the file");
      }
    }
    if (WITH_PIXELS.has(r.status)) {
      if (!manifest[r.id]) bad(r.id, "no entry in src/img/manifest.json");
      if (r.derive?.needsCropReview) bad(r.id, "crop has not been reviewed");
      if (r.class === "own-post" && !r.origin?.sourceUrl) bad(r.id, "own-post picture has no public source URL for its caption");
      const c = r.claim;
      if (c && ["underway", "proposed"].includes(c.journeyStatus) && c.stageApproved !== true) bad(r.id, `shows a stage of a ${c.journeyStatus} walk that is not approved`);
    }
    if (isAI(r) && r.status !== "excluded") {
      if (!/AI-generated/.test(r.label?.text || "")) bad(r.id, 'AI image has no "AI-generated" label');
      if (!["pending", "passed", "provisional"].includes(r.generation?.gate)) bad(r.id, "AI image has no review-gate state");
      if (WITH_PIXELS.has(r.status) && r.generation?.gate === "pending") bad(r.id, "AI image is placed before it passed the review gate");
      if (r.class === "generated-person" && WITH_PIXELS.has(r.status) && !r.generation?.provisional) {
        if (r.generation?.gate !== "passed") bad(r.id, "AI portrait has not passed the review gate");
        if (r.branding?.removed !== true) bad(r.id, "AI portrait has not recorded that Rotary and club marks were removed");
      }
      for (const p of r.placements || []) if (r.class === "generated-person" && JOURNEY_PAGE.test(p)) bad(r.id, `AI picture of Mbanda placed on a journey page (${p})`);
    }
    if (r.status === "planned" && r.match?.stem && r.match.stem !== r.id) bad(r.id, "match.stem must equal the id");
  }
  return problems;
}

/** Every built page that shows AI artwork must say so on the page. */
export function auditBuiltPages(distDir, reg) {
  const problems = [];
  const ids = reg.images.filter((r) => isAI(r) && WITH_PIXELS.has(r.status)).map((r) => r.id);
  const usesAI = new RegExp(`/assets/img/(?:${ids.join("|")})-\\d+\\.webp|page-head--art|hero--photographic|band--dark`);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(distDir).filter((x) => x.endsWith(".html"))) {
    const html = fs.readFileSync(f, "utf8");
    if (usesAI.test(html) && !/AI-generated/.test(html)) problems.push(`${path.relative(distDir, f)}: shows AI artwork but never says "AI-generated"`);
  }
  return problems;
}
