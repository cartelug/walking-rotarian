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

/** A clear entry point to the site's own donation journey. */
export function donateSection(ctx) {
 return `<section class="block donate wr-support-invitation" id="donate" aria-labelledby="donate-h"><div class="container"><div><p class="eyebrow">Your part in the story</p><h2 id="donate-h">A small gift.<br>A meaningful step.</h2><p>Support the Walking Rotarian or dedicate your gift to the education journey. Choose your amount and review the details in a few simple steps.</p><a class="button button--clay" href="${rel(ctx,'/donate/')}">Start your donation ${icons.arrow}</a><p class="wr-support-invitation__note">The team confirms payment instructions before you give.</p></div><div class="wr-support-mark" aria-hidden="true"><span>EVERY</span><span>STEP</span><span>MATTERS.</span><svg viewBox="0 0 240 100" fill="none"><path d="M5 90C50-30 82 150 128 50S195 5 235 10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 7"/><circle cx="235" cy="10" r="6" fill="currentColor"/></svg></div></div></section>`;
}
