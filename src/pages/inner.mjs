import { site, currentWalk } from "../data/site.mjs";
import { journeys, indexRows, topicLabels, statusLabels } from "../data/journeys.mjs";
import { bio, tracks, timeline } from "../data/story.mjs";
import { notes, pinned } from "../data/fieldnotes.mjs";
import { items as galleryItems, filterLabels } from "../data/gallery.mjs";
import * as media from "../data/media.mjs";
import { esc, md, rel, ext, icons, img, manifest, chip, paras } from "../lib/util.mjs";
import { pageHead } from "../lib/layout.mjs";
import { donateSection, chapter, evidenceTag, sourceList, facts, journeyRow, filterBar, externalButton, internalButton } from "../lib/blocks.mjs";

const evidenceLegend = () => `<details class="legend">
  <summary>How to read the evidence labels</summary>
  <dl>
    <div><dt>Organiser-reported</dt><dd>The campaign organiser (PCI) says so on its own pages.</dd></div>
    <div><dt>Media-reported</dt><dd>A news outlet or association reported it at the time.</dd></div>
    <div><dt>Club-reported</dt><dd>The Rotary Club of Akright City says so. It is a club account, not an audit.</dd></div>
    <div><dt>Self-reported</dt><dd>Shyaka’s own account, in an article, a post or an interview. It is attributed to him and has not been checked against a route log.</dd></div>
    <div><dt>Listing only</dt><dd>A programme or directory listing. It does not show that the event took place.</dd></div>
  </dl>
</details>`;

/* ------------------------------------------------------------ His story */
export function story() {
  const p = "/his-story/";
  const a = (to) => rel(p, to);
  const head = pageHead({
    eyebrow: "The Walking Rotarian",
    title: "His story",
    intro: "From classrooms and tablets to long walks for education, peace and faith. The record so far, with a source beside every line.",
  });
  const filter = filterBar({
    id: "tl",
    target: "#timeline",
    countLabel: "entries",
    groups: [{ attr: "track", label: "Show", options: [{ value: "*", label: "All" }, ...Object.entries(tracks).map(([value, label]) => ({ value, label }))] }],
  });
  const list = timeline
    .slice()
    .sort((x, y) => x.sort - y.sort)
    .map(
      (t) => `    <li class="tl" id="${t.id}" data-track="${t.track}">
      <p class="tl__when">${esc(t.when)}</p>
      <div class="tl__main">
        <p class="tl__track">${esc(tracks[t.track])}</p>
        <h3>${esc(t.title)}</h3>
        <p>${md(t.text, p)}</p>
        <p class="tl__meta">${evidenceTag(t.evidence)}</p>
        ${t.note ? `<p class="muted">${esc(t.note)}</p>` : ""}
        ${t.link ? `<p><a href="${a(t.link.href)}">${esc(t.link.label)}</a></p>` : ""}
        ${sourceList(t.sources, p)}
      </div>
    </li>`
    )
    .join("\n");
  const body = `${head}
<section class="block">
  <div class="container split split--story">
    <figure class="split__figure">
      ${img("shyaka-cutout", { ctx: p, alt: "Mbanda Shyaka, smiling, wearing a black headwrap and a grey polo shirt with a Rotary Club of Akright City badge.", sizes: "(min-width: 1024px) 360px, 80vw", lazy: false })}
      <figcaption class="caption">Mbanda Shyaka. Supplied for the Walk for Education campaign.</figcaption>
    </figure>
    <div class="split__text">
      <h2>In brief</h2>
      <p class="reading">${esc(bio.short)}</p>
      <p class="reading">He is also published as ${esc(site.alsoPublishedAs)}. This page keeps what the sources say apart from what he says, and it names which is which.</p>
      ${evidenceLegend()}
    </div>
  </div>
</section>
<section class="block block--tint" aria-labelledby="tl-h">
  <div class="container">
    <h2 id="tl-h">The record, in order</h2>
    <p class="reading">Several entries are Shyaka’s own recollections. They are marked as such. Where a source gives only a listing, a target or an aim, the entry says so.</p>
${filter}
    <ol class="timeline" id="timeline">
${list}
    </ol>
  </div>
</section>`;
  return { path: p, title: "His story", description: "The sourced record of Mbanda Shyaka’s work in education technology, community service and long-distance walking.", body, current: "his-story" };
}

