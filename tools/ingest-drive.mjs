// Brings downloaded pictures into the repository and matches each one to the image register.
//
// Run:  node tools/ingest-drive.mjs <folder>            shows what would happen
//       node tools/ingest-drive.mjs <folder> --write    copies the files and updates the register
//
// A file is matched, in this order, by: SHA-256 (already known), archive number at the start of the
// name (29_akright_city...jpeg), exact name (22-23.jpg.jpeg), or name without extension equal to the
// picture id (road-phone-check.png, saved from ChatGPT).
// Files whose row is excluded or whose permission is still pending are skipped. Nothing is overwritten
// unless the checksum matches or --force is given. After ingesting, run: python3 -I tools/make_scenes.py
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/** Width and height from the file header (PNG, JPEG, WebP). Returns null if unknown. */
export function imageSize(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  }
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const t = b.toString("ascii", 12, 16);
    if (t === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (t === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (t === "VP8L") { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
  }
  return null;
}

const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const norm = (s) => s.toLowerCase().replace(/_/g, "-");

/** Finds the register row for a file. Returns { row, by } or null. */
export function matchFile(reg, name, hash) {
  const base = path.basename(name), stem = norm(base.replace(/\.[^.]+$/, "")).replace(/^p\d{2}-/, ""); // "P05_road-phone-check.png" matches road-phone-check
  const byHash = reg.images.find((r) => r.sha256 === hash);
  if (byHash) return { row: byHash, by: "sha256" };
  const num = base.match(/^(\d{2})[_-]/);
  if (num) { const r = reg.images.find((x) => x.match?.archiveNo === num[1]); if (r) return { row: r, by: "archive number" }; }
  const byName = reg.images.find((r) => r.match?.name === base);
  if (byName) return { row: byName, by: "name" };
  const byStem = reg.images.find((r) => r.match?.stem && norm(r.match.stem) === stem);
  if (byStem) return { row: byStem, by: "picture id" };
  return null;
}

/** Plans the work for a list of files. Pure: reads files but writes nothing. */
export function planIngest(reg, files, { force = false, root = ROOT } = {}) {
  return files.map((file) => {
    const buf = fs.readFileSync(file), hash = sha(buf);
    const m = matchFile(reg, file, hash);
    const out = { file, bytes: buf.length, sha256: hash };
    if (!m) return { ...out, action: "skip", why: "no matching row in the register" };
    const r = m.row;
    out.row = r; out.by = m.by;
    if (r.status === "excluded") return { ...out, action: "skip", why: "row is excluded: " + (r.note || "") };
    if (r.permission !== "approved") return { ...out, action: "skip", why: `permission is "${r.permission}"` };
    if (r.sha256 === hash && fs.existsSync(path.join(root, r.file || "x"))) return { ...out, action: "skip", why: "already ingested" };
    if (r.file && r.sha256 && r.sha256 !== hash && !force) return { ...out, action: "skip", why: "a different file is already recorded; use --force to replace it" };
    if (!["planned", "candidate", "ingested"].includes(r.status)) return { ...out, action: "skip", why: `row is ${r.status}` };
    const ext = path.extname(file).toLowerCase().replace(".jpeg", ".jpg");
    return { ...out, action: "copy", dest: path.join("src", "img-original", r.id + ext), size: imageSize(buf) };
  });
}

export function applyIngest(reg, plan, { root = ROOT } = {}) {
  for (const p of plan.filter((x) => x.action === "copy")) {
    fs.mkdirSync(path.join(root, "src", "img-original"), { recursive: true });
    fs.copyFileSync(p.file, path.join(root, p.dest));
    Object.assign(p.row, { file: p.dest.split(path.sep).join("/"), bytes: p.bytes, sha256: p.sha256, status: "ingested", ingestedFrom: path.basename(p.file) });
    if (p.size) Object.assign(p.row, { width: p.size.w, height: p.size.h });
    if (/^generated-/.test(p.row.class)) p.row.generation = { ...p.row.generation, gate: "pending" };
  }
  return reg;
}

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const args = process.argv.slice(2), dir = args.find((a) => !a.startsWith("--"));
  if (!dir || !fs.existsSync(dir)) { console.error("Usage: node tools/ingest-drive.mjs <folder> [--write] [--force]"); process.exit(2); }
  const regPath = path.join(ROOT, "src", "data", "image-register.json");
  const reg = JSON.parse(fs.readFileSync(regPath, "utf8"));
  const files = walk(path.resolve(dir)).filter((f) => EXTS.has(path.extname(f).toLowerCase()));
  const plan = planIngest(reg, files, { force: args.includes("--force") });
  for (const p of plan) console.log(`${p.action === "copy" ? "COPY" : "skip"}  ${path.basename(p.file)}  ${p.row ? `-> ${p.row.id} (by ${p.by})` : ""}  ${p.why || p.dest}`);
  const n = plan.filter((p) => p.action === "copy").length;
  if (args.includes("--write")) {
    applyIngest(reg, plan);
    fs.writeFileSync(regPath, JSON.stringify(reg, null, 1) + "\n");
    console.log(`\nIngested ${n} file(s). Next: python3 -I tools/make_scenes.py`);
  } else console.log(`\n${n} file(s) would be ingested. Add --write to do it.`);
}
