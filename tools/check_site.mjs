// Checks the built site: links, images, headings, ids, labels and leftover placeholder text.
// Run:  node tools/check_site.mjs        (build first with: node build.mjs)
//       node tools/check_site.mjs --list-links   (also prints every outside link, to click through before launch)
import fs from "node:fs";
import path from "node:path";
import { loadRegister, validateRegister, auditBuiltPages } from "../src/lib/image-register.mjs";

const root = path.resolve(process.argv.slice(2).find((a) => !a.startsWith("--")) || "dist");
const base = (process.env.BASE_PATH || "").replace(/\/+$/, ""); // site lives under a sub-folder, e.g. GitHub Pages
const problems = [];
const notes = [];
const externals = new Map();
const bad = (page, msg) => problems.push(`${page}: ${msg}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const files = walk(root);
const pages = files.filter((f) => f.endsWith(".html"));
const idsByPage = new Map();
const htmlOf = new Map();
for (const f of pages) {
  const html = fs.readFileSync(f, "utf8");
  htmlOf.set(f, html);
  idsByPage.set(f, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

const resolveTarget = (fromFile, url) => {
  const [p0, hash] = url.split("#");
  const p = p0.split("?")[0];
  let target = p === "" ? fromFile : path.resolve(path.dirname(fromFile), p);
  if (p.startsWith("/")) target = path.join(root, base && p.startsWith(base + "/") ? p.slice(base.length) : p);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
  return { target, hash };
};

for (const f of pages) {
  const page = "/" + path.relative(root, f);
  const html = htmlOf.get(f);
  const body = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");

  if (!/<html lang="[a-z-]+"/.test(html)) bad(page, "missing lang");
  if (!/<title>[^<]{5,}<\/title>/.test(html)) bad(page, "missing or short title");
  if (!/<meta name="description" content="[^"]{30,}"/.test(html)) bad(page, "missing or short description");
  const h1s = (body.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) bad(page, `expected one h1, found ${h1s}`);

  let prev = 0;
  for (const m of body.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(m[1]);
    if (prev && lvl > prev + 1) bad(page, `heading jumps from h${prev} to h${lvl}`);
    prev = lvl;
  }

  const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) bad(page, `duplicate ids: ${[...new Set(dup)].join(", ")}`);

  for (const m of body.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0];
    if (!/\salt="/.test(t)) bad(page, `image without alt: ${t.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(t) || !/\sheight="\d+"/.test(t)) bad(page, `image without width/height: ${t.slice(0, 80)}`);
  }
  for (const m of body.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g)) {
    for (const id of m[1].split(/\s+/)) if (!idsByPage.get(f).has(id) && !/-err$/.test(id)) bad(page, `aria reference to missing id "${id}"`);
  }
  for (const m of body.matchAll(/<label[^>]*\sfor="([^"]+)"/g)) if (!idsByPage.get(f).has(m[1])) bad(page, `label for missing id "${m[1]}"`);

  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  const srcsets = [...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+/)[0]));
  for (let url of [...refs, ...srcsets]) {
    url = url.replace(/&amp;/g, "&");
    if (/^https?:/.test(url)) {
      externals.set(url, (externals.get(url) || 0) + 1);
      continue;
    }
    if (/^(mailto:|tel:)/.test(url)) continue;
    const { target, hash } = resolveTarget(f, url);
    if (!fs.existsSync(target)) {
      bad(page, `broken link or file: ${url}`);
      continue;
    }
    if (hash && target.endsWith(".html") && !idsByPage.get(target)?.has(hash)) bad(page, `link to missing anchor: ${url}`);
  }
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) bad(page, "target=_blank without noopener");

  const text = body.replace(/<[^>]+>/g, " ");
  for (const re of [/lorem ipsum/i, /\bTODO\b/, /\bundefined\b/, /\[object /, /\bNaN\b/, /\{\{|\}\}/, /→|↗/]) {
    if (re.test(text)) bad(page, `suspicious text matches ${re}`);
  }
}

const sizes = files.map((f) => [f, fs.statSync(f).size]);
const total = sizes.reduce((n, [, s]) => n + s, 0);
notes.push(`${pages.length} pages, ${files.length} files, ${(total / 1024 / 1024).toFixed(2)} MB total`);
notes.push(`${externals.size} distinct external links (not fetched by this check)`);
const bigPages = pages.map((f) => [path.relative(root, f), fs.statSync(f).size]).filter(([, s]) => s > 90 * 1024);
if (bigPages.length) notes.push("large html: " + bigPages.map(([n, s]) => `${n} ${(s / 1024).toFixed(0)}KB`).join(", "));

// The image register: permissions, claims, labels, and AI artwork named as AI on every page that shows it.
{
  const imgRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const reg = loadRegister();
  const manifest = JSON.parse(fs.readFileSync(path.join(imgRoot, "src", "img", "manifest.json"), "utf8"));
  for (const p of validateRegister(reg, { root: imgRoot, manifest })) bad("image register", p);
  for (const p of auditBuiltPages(root, reg)) bad("AI label", p);
}

console.log(notes.join("\n"));
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(" - " + p);
  process.exit(1);
}
console.log("\nNo problems found.");
if (process.argv.includes("--list-links")) console.log("\nExternal links, to click through before launch:\n" + [...externals.keys()].sort().join("\n"));