/* ------------------------------------------------------------ Journeys index */
export function journeysIndex() {
  const p = "/journeys/";
  const head = pageHead({
    eyebrow: "The Walking Rotarian",
    title: "Journeys",
    intro: "Every walk, with the evidence beside it. Underway, completed and proposed walks are kept apart, and every distance says who reported it.",
  });
  const filter = filterBar({
    id: "jf",
    target: "#jlist",
    countLabel: "journeys",
    groups: [
      { attr: "topic", label: "Topic", options: [{ value: "*", label: "All" }, ...Object.entries(topicLabels).map(([value, label]) => ({ value, label }))] },
      { attr: "status", label: "Status", options: [{ value: "*", label: "All" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))] },
    ],
  });
  const rows = indexRows().map((r) => journeyRow(r, p, "h3")).join("\n");
  const body = `${head}
<section class="block">
  <div class="container">
    <h2 class="visually-hidden">All journeys</h2>
${filter}
    <ul class="jlist jlist--index" id="jlist">
${rows}
    </ul>
    <div class="notice" role="note">
      <p class="notice__title">Reading the record</p>
      <p><strong>Underway</strong> means the walk is being walked now. <strong>Completed</strong> means a source reports it finished. <strong>Proposed</strong> means it has been described as a plan and nothing has been walked. A proposal is never counted as a journey.</p>
      <p>Distances are as reported, never added together. A target is not a total.</p>
    </div>
    ${evidenceLegend()}
  </div>
</section>`;
  return { path: p, title: "Journeys", description: "Every walk by Mbanda Shyaka, the Walking Rotarian, with its status, distance and the source that reports it.", body, current: "journeys" };
}

/* ------------------------------------------------------------ Journey detail */
const CHAPTERS = [
  ["reason", "The reason"],
  ["road", "The road"],
  ["along", "Along the way"],
  ["people", "The people"],
  ["followed", "What followed"],
];

function chapterBody(content, ctx) {
  const c = Array.isArray(content) ? { paras: content } : content;
  const figs = (c.figures || [])
    .map(
      (f) => `      <figure class="figure">${img(f.image, { ctx, alt: f.alt, sizes: "(min-width: 1024px) 380px, 100vw" })}<figcaption class="caption">${md(f.caption, ctx)}</figcaption></figure>`
    )
    .join("\n");
  return `    <div class="reading">${paras(c.paras || [], ctx)}</div>${figs ? `\n    <div class="figures figures--${c.figures.length}">\n${figs}\n    </div>` : ""}`;
}

export function journeyPage(j, prev, next) {
  const p = `/journeys/${j.slug}/`;
  const a = (to) => rel(p, to);
  if (j.slug === "earlier-walks") return earlierWalks(j);

  const chapters = [];
  let n = 0;
  for (const [key, label] of CHAPTERS) {
    if (!j.chapters[key]) continue;
    n += 1;
    chapters.push(chapter({ id: key, num: String(n).padStart(2, "0"), heading: label, body: chapterBody(j.chapters[key], p) }));
  }
  n += 1;
  chapters.push(
    chapter({
      id: "record",
      num: String(n).padStart(2, "0"),
      heading: "The record",
      body: `    <p class="reading">What the sources say, and how far each can be trusted.</p>
${sourceList(j.record.sources, p)}
    ${j.record.notes?.length ? `<ul class="notes">\n${j.record.notes.map((t) => `      <li>${md(t, p)}</li>`).join("\n")}\n    </ul>` : ""}`,
    })
  );

  const hero = j.hero
    ? `<figure class="journey-head__figure">${img(j.hero.image, { ctx: p, alt: j.hero.alt, sizes: "(min-width: 1024px) 440px, 100vw", lazy: false, priority: true })}<figcaption class="caption">${md(j.hero.caption, p)}</figcaption></figure>`
    : "";
  const cta = j.cta
    ? `<section class="band band--dark" aria-labelledby="cta-h"><div class="container"><h2 id="cta-h">${esc(j.cta.heading)}</h2><p class="intro intro--light">${esc(j.cta.text)}</p><p>${j.cta.url.startsWith("/") ? internalButton(p,j.cta.url,j.cta.label,"button--onink") : externalButton(j.cta.url,j.cta.label,"button--onink")}</p></div></section>`
    : "";
  const pager = `<nav class="pager" aria-label="More journeys"><div class="container pager__inner">
  ${prev ? `<a class="pager__link" href="${a(`/journeys/${prev.slug}/`)}"><span class="pager__dir">Newer</span><span class="pager__title">${esc(prev.title)}</span></a>` : "<span></span>"}
  <a class="pager__link pager__link--all" href="${a("/journeys/")}"><span class="pager__dir">All</span><span class="pager__title">Journeys</span></a>
  ${next ? `<a class="pager__link pager__link--next" href="${a(`/journeys/${next.slug}/`)}"><span class="pager__dir">Earlier</span><span class="pager__title">${esc(next.title)}</span></a>` : "<span></span>"}
</div></nav>`;

  const body = `<header class="page-head page-head--journey page-head--art page-head--road">
  <div class="container journey-head ${j.hero ? "journey-head--hero" : ""}">
    <div class="journey-head__text">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${a("/journeys/")}">Journeys</a><span aria-hidden="true"> / </span><span aria-current="page">${esc(j.title)}</span></nav>
      <p class="journey-head__status">${chip(j.status, statusLabels)}<span class="journey-head__date">${esc(j.dateLabel)}</span></p>
      <h1>${esc(j.title)}</h1>
      <p class="intro intro--light">${esc(j.summary)}</p>
      ${facts([
        ["Route", esc(j.route)],
        ["Distance", `${esc(j.distance)}. <span class="muted">${esc(j.distanceBasis)}</span>`],
        ["Topic", esc(topicLabels[j.topic])],
        ["Evidence", esc(j.evidence)],
      ])}
    </div>
    ${hero}
  </div>
</header>
<div class="container thread" data-thread>
${chapters.join("\n")}
</div>
${cta}
${pager}`;
  return { path: p, title: j.title, description: j.summary, body, current: "journeys" };
}

