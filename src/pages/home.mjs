import { site, currentWalk } from "../data/site.mjs";
import { indexRows, statusLabels } from "../data/journeys.mjs";
import { bio, timeline } from "../data/story.mjs";
import { notes } from "../data/fieldnotes.mjs";
import { listen } from "../data/media.mjs";
import { esc, rel, ext, icons, img, figure, chip, md, paras } from "../lib/util.mjs";
import { donateSection, chapter, journeyRow, facts, externalButton, internalButton, evidenceTag } from "../lib/blocks.mjs";
import { homepageJournal } from './platform.mjs';

export function home() {
  const p = "/";
  const a = (to) => rel(p, to);

  const hero = `<section class="hero hero--home hero--photographic" aria-labelledby="hero-h">
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="container hero__grid">
    <div class="hero__text">
      <p class="eyebrow">${esc(site.person)} · ${esc(site.name)}</p>
      <h1 id="hero-h">Every step has a <span class="accent">story.</span></h1>
      <p class="intro intro--light hero__intro">Meet ${esc(site.person)}, the Walking Rotarian. Explore the journeys, the people and the causes behind the miles.</p>
      <p class="hero__actions">
        ${internalButton(p, "/journeys/", "Explore the journeys", "button--clay")}
        <a class="button button--ghost" href="${a('/live/?journey=walk-for-education')}">Follow the live journal</a>
      </p>
      <p class="hero__donate"><a href="${a("/#donate")}">Or make a donation</a></p>
      <p class="hero__motto">${esc(site.motto)}</p>
    </div>
    <figure class="hero__mobile-art">
      ${img('campaign-open-road', {ctx:p, alt:'Campaign artwork of Mbanda walking beside open East African grassland.', sizes:'100vw'})}
      <figcaption>Campaign artwork created from supplied photographs.</figcaption>
    </figure>
  </div>
  <div class="container">
    <dl class="hero__stats">
      <div><dt>Faith in Motion, 2026</dt><dd><span class="hero__num">About 400 km</span><span class="hero__stat-note">Completed, as reported by PCI</span></dd></div>
      <div><dt>Peace walk, 2024 to 2025</dt><dd><span class="hero__num">300 km</span><span class="hero__stat-note">Nakivale to Makerere, media-reported</span></dd></div>
      <div><dt>Walk for Education, 2026</dt><dd><span class="hero__num">About 1,100 km</span><span class="hero__stat-note">Planned route, now underway</span></dd></div>
    </dl>
    <div class="hero__footnote"><p class="hero__note">Each figure belongs to its own walk.</p><a href="${a('/gallery/?collection=artwork#gallery')}">Campaign artwork · view the collection${icons.arrow}</a></div>
  </div>
</section>`;

  // 01
  const meet = chapter({
    id: "meet",
    num: "01",
    heading: "Meet the walker",
    body: `    <div class="split">
      <figure class="split__figure">
        ${img("portrait", { ctx: p, alt: "Mbanda Shyaka, smiling, wearing a black headwrap and a grey polo shirt with a Rotary Club of Akright City badge.", sizes: "(min-width: 1024px) 320px, 80vw" })}
        <figcaption class="caption">Mbanda Shyaka. Supplied for the Walk for Education campaign.</figcaption>
      </figure>
      <div class="split__text">
        <p class="reading">${esc(bio.short)}</p>
        ${facts([
          ["Known as", "The Walking Rotarian"],
          ["Also published as", esc(site.alsoPublishedAs)],
          ["Current walk", `<a href="${a("/journeys/walk-for-education/")}">Walk for Education</a>, underway`],
          ["Last completed walk", `<a href="${a("/journeys/faith-in-motion/")}">Faith in Motion</a>, about 400 km, finished 2 August 2026`],
        ])}
        <p>${internalButton(p, "/his-story/", "Read his story", "button--secondary")}</p>
      </div>
    </div>`,
  });

  // 02
  const now = chapter({
    id: "now",
    num: "02",
    heading: "On the road now",
    body: `    <article class="panel panel--now" aria-labelledby="now-h3">
      <p class="panel__top">${chip("underway", statusLabels)}<span class="evidence"><span class="evidence__label">Evidence</span> Organiser-reported</span></p>
      <h3 id="now-h3">${esc(currentWalk.name)}</h3>
      <p class="panel__route">${esc(currentWalk.route)}</p>
      <p class="reading">${esc(currentWalk.purpose)}</p>
      ${facts([
        ["Distance", `${esc(currentWalk.distance)}. <span class="muted">${esc(currentWalk.distanceBasis)}</span>`],
        ["Where he is", "No live location is shown on this site."],
        ["Last verified update", currentWalk.lastVerifiedUpdate ? esc(currentWalk.lastVerifiedUpdate) : "None yet. Dated stages will appear here once the campaign team confirms them."],
      ])}
      <p class="panel__actions">
        <a class="button" href="${a("/journeys/walk-for-education/")}">Follow the walk${icons.arrow}</a>
        ${externalButton(currentWalk.url, "Support the current walk", "button--secondary")}
      </p>
    </article>`,
  });

  // 03
  const rows = indexRows().slice(0, 4);
  const journeysCh = chapter({
    id: "journeys",
    num: "03",
    heading: "The journeys",
    body: `    <p class="intro reading">Walks for education, peace and faith. Each one says what it was for, how far it went, and who reported it.</p>
    <ul class="jlist">
${rows.map((r) => journeyRow(r, p, "h3")).join("\n")}
    </ul>
    <p>${internalButton(p, "/journeys/", "All journeys, with filters", "button--secondary")}</p>`,
  });

  // 04
  const before = ["teaching", "edutab", "mwalimutab", "codeimpact"].map((id) => timeline.find((t) => t.id === id));
  const beforeCh = chapter({
    id: "before",
    num: "04",
    heading: "Before the miles",
    body: `    <p class="intro reading">Before the long walks there were classrooms, tablets and coding clubs. The record is below, with the source beside each line.</p>
    <ul class="cards cards--four">
${before
  .map(
    (t) => `      <li class="card">
        <p class="card__when">${esc(t.when)}</p>
        <h3>${esc(t.title)}</h3>
        <p>${md(t.text, p)}</p>
        <p class="card__foot">${evidenceTag(t.evidence)}</p>
      </li>`
  )
  .join("\n")}
    </ul>
    <p>${internalButton(p, "/his-story/", "The full timeline", "button--secondary")}</p>`,
  });

  // 05
  const people = chapter({
    id: "people",
    num: "05",
    heading: "People along the way",
    body: `    <p class="reading">On Sunday 2 August 2026, people met the end of the Faith in Motion walk along the road at Kiburara. These photographs were supplied through PCI.</p>
    <div class="essay">
      <figure class="essay__lead">${img("kiburara-procession", { ctx: p, alt: "Shyaka walking along a dirt road at Kiburara among a crowd of people carrying green branches.", sizes: "(min-width: 1024px) 700px, 100vw" })}<figcaption class="caption">The welcome procession at Kiburara.</figcaption></figure>
      <figure class="essay__a">${img("arrival-celebration", { ctx: p, alt: "Shyaka smiling in a selfie with four women at the finish in Kiburara. One of them holds a leaflet.", sizes: "(min-width: 1024px) 460px, 100vw" })}<figcaption class="caption">Arrival celebration with supporters.</figcaption></figure>
      <figure class="essay__b">${img("kiburara-crowd", { ctx: p, alt: "A crowd of adults and children on a road at Kiburara, with Shyaka’s face at the right edge of the frame.", sizes: "(min-width: 1024px) 460px, 100vw" })}<figcaption class="caption">Community welcome at the finish.</figcaption></figure>
    </div>
    <p>${internalButton(p, "/gallery/", "See the gallery", "button--secondary")}</p>`,
  });

  // 06
  const voice = chapter({
    id: "voice",
    num: "06",
    heading: "In his own voice",
    body: `    <p class="reading">Where Shyaka speaks for himself, on the record, he is easy to find. These are the originals. They open on the publisher’s own page.</p>
    <ul class="cards cards--two">
${listen
  .slice(0, 2)
  .map(
    (m, i) => `      <li class="card card--media">
        <p class="card__when">${esc(m.kind)} · ${esc(m.date)}</p>
        <h3>${esc(m.title)}</h3>
        <p class="muted">${esc(m.outlet)}</p>
        <p>${esc(m.note)}</p>
        <p>${ext(m.url, `${icons.play}<span>${i === 0 ? "Watch on YouTube" : "Listen on Apple Podcasts"}</span>`, "button button--secondary")}</p>
      </li>`
  )
  .join("\n")}
    </ul>
    <p>${internalButton(p, "/media/", "The media room", "button--secondary")}</p>`,
  });

  // 07
  const fieldCh = chapter({
    id: "notes",
    num: "07",
    heading: "Field notes",
    body: `    <p class="reading">Dated records from the road, written from what the sources say. Nothing here is written in Shyaka’s voice unless he wrote the words himself.</p>
    <ol class="notelist">
${notes
  .slice(0, 3)
  .map(
    (n) => `      <li class="notelist__item">
        <p class="notelist__date">${esc(n.dateLabel)}<span class="notelist__place">${esc(n.place)}</span></p>
        <h3><a href="${a(`/field-notes/#${n.id}`)}">${esc(n.title)}</a></h3>
      </li>`
  )
  .join("\n")}
    </ol>
    <p>${internalButton(p, "/field-notes/", "All field notes", "button--secondary")}</p>`,
  });

  const carry = `<section class="band band--dark" id="carry" aria-labelledby="carry-h">
  <div class="container">
    <p class="eyebrow eyebrow--onink">08 · Carry the purpose</p>
    <h2 id="carry-h">You do not have to walk to be part of a walk.</h2>
    <ul class="cards cards--three cards--onink">
      <li class="card"><h3>Support the current walk</h3><p>Follow the walk and find the official ways to give on PCI’s Walk for Education page.</p><p>${externalButton(currentWalk.url, "Go to PCI", "button--onink")}</p></li>
      <li class="card"><h3>Host a stop</h3><p>Welcome a walk at your school, church, club or community.</p><p>${internalButton(p, "/get-involved/#enquiry", "Tell us where", "button--onink")}</p></li>
      <li class="card"><h3>Invite him to speak</h3><p>Talks, interviews and media requests.</p><p>${internalButton(p, "/get-involved/#enquiry", "Send an enquiry", "button--onink")}</p></li>
    </ul>
  </div>
</section>`;

  // A slow-moving strip of the three walks. Each figure belongs to its own walk; nothing is added together.
  const tickerItems = ["Faith in Motion · about 400 km · 2026", "Peace walk · 300 km · 2024 to 2025", "Walk for Education · about 1,100 km planned · 2026", "Every step has a story"];
  const tickerRun = (hidden) => `<ul class="ticker__run"${hidden ? ' aria-hidden="true"' : ""}>${tickerItems.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  const ticker = `<div class="ticker" role="group" aria-label="The three walks"><div class="ticker__track">${tickerRun(false)}${tickerRun(true)}</div></div>`;

  const visualStories = `<section class="block visual-stories" aria-labelledby="visual-stories-h"><div class="container">
    <div class="visual-stories__heading"><div><p class="eyebrow">A life in motion</p><h2 id="visual-stories-h">The road.<br>The people.<br>The purpose.</h2></div><p>A quiet moment, a shared conversation, another path ahead. Explore the stories that give the miles their meaning.</p></div>
    <div class="visual-stories__grid">
      <a class="visual-story visual-story--portrait" href="${a('/his-story/')}">${img('campaign-portrait',{ctx:p,alt:'Campaign portrait of Mbanda seated beside a path.',sizes:'(min-width: 800px) 40vw, 100vw'})}<span><small>Meet the walker</small><strong>The person behind the miles</strong>${icons.arrow}</span></a>
      <a class="visual-story" href="${a('/live/')}">${img('campaign-riverside',{ctx:p,alt:'Campaign artwork of Mbanda reflecting beside a river.',sizes:'(min-width: 800px) 55vw, 100vw'})}<span><small>From the road</small><strong>Moments worth sharing</strong>${icons.arrow}</span></a>
      <a class="visual-story" href="${a('/community/')}">${img('campaign-community',{ctx:p,alt:'Campaign artwork of Mbanda and illustrative adult walking companions.',sizes:'(min-width: 800px) 55vw, 100vw'})}<span><small>Walk with the purpose</small><strong>There is room for you</strong>${icons.arrow}</span></a>
    </div><p class="visual-stories__credit">AI-generated campaign artwork, inspired by the supplied PCI and personal photographs. <a href="${a('/gallery/?collection=artwork#gallery')}">Explore all 12 new scenes</a>.</p>
  </div></section>`;

  const body = `${hero}
${ticker}
${homepageJournal()}
${visualStories}
<div class="container thread" data-thread>
${meet}
${now}
${journeysCh}
${beforeCh}
${people}
${voice}
${fieldCh}
</div>
${donateSection(p)}
${carry}`;

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      description: site.description,
      ...(site.url ? { url: site.url } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: site.person,
      alternateName: [site.alsoPublishedAs, "The Walking Rotarian"],
      description: bio.short,
      ...(site.url ? { url: site.url } : {}),
    },
  ];

  return { path: p, title: "Home", description: site.description, body, jsonld };
}
