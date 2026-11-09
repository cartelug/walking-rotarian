// Checks the image register against its rules.
// Run:  node tools/check_images.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegister, validateRegister } from "../src/lib/image-register.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "src", "img", "manifest.json"), "utf8"));
const reg = loadRegister();
const problems = validateRegister(reg, { root, manifest });

const count = {};
for (const r of reg.images) count[r.status] = (count[r.status] || 0) + 1;
console.log(`${reg.images.length} pictures in the register:`, Object.entries(count).map(([k, v]) => `${v} ${k}`).join(", "));
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(" - " + p);
  process.exit(1);
}
console.log("The register follows its rules.");