function earlierWalks(j) {
  const p = `/journeys/${j.slug}/`;
  const a = (to) => rel(p, to);
  const items = j.items
    .map(
      (it) => `    <article class="entry" id="${it.id}">
      <p class="entry__when">${esc(it.dateLabel)}</p>
      <div class="entry__main">
        <h2>${esc(it.title)}</h2>
        <p class="entry__facts">${chip("completed", statusLabels)} ${it.distance ? `<span>${esc(it.distance)}</span>` : ""} ${evidenceTag(it.evidence)}</p>
        <div class="reading">${paras(it.text, p)}</div>
        ${sourceList([it.source, it.source2].filter(Boolean), p)}
      </div>
    </article>`
    )
    .join("\n");
  const body = `<header class="page-head page-head--art page-head--paths">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${a("/journeys/")}">Journeys</a><span aria-hidden="true"> / </span><span aria-current="page">Earlier walks</span></nav>
    <h1>Earlier walks</h1>
    <p class="intro intro--light">${esc(j.summary)}</p>
  </div>
</header>
<section class="block"><div class="container entries">
${items}
</div></section>
<nav class="pager" aria-label="More journeys"><div class="container pager__inner"><a class="pager__link pager__link--all" href="${a("/journeys/")}"><span class="pager__dir">All</span><span class="pager__title">Journeys</span></a></div></nav>`;
  return { path: p, title: "Earlier walks", description: j.summary, body, current: "journeys" };
}

