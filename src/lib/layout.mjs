// The shared frame around every page: <head>, header, footer.
import { site, currentWalk } from "../data/site.mjs";
import { esc, rel, ext, icons, img } from "./util.mjs";

export function logoPlate(ctx, { height = 64, cls = "", alt = "The Walking Rotarian logo" } = {}) {
  // The supplied logo in its own navy, with the white paper removed (see tools/make_design_assets.py).
  const srcset = [160, 320, 640].map((w) => `${rel(ctx, `/assets/img/logo-ink-${w}.webp`)} ${w}w`).join(", ");
  return `<span class="logo ${cls}"><img src="${rel(ctx, "/assets/img/logo-ink-160.webp")}" srcset="${srcset}" sizes="${Math.round(height * 0.72)}px" width="703" height="977" alt="${alt}" decoding="async"></span>`;
}

// Footprints for the page loader: a short walk across the screen.
const steps = Array.from({ length: 8 }, (_, i) => `<span class="step step--${i % 2 ? "r" : "l"}" style="--i:${i}"><svg viewBox="0 0 20 34" width="14" height="24" focusable="false"><path d="M10 1c5 0 8 5 8 12s-3 10-8 10-8-3-8-10S5 1 10 1z"/><ellipse cx="10" cy="29" rx="5.5" ry="4.5"/></svg></span>`).join("");

export function layout({ path: p, title, description, body, current = "", ogImage = "share-card.jpg", jsonld = [], assetVersion }) {
  const isHome = p === "/";
  const fullTitle = isHome ? `${site.name}: ${site.person}` : `${title} | ${site.name}`;
  const canonical = site.url && p !== "/404.html" ? `${site.url}${p}` : "";
  const ogUrl = site.url ? `${site.url}/assets/img/${ogImage}` : "";
  const robots = site.indexing ? "index, follow" : "noindex, nofollow";
  const a = (to) => rel(p, to);

  const head = `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#f3efe6">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="${isHome ? "website" : "article"}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ""}
${ogUrl ? `<meta property="og:image" content="${esc(ogUrl)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${esc(ogUrl)}">` : `<meta name="twitter:card" content="summary">`}
<link rel="icon" type="image/png" sizes="32x32" href="${a("/assets/img/favicon-32.png")}">
<link rel="apple-touch-icon" href="${a("/assets/img/apple-touch-icon.png")}">
<link rel="preload" href="${a("/assets/fonts/MTNBrighterSans-Bold.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${a("/assets/fonts/SkyText-Regular.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${a("/assets/main.css")}?v=${assetVersion.css}">
<script>document.documentElement.className+=" js";</script>
<script src="${a("/assets/main.js")}?v=${assetVersion.js}" defer></script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>`;

  const nav = site.nav
    .map((n) => {
      const on = current && n.href.startsWith(`/${current}/`);
      return `<li><a href="${a(n.href)}"${on ? ' aria-current="page"' : ""}>${esc(n.label)}</a></li>`;
    })
    .join("\n");

  const header = `<a class="skip-link" href="#main">Skip to main content</a>
<header class="site-header">
  <div class="container site-header__inner">
    <a class="brand" href="${a("/")}" aria-label="${esc(site.name)}: home">${logoPlate(p, { alt: "" })}<span class="brand__name" aria-hidden="true">The Walking<br>Rotarian</span></a>
    <nav class="primary-nav" aria-label="Main">
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu"><span class="menu-toggle__label">Menu</span></button>
      <div class="primary-nav__panel" id="site-menu">
        <ul class="primary-nav__list">
${nav}
        </ul>
        ${ext(currentWalk.url, `Support the current walk`, "button button--header")}
      </div>
    </nav>
  </div>
</header>`;

  const footer = `<footer class="site-footer">
  <div class="container site-footer__grid">
    <div class="site-footer__brand">
      <span class="footer-seal">${logoPlate(p, { height: 120 })}</span>
      <p class="site-footer__name">${esc(site.name)}</p>
      <p class="site-footer__motto">${esc(site.motto)}</p>
    </div>
    <nav class="site-footer__col" aria-label="Footer: explore">
      <p class="site-footer__h">Explore</p>
      <ul>
        <li><a href="${a("/")}">Home</a></li>
${site.nav.map((n) => `        <li><a href="${a(n.href)}">${esc(n.label)}</a></li>`).join("\n")}
      </ul>
    </nav>
    <div class="site-footer__col">
      <nav aria-label="Footer: official campaign pages">
        <p class="site-footer__h">Official campaign pages</p>
        <ul>
          <li>${ext(currentWalk.url, "Walk for Education")}</li>
          <li>${ext("https://pamodzici.com/faith-in-motion/", "Faith in Motion")}</li>
        </ul>
      </nav>
      <nav aria-label="Footer: about this site">
        <p class="site-footer__h">About this site</p>
        <ul>
          <li><a href="${a("/privacy/")}">Privacy</a></li>
          <li><a href="${a("/get-involved/#enquiry")}">Send a correction</a></li>
        </ul>
      </nav>
    </div>
  </div>
  <div class="container site-footer__base">
    <p>This is an independent personal site. It is not an official website of Rotary International. Wellbeing statements are personal views, not medical advice. Background artwork: illustrations from PCI’s Walk for Education campaign.</p>
    <p>Facts on this site were last reviewed on ${esc(site.reviewed)}. ${esc(site.fontCredit.text)} ${ext(site.fontCredit.url, esc(site.fontCredit.linkText))} ${esc(site.fontCredit.tail)}.</p>
  </div>
</footer>`;

  return `${head}
<body>
<div class="preloader" aria-hidden="true">
  <div class="preloader__inner">
    <img class="preloader__logo" src="${a("/assets/img/logo-ink-320.webp")}" width="320" height="445" alt="">
    <div class="preloader__trail">${steps}</div>
    <div class="preloader__bar"><span></span></div>
    <p class="preloader__tag">Every step has a story.</p>
  </div>
</div>
${header}
<main id="main" tabindex="-1">
${body}
</main>
${footer}
</body>
</html>
`;
}

/** Page title block used by every inner page. */
const headArt = { "His story": "path", Journeys: "road", "Field notes": "paths", Gallery: "road", Media: "purpose", "Get involved": "path", Privacy: "paths" };
export function pageHead({ eyebrow, title, intro, ctx, extra = "" }) {
  return `<header class="page-head page-head--art page-head--${headArt[title] || "road"}">
  <div class="container">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
    <h1>${esc(title)}</h1>
    ${intro ? `<p class="intro intro--light">${intro}</p>` : ""}
    ${extra}
  </div>
</header>`;
}
