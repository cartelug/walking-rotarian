#!/usr/bin/env node
// Builds the Walking Rotarian website into the "dist" folder.
// No packages needed. Run:   node build.mjs
// Optional settings (see README.md):  SITE_URL=https://your-domain  NOINDEX=1  FORM_ENDPOINT=https://...

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { site } from "./src/data/site.mjs";
import { journeys } from "./src/data/journeys.mjs";
import { ROOT, BASE, writeFile } from "./src/lib/util.mjs";
import { layout } from "./src/lib/layout.mjs";
import { home } from "./src/pages/home.mjs";
import { story, journeysIndex, journeyPage, fieldNotes, gallery, mediaPage, getInvolved, privacy, notFound } from "./src/pages/inner.mjs";

const OUT = path.join(ROOT, process.env.OUT_DIR || "dist");
const SRC = path.join(ROOT, "src");

// start clean
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---- assets ---------------------------------------------------------------
function copyDir(from, to, filter = () => true) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b, filter);
    else if (filter(e.name)) fs.copyFileSync(a, b);
  }
}
copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"), (n) => n !== "NOTICE.txt"); // the font notice is for the owner, not the public site
copyDir(path.join(SRC, "img"), path.join(OUT, "assets", "img"), (n) => n !== "manifest.json");
fs.mkdirSync(path.join(OUT, "assets", "press"), { recursive: true });
fs.copyFileSync(path.join(SRC, "img-original", "walking-rotarian-logo.jpeg"), path.join(OUT, "assets", "press", "walking-rotarian-logo.jpg"));
fs.copyFileSync(path.join(SRC, "img-original", "walking-rotarian-logo-transparent.png"), path.join(OUT, "assets", "press", "walking-rotarian-logo-transparent.png"));

const hash = (file) => crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
const assetVersion = { css: hash(path.join(OUT, "assets", "main.css")), js: hash(path.join(OUT, "assets", "main.js")) };

// ---- pages ----------------------------------------------------------------
const pages = [home(), story(), journeysIndex(), fieldNotes(), gallery(), mediaPage(), getInvolved(), privacy()];

const withPages = journeys.filter((j) => j.page).sort((a, b) => b.sortKey - a.sortKey);
withPages.forEach((j, i) => pages.push(journeyPage(j, withPages[i - 1], withPages[i + 1])));
pages.push(notFound());

const urls = [];
for (const pg of pages) {
  const html = layout({ ...pg, assetVersion });
  const file = pg.path.endsWith(".html") ? path.join(OUT, pg.path) : path.join(OUT, pg.path, "index.html");
  writeFile(file, pg.noindex ? html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">') : html);
  if (!pg.noindex) urls.push(pg.path);
}

// ---- crawler and server files ---------------------------------------------
writeFile(
  path.join(OUT, "robots.txt"),
  `User-agent: *\n${site.indexing ? "Allow: /" : "Disallow: /"}\n${site.url ? `Sitemap: ${site.url}/sitemap.xml\n` : ""}`
);
if (site.url) {
  writeFile(
    path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join("\n")}\n</urlset>\n`
  );
}
writeFile(
  path.join(OUT, ".htaccess"),
  `# For cPanel and other Apache hosts. Upload this file with the rest of the site.
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 ${BASE}/404.html

<IfModule mod_rewrite.c>
RewriteEngine On
# Folder addresses always end in a slash, so relative links keep working.
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_URI} !/$
RewriteRule ^(.*)$ ${BASE}/$1/ [R=301,L]
# When the SSL certificate is installed, remove the # at the start of these two lines:
# RewriteCond %{HTTPS} off
# RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json application/ld+json image/svg+xml text/plain application/xml
</IfModule>

<IfModule mod_mime.c>
AddType font/woff2 .woff2
AddType image/webp .webp
</IfModule>

<IfModule mod_expires.c>
ExpiresActive On
ExpiresDefault "access plus 1 hour"
ExpiresByType text/html "access plus 10 minutes"
ExpiresByType font/woff2 "access plus 1 year"
ExpiresByType image/webp "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType text/css "access plus 1 year"
ExpiresByType application/javascript "access plus 1 year"
</IfModule>

<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
`
);
writeFile(path.join(OUT, ".nojekyll"), "");

// ---- report ---------------------------------------------------------------
const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`Built ${pages.length} pages and ${count(OUT)} files into ${path.relative(process.cwd(), OUT) || "."}`);
if (!site.url) console.log("Note: SITE_URL is not set, so there is no sitemap and no absolute share-image link. Set it when the domain is known.");
if (!site.indexing) console.log("Note: NOINDEX is on. Search engines are asked not to list this site.");
if (!site.formEndpoint) console.log(`Note: no form service is set, so the enquiry form opens the visitor's email app addressed to ${site.email}.`);