/* ------------------------------------------------------------ Field notes */
export function fieldNotes() {
  const p = "/field-notes/";
  const a = (to) => rel(p, to);
  const head = pageHead({
    eyebrow: "The Walking Rotarian",
    title: "Field notes",
    intro: "Dated records from the road, written from what the sources say. Newest first.",
  });
  const last = currentWalk.lastVerifiedUpdate;
  const pin = `<aside class="panel panel--now" aria-labelledby="pin-h">
    <p class="panel__top">${chip("underway", statusLabels)}</p>
    <h2 id="pin-h">${esc(pinned.heading)}</h2>
    <p class="reading">${esc(pinned.text)}</p>
    <p class="muted">Last verified update: ${last ? esc(last) : "none yet"}. No live location is shown on this site.</p>
    <p>${internalButton(p, "/journeys/walk-for-education/", "About the walk", "button--secondary")}</p>
  </aside>`;
  const list = notes
    .map((n) => {
      const j = journeys.find((x) => x.slug === n.journey);
      return `    <article class="note" id="${n.id}">
      <p class="note__date"><time datetime="${n.date}">${esc(n.dateLabel)}</time><span class="note__place">${esc(n.place)}</span></p>
      <div class="note__main">
        <h2>${esc(n.title)}</h2>
        <div class="reading">${paras(n.text, p)}</div>
        ${n.image ? `<figure class="figure figure--note">${img(n.image.image, { ctx: p, alt: n.image.alt, sizes: "(min-width: 1024px) 560px, 100vw" })}<figcaption class="caption">${esc(n.image.caption)}</figcaption></figure>` : ""}
        <p class="note__meta">${evidenceTag(n.evidence)}</p>
        <p class="note__links">Source: ${ext(n.source.url, esc(n.source.label))}${j ? ` · <a href="${a(`/journeys/${j.slug}/${n.anchor ? "#" + n.anchor : ""}`)}">${esc(j.hidden ? "Earlier walks" : j.title)}</a>` : ""}</p>
      </div>
    </article>`;
    })
    .join("\n");
  const body = `${head}
<section class="block"><div class="container notes-wrap">
  ${pin}
  <div class="notes-list">
${list}
  </div>
</div></section>`;
  return { path: p, title: "Field notes", description: "Dated, sourced field notes from the Walking Rotarian’s journeys.", body, current: "field-notes" };
}

/* ------------------------------------------------------------ Gallery */
export function gallery() {
  const p = "/gallery/";
  const present = ["all", ...["journeys", "community", "earlier", "artwork"].filter((f) => galleryItems.some((i) => i.filters.includes(f)))];
  const head = pageHead({
    eyebrow: "The Walking Rotarian",
    title: "Gallery",
    intro: "Photographs and records from the road. Each picture says where it came from and what kind of picture it is.",
  });
  const filter = filterBar({
    id: "gf",
    target: "#gallery",
    countLabel: "pictures",
    groups: [{ attr: "filter", label: "Show", options: present.map((value) => ({ value, label: filterLabels[value] })) }],
  });
  const tiles = galleryItems
    .map((g) => {
      const m = manifest[g.image];
      const biggest = m.widths[m.widths.length - 1];
      const tokens = [...(g.group === "artwork" ? [] : ["all"]), ...g.filters].join(" ");
      return `    <li class="tile-wrap" data-filter="${tokens}">
      <a class="tile" href="${rel(p, `/assets/img/${g.image}-${biggest}.webp`)}" data-id="${g.id}">
        ${img(g.image, { ctx: p, alt: g.alt, sizes: "(min-width: 1024px) 380px, (min-width: 640px) 46vw, 100vw" })}
        <span class="tile__label"><span class="tile__kind${g.group === "artwork" ? " tile__kind--artwork" : ""}">${esc(g.kind)}</span><span class="tile__title">${esc(g.title)}</span></span>
      </a>
    </li>`;
    })
    .join("\n");
  const data = galleryItems.map((g) => {
    const m = manifest[g.image];
    const biggest = m.widths[m.widths.length - 1];
    const j = journeys.find((x) => x.slug === g.journey);
    return {
      id: g.id,
      src: rel(p, `/assets/img/${g.image}-${biggest}.webp`),
      w: m.w,
      h: m.h,
      alt: g.alt,
      title: g.title,
      caption: g.caption,
      kind: g.kind,
      artwork: g.group === "artwork",
      source: g.source,
      credit: g.credit,
      date: g.date,
      permission: g.permission,
      journey: j ? j.title : "",
      journeyHref: j ? rel(p, `/journeys/${j.slug}/`) : "",
    };
  });
  const body = `${head}
<section class="block">
  <div class="container">
${filter}
    <ul class="gallery" id="gallery">
${tiles}
    </ul>
    <div class="notice" role="note">
      <p class="notice__title">What is and is not here</p>
      <p>Route records are phone screenshots that carry a tracker reading for one day. The visual stories collection includes generated scenes and product concepts, with image credits. Photographs published by news outlets are linked from the <a href="${rel(p, "/media/")}">media room</a>, not copied here. Earlier work from 2009 to 2023 has no approved pictures yet.</p>
    </div>
  </div>
</section>
<dialog class="viewer" id="viewer" aria-labelledby="viewer-title">
  <div class="viewer__inner">
    <div class="viewer__bar">
      <p class="viewer__kind" id="viewer-kind"></p>
      <button type="button" class="viewer__close" data-viewer-close aria-label="Close picture">${icons.close}<span>Close</span></button>
    </div>
    <figure class="viewer__figure"><img id="viewer-img" alt="" width="800" height="600"><figcaption id="viewer-caption" class="caption"></figcaption></figure>
    <div class="viewer__record">
      <h2 id="viewer-title" class="viewer__title"></h2>
      <dl class="viewer__dl" id="viewer-dl"></dl>
    </div>
    <div class="viewer__nav">
      <button type="button" class="button button--secondary" data-viewer-prev>${icons.prev}<span>Previous</span></button>
      <p class="viewer__count" id="viewer-count" aria-live="polite"></p>
      <button type="button" class="button button--secondary" data-viewer-next><span>Next</span>${icons.arrow}</button>
    </div>
  </div>
</dialog>
<script type="application/json" id="gallery-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
  return { path: p, title: "Gallery", description: "Photographs and route records from the Walking Rotarian’s journeys, each with its source and kind.", body, current: "gallery" };
}

/* ------------------------------------------------------------ Media */
export function mediaPage() {
  const p = "/media/";
  const a = (to) => rel(p, to);
  const head = pageHead({
    eyebrow: "The Walking Rotarian",
    title: "Media",
    intro: "For editors, hosts and organisers: the short biography, how to describe the walks, and the original sources.",
  });
  const kit = `<section class="block" id="press-kit" aria-labelledby="kit-h">
  <div class="container">
    <h2 id="kit-h">Press kit</h2>
    <div class="kit">
      <div class="kit__main">
        <h3>Short biography</h3>
        <p class="reading">${esc(bio.short)}</p>
        <h3>How to describe the walks</h3>
        <ul class="notes">
${media.distanceRules.map((t) => `          <li>${esc(t)}</li>`).join("\n")}
        </ul>
        <h3>Photographs</h3>
        <p class="reading">Approved pictures are in the <a href="${a("/gallery/")}">gallery</a>, each with its source and credit. For original files, or for permission to publish a picture, <a href="${a("/get-involved/#enquiry")}">send an enquiry</a>.</p>
      </div>
      <aside class="kit__aside" aria-labelledby="logo-h">
        <h3 id="logo-h">Logo</h3>
        <span class="logo-plate logo-plate--kit"><img src="${a("/assets/img/logo-288.webp")}" width="397" height="532" alt="The Walking Rotarian logo: a stencil portrait above the letters WR and the words Walking Rotarian." decoding="async" loading="lazy"></span>
        <p class="caption">Use the logo as supplied. Do not recolour, stretch or redraw it.</p>
        <p class="kit__downloads"><a class="button button--secondary" href="${a("/assets/press/walking-rotarian-logo-transparent.png")}" download>Logo, no background (PNG)</a> <a class="button button--secondary" href="${a("/assets/press/walking-rotarian-logo.jpg")}" download>Logo on white (JPEG)</a></p>
      </aside>
    </div>
  </div>
</section>`;
  const listen = `<section class="block block--tint" aria-labelledby="listen-h">
  <div class="container">
    <h2 id="listen-h">Watch and listen</h2>
    <ul class="cards cards--three">
${media.listen
  .map(
    (m) => `      <li class="card card--media">
        <p class="card__when">${esc(m.kind)} · ${esc(m.date)}</p>
        <h3>${esc(m.title)}</h3>
        <p class="muted">${esc(m.outlet)}</p>
        <p>${esc(m.note)}</p>
        <div class="card__foot">
          <p>${ext(m.url, `${icons.play}<span>Open the original</span>`, "button button--secondary")}</p>${m.url2 ? `
          <p class="card__more">${ext(m.url2.url, esc(m.url2.label))}</p>` : ""}
        </div>
      </li>`
  )
  .join("\n")}
    </ul>
  </div>
</section>`;
  const press = `<section class="block" aria-labelledby="press-h">
  <div class="container">
    <h2 id="press-h">In the news</h2>
    <p class="reading">Links go to the publishers. Their photographs belong to them and are not reproduced here.</p>
    <ul class="medialist">
${media.press
  .map(
    (m) => `      <li class="medialist__item">
        <p class="medialist__when">${esc(m.date)}</p>
        <div>
          <p class="medialist__title">${ext(m.url, esc(m.title))}</p>
          <p class="medialist__meta">${esc(m.outlet)} · ${esc(m.kind)}</p>
          <p>${esc(m.covers)}</p>
        </div>
      </li>`
  )
  .join("\n")}
    </ul>
  </div>
</section>`;
  const pubs = `<section class="block block--tint" aria-labelledby="pubs-h">
  <div class="container">
    <h2 id="pubs-h">Club publications and organisations</h2>
    <ul class="cards cards--three">
${[...media.publications, ...media.organisations]
  .map(
    (m) => `      <li class="card">
        <p class="card__when">${esc(m.kind || "Organisation page")}</p>
        <h3>${esc(m.title)}</h3>
        <p class="muted">${esc(m.outlet)}</p>
        <p>${esc(m.note)}</p>
        <p>${ext(m.url, "Open the original")}</p>
      </li>`
  )
  .join("\n")}
    </ul>
  </div>
</section>`;
  const body = `${head}
${kit}
${listen}
${press}
${pubs}`;
  return { path: p, title: "Media", description: "Press kit, source links and the original recordings and reports on Mbanda Shyaka, the Walking Rotarian.", body, current: "media" };
}

/* ------------------------------------------------------------ Get involved */
export function getInvolved() {
  const p = "/get-involved/";
  const a = (to) => rel(p, to);
  const head = pageHead({
    eyebrow: "The Walking Rotarian",
    title: "Get involved",
    intro: "Support the current walk, welcome a walk to your community, or invite Shyaka to speak.",
  });
  const types = [
    ["host", "Host a walk stop"],
    ["speak", "Invite him to speak"],
    ["media", "Media request"],
    ["partner", "Partner or sponsor"],
    ["correction", "Send a correction"],
    ["other", "Something else"],
  ];
  const ways = `<section class="block" aria-labelledby="ways-h">
  <div class="container">
    <h2 id="ways-h" class="visually-hidden">Ways to take part</h2>
    <ul class="cards cards--three">
      <li class="card"><h3>Support the current walk</h3><p>Choose what you would like to support, select an amount and review your donation request here. The team will confirm the authorised payment details with you.</p><p><a class="button button--secondary" href="${a("/donate/")}">Start your donation ${icons.arrow}</a></p></li>
      <li class="card"><h3>Host a walk stop</h3><p>If your school, church, club or community would like to welcome a walk, say where and when. A date and a place help most.</p><p><a class="button button--secondary" href="${a("/get-involved/#enquiry")}" data-pick="host">Write to the team${icons.arrow}</a></p></li>
      <li class="card"><h3>Invite him to speak</h3><p>Talks, panels and interviews. Tell us the audience, the date and the place.</p><p><a class="button button--secondary" href="${a("/get-involved/#enquiry")}" data-pick="speak">Send an invitation${icons.arrow}</a></p></li>
    </ul>
  </div>
</section>`;
  const form = `<section class="block block--tint" id="enquiry" aria-labelledby="enquiry-h">
  <div class="container form-wrap">
    <div class="form-wrap__intro">
      <h2 id="enquiry-h">Send an enquiry</h2>
      <p class="reading">Fields marked with an asterisk are needed. For donations, use the dedicated donation page above.</p>
      <p class="reading">${site.formEndpoint ? "Your message is sent when you press the button, and this page tells you whether it arrived." : "Pressing the button opens your own email app with the message ready. Nothing is sent until you press Send there."}</p>
    </div>
    <form class="enquiry" novalidate data-endpoint="${esc(site.formEndpoint)}" data-email="${esc(site.email)}" aria-describedby="form-status">
      <div class="field"><label for="f-name">Your name <span aria-hidden="true">*</span></label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
      <div class="field"><label for="f-email">Email address <span aria-hidden="true">*</span></label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="f-org">Organisation <span class="optional">(optional)</span></label><input id="f-org" name="organisation" type="text" autocomplete="organization"></div>
      <div class="field"><label for="f-type">What is your enquiry about? <span aria-hidden="true">*</span></label>
        <select id="f-type" name="type" required><option value="">Choose one</option>${types.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
      <div class="field field--wide"><label for="f-where">Proposed date and place <span class="optional">(optional)</span></label><input id="f-where" name="where" type="text"></div>
      <div class="field field--wide"><label for="f-msg">Message <span aria-hidden="true">*</span></label><textarea id="f-msg" name="message" rows="6" required></textarea></div>
      <div class="field field--trap" aria-hidden="true"><label for="f-trap">Leave this empty</label><input id="f-trap" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <div class="field field--check field--wide"><input id="f-consent" name="consent" type="checkbox" required><label for="f-consent">I understand this message goes to the campaign team and is used only to reply to me. <span class="nowrap"><a href="${a("/privacy/")}">Privacy</a> <span aria-hidden="true">*</span></span></label></div>
      <div class="field--wide form-actions"><button class="button" type="submit">Send enquiry</button></div>
      <div class="form-status field--wide" id="form-status" role="status" aria-live="polite" tabindex="-1"></div>
      <noscript><p class="field--wide">The form needs JavaScript. You can write to <a href="mailto:${esc(site.email)}">${esc(site.email)}</a> instead.</p></noscript>
    </form>
  </div>
</section>`;
  const body = `${head}
${ways}
${donateSection(p)}
${form}`;
  return { path: p, title: "Get involved", description: "Support the current walk, host a stop or invite Mbanda Shyaka to speak.", body, current: "get-involved" };
}

/* ------------------------------------------------------------ Privacy and 404 */
export function privacy() {
  const p = "/privacy/";
  const a = (to) => rel(p, to);
  const head = pageHead({ eyebrow: "The Walking Rotarian", title: "Privacy", intro: "How reading preferences, team publishing and supporter messages are handled." });
  const body = `${head}
<section class="block"><div class="container reading prose">
  <h2>What the site collects</h2>
  <p>Reading does not require an account. Saved stories and draft text use storage on the current device. Use the saved-stories page to remove saved copies. Shared publishing, when connected, keeps entries and media on the publishing server.</p>
  <p>Team sign-in uses a session cookie on the publishing server. When the server is connected, aggregate website events record story views, sharing actions, support-link clicks and referral domains. They do not certify donations or identify unique readers. No advertising tracker is added.</p>
  <p>The web host keeps ordinary server records, such as the time of a visit and the page asked for. That is a feature of every web host, and it is the host’s record, not this site’s.</p>
  <h2>The enquiry form</h2>
  <p>${site.formEndpoint ? "When you press Send, what you typed is sent to the form service that delivers it to the campaign team." : "When you press the button, your own email app opens with what you typed already in the message. The site itself sends nothing."} It is used to reply to you and for nothing else.</p>
  <p>On the community page, connected forms save your request and contact details for authorised team members to follow up. Public encouragement and supporter recognition require consent and review. When shared delivery is unavailable, the page prepares an email and clearly says that nothing has been sent by the website.</p>
  <h2>Shop enquiries and publishing forms</h2>
  <p>Your shop list is stored in this browser. Use Remove beside an item to clear it. The WhatsApp button prepares a message containing your selected items, sizes, quantities and any note you add. Review it and send it in WhatsApp to share it with the shop team. The team confirms availability, delivery and payment arrangements in that conversation.</p>
  <p>The simple publishing forms open GitHub and use the authorised publisher’s GitHub account. Submissions and attached media are public in the repository, including draft submissions. Approved entries become part of the website after its build completes. GitHub keeps earlier revisions under its own policies.</p>
  <h2>Email updates and embedded posts</h2>
  <p>Email subscriptions, when available, begin only after confirmation. Each email includes a preference or unsubscribe link. Facebook posts load only after you choose to load an embed; Facebook and other linked services have their own policies. Fonts and supplied photographs are served from this website.</p>
  <h2>Links to other sites</h2>
  <p>Sources, news reports and campaign pages open on other sites. They have their own policies, and this site cannot see what they collect.</p>
  <h2>Corrections and removal</h2>
  <p>If something here is wrong, or a picture or a line should come down, <a href="${a("/get-involved/#enquiry")}">send a correction</a>.</p>
</div></section>`;
  return { path: p, title: "Privacy", description: "What the Walking Rotarian website does and does not do with your information.", body };
}

export function notFound() {
  const p = "/404.html";
  const a = (to) => rel(p, to);
  const body = `<section class="block"><div class="container">
  <p class="eyebrow">Page not found</p>
  <h1>This page is not on the road.</h1>
  <p class="intro intro--light">The link may be old, or the address may have a typing slip. These places are real.</p>
  <p class="notfound__links">${internalButton(p, "/", "Home")} ${internalButton(p, "/journeys/", "Journeys", "button--secondary")} ${internalButton(p, "/field-notes/", "Field notes", "button--secondary")}</p>
</div></section>`;
  return { path: p, title: "Page not found", description: "This page could not be found. Use the links to reach the home page, the journeys or the field notes.", body, noindex: true };
}
