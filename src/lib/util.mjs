// Small helpers shared by every page. No dependencies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BASE = (process.env.BASE_PATH || "").replace(/\/+$/, "");
export const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "img", "manifest.json"), "utf8"));

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Turn a root path like "/journeys/" into a link that works from the page at `from`. */
export function rel(from, to) {
  if (/^(https?:|mailto:|tel:|#)/.test(to)) return to;
  const [p, hash] = to.split("#");
  const tail = hash ? "#" + hash : "";
  if (from === "/404.html") return `${BASE}${p || "/"}${tail}`; // served from any depth: use root paths
  const depth = from.split("/").filter(Boolean).length;
  const prefix = depth === 0 ? "./" : "../".repeat(depth);
  return prefix + p.replace(/^\//, "") + tail;
}

export const icons = {
  ext: `<svg class="icon icon--ext" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M6 3h7v7M13 3 5 11" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"/></svg>`,
  arrow: `<svg class="icon icon--arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"/></svg>`,
  play: `<svg class="icon icon--play" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>`,
  close: `<svg class="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3 3 13" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"/></svg>`,
  prev: `<svg class="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M14 8H3M7 4 3 8l4 4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"/></svg>`,
};

/** External link: opens in a new tab and says so to screen readers. */
export function ext(url, text, cls = "") {
  return `<a${cls ? ` class="${cls}"` : ""} href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text}${icons.ext}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
}

/** Plain text with [label](url) links. Inside-site paths start with "/". */
export function md(text, ctx) {
  return esc(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    url = url.replace(/&amp;/g, "&");
    return /^https?:/.test(url) ? ext(url, label) : `<a href="${esc(rel(ctx, url))}">${label}</a>`;
  });
}

export const paras = (arr, ctx, cls = "") =>
  (Array.isArray(arr) ? arr : [arr]).map((t) => `<p${cls ? ` class="${cls}"` : ""}>${md(t, ctx)}</p>`).join("\n");

/** Responsive picture with true width and height, so nothing jumps while loading. */
export function img(name, { ctx, alt, sizes = "100vw", lazy = true, priority = false, cls = "", style = "" }) {
  const m = manifest[name];
  if (!m) throw new Error(`Unknown image: ${name}`);
  const srcset = m.widths.map((w) => `${rel(ctx, `/assets/img/${name}-${w}.webp`)} ${w}w`).join(", ");
  const biggest = m.widths[m.widths.length - 1];
  return `<img${cls ? ` class="${cls}"` : ""} src="${rel(ctx, `/assets/img/${name}-${biggest}.webp`)}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" decoding="async" ${priority ? 'fetchpriority="high"' : lazy ? 'loading="lazy"' : ""}${style ? ` style="${style}"` : ""}>`;
}

export function figure(name, { ctx, alt, caption, sizes, cls = "", lazy = true, priority = false }) {
  return `<figure class="figure ${cls}">${img(name, { ctx, alt, sizes, lazy, priority })}${caption ? `<figcaption class="caption">${md(caption, ctx)}</figcaption>` : ""}</figure>`;
}

export function chip(status, labels) {
  return `<span class="chip chip--${status}"><span class="chip__dot" aria-hidden="true"></span>${esc(labels[status])}</span>`;
}

export const writeFile = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
