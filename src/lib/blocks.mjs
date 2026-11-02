// Reusable pieces of page: chapters, journey rows, source lists, facts.
import { esc, md, rel, ext, icons, chip, paras } from "./util.mjs";
import { topicLabels, statusLabels } from "../data/journeys.mjs";
import { site, currentWalk } from "../data/site.mjs";

/** One numbered chapter on the "journey thread". */
export function chapter({ id, num, heading, body, cls = "" }) {
  return `<section class="chapter ${cls}" id="${id}" aria-labelledby="${id}-h" data-chapter>
  <div class="chapter__rail" aria-hidden="true"><span class="chapter__dot"></span><span class="chapter__num">${num}</span></div>
  <div class="chapter__main">
    <h2 id="${id}-h">${esc(heading)}</h2>
${body}
  </div>
</section>`;
}

export const evidenceTag = (text) =>
  `<span class="evidence"><span class="evidence__label">Evidence</span> ${esc(text)}</span>`;

export function sourceList(sources, ctx) {
  if (!sources || !sources.length) return "";
  return `<ol class="sources">
${sources
  .map((s) => {
    const meta = [s.kind, s.date].filter(Boolean).join(" · ");
    return `  <li class="source">${ext(s.url, esc(s.label))}${meta ? `<span class="source__meta">${esc(meta)}</span>` : ""}${s.note ? `<span class="source__note">${md(s.note, ctx)}</span>` : ""}</li>`;
  })
  .join("\n")}
</ol>`;
}

export function facts(pairs) {
  return `<dl class="facts">
${pairs
  .filter(([, v]) => v)
  .map(([k, v]) => `  <div class="facts__row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`)
  .join("\n")}
</dl>`;
}

/** A row in the journeys list (index page and home page). */
export function journeyRow(r, ctx, hl = "h2") {
  const hasPage = r.page !== false;
  const href = hasPage ? rel(ctx, `/journeys/${r.slug}/${r.anchor ? "#" + r.anchor : ""}`) : "";
  const src = !hasPage && r.record?.sources?.[0] ? r.record.sources[0] : null;
  return `<li class="jrow" data-topic="${r.topic}" data-status="${r.status}">
  <p class="jrow__when">${esc(r.dateLabel)}</p>
  <div class="jrow__main">
    <${hl} class="jrow__title">${hasPage ? `<a href="${href}">${esc(r.title)}</a>` : esc(r.title)}</${hl}>
    ${r.route ? `<p class="jrow__route">${esc(r.route)}</p>` : ""}
    <p class="jrow__summary">${esc(r.summary)}</p>
    ${r.note ? `<p class="jrow__note">${esc(r.note)}</p>` : ""}
    ${src ? `<p class="jrow__source">Source: ${ext(src.url, esc(src.label))}</p>` : ""}
  </div>
  <dl class="jrow__facts">
    ${r.distance ? `<div><dt>Distance</dt><dd>${esc(r.distance)}</dd></div>` : ""}
    <div><dt>Evidence</dt><dd>${esc(r.evidence)}</dd></div>
  </dl>
  <p class="jrow__status">${chip(r.status, statusLabels)}<span class="topic">${esc(topicLabels[r.topic])}</span></p>
</li>`;
}

/** Filter buttons. The page script shows them and wires them up. */
export function filterBar({ id, target, groups, countLabel }) {
  return `<div class="filters" data-filters data-target="${target}" data-noun="${esc(countLabel)}" hidden>
${groups
  .map(
    (g) => `  <div class="filter-group" role="group" aria-labelledby="${id}-${g.attr}">
    <p class="filter-group__label" id="${id}-${g.attr}">${esc(g.label)}</p>
    <div class="filter-group__buttons">
${g.options.map((o, i) => `      <button type="button" class="filter-btn" data-attr="${g.attr}" data-value="${esc(o.value)}" aria-pressed="${i === 0 ? "true" : "false"}">${esc(o.label)}</button>`).join("\n")}
    </div>
  </div>`
  )
  .join("\n")}
  <p class="filter-count" role="status" aria-live="polite" data-count></p>
</div>`;
}

export function externalButton(url, label, cls = "") {
  return ext(url, esc(label), `button ${cls}`.trim());
}

export function internalButton(ctx, href, label, cls = "") {
  return `<a class="button ${cls}" href="${rel(ctx, href)}">${esc(label)}${icons.arrow}</a>`;
}

/** "Walk beside him": a calm pledge form. It opens WhatsApp with a message ready; no money moves here. */
export function pledgeSection(ctx) {
  const amounts = [20000, 50000, 100000];
  return `<section class="block block--tint pledge" id="pledge" aria-labelledby="pledge-h">
  <div class="container pledge__grid">
    <div class="pledge__intro">
      <p class="eyebrow">Walk beside him</p>
      <h2 id="pledge-h">Make a pledge</h2>
      <p class="intro intro--light">If the walk has meant something to you, say so with a pledge. Give what feels right, or nothing at all. Following along is welcome too.</p>
      <ul class="pledge__notes">
        <li><strong>A pledge is a promise, not a payment.</strong> This site takes no money and shows no payment details.</li>
        <li>Pressing the button opens WhatsApp, addressed to ${esc(site.person)}, with your message ready. Nothing is sent until you press Send there.</li>
        <li>To give to the official campaign, use ${ext(currentWalk.url, "PCI’s Walk for Education page")}.</li>
      </ul>
    </div>
    <form class="pledge-form panel" novalidate data-wa="${esc(site.whatsapp)}" aria-describedby="pledge-status">
      <fieldset class="pledge-form__amounts">
        <legend>Pick an amount, or write your own</legend>
        <div class="chips" role="group" aria-label="Suggested amounts">
${amounts.map((n) => `          <button class="amt" type="button" data-amt="${n}" aria-pressed="false">${n.toLocaleString("en-US")}</button>`).join("\n")}
        </div>
      </fieldset>
      <div class="field"><label for="p-amt">Pledge amount <span aria-hidden="true">*</span></label>
        <div class="pledge-form__money"><label class="visually-hidden" for="p-cur">Currency</label><select id="p-cur" name="currency"><option value="UGX">UGX</option><option value="USD">USD</option></select><input id="p-amt" name="amount" type="text" inputmode="numeric" autocomplete="off" required></div></div>
      <div class="field"><label for="p-name">Your name <span aria-hidden="true">*</span></label><input id="p-name" name="name" type="text" autocomplete="name" required></div>
      <div class="field"><label for="p-note">A line for him <span class="optional">(optional)</span></label><input id="p-note" name="note" type="text" maxlength="200"></div>
      <div class="form-actions"><button class="button button--clay" type="submit">Pledge on WhatsApp${icons.arrow}</button></div>
      <div class="form-status" id="pledge-status" role="status" aria-live="polite" tabindex="-1"></div>
      <noscript><p>This needs JavaScript. You can also <a href="https://wa.me/${esc(site.whatsapp)}" rel="noopener" target="_blank">open WhatsApp</a> and write to ${esc(site.person)} yourself.</p></noscript>
    </form>
  </div>
</section>`;
}
