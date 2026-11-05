import { site } from '../data/site.mjs';
import { platformData } from '../lib/platform-data.mjs';
import { esc, rel } from '../lib/util.mjs';
import { pageHead } from '../lib/layout.mjs';

const intro=(p,title,description,body)=>({path:p,title,description,current:p.split('/')[1],body:`${pageHead({eyebrow:'The Walking Rotarian',title,intro:description})}<section class="block"><div class="container wr-platform">${body}</div></section>`});
const actions=p=>`<nav class="wr-section-nav" aria-label="Journey tools">${[['/live/','Live journal'],['/journey-atlas/','Journey atlas'],['/archive/','Search & archive'],['/saved/','Saved stories'],['/reports/','Journey reports']].map(([href,label])=>`<a href="${rel(p,href)}">${label}</a>`).join('')}</nav>`;
const loading='<p class="wr-loading" role="status">Loading stories from the road…</p>';
export function journalCard(e,p){return `<article class="wr-entry" id="entry-${esc(e.id)}"><p class="eyebrow">${esc(e.place||'From the archive')} · ${esc(e.author)}</p><h2><a href="${rel(p,`/journal/${e.id}/`)}">${esc(e.title)}</a></h2><p>${esc(e.body.slice(0,300))}</p><p><a href="${rel(p,`/journal/${e.id}/`)}">Read this story</a></p></article>`;}
export function platformPages(){
  const seed=platformData();
  return [
    intro('/live/','Live journal','Small moments, daily reflections and stories from the road. Every update belongs to a journey.',`${actions('/live/')}<div data-wr="journal"><noscript>${seed.entries.slice(0,5).map(e=>journalCard(e,'/live/')).join('')}</noscript>${loading}</div>`),
    intro('/journey-atlas/','Journey atlas','Explore the walks, their purpose and the approved records that connect each day.',`${actions('/journey-atlas/')}<div data-wr="atlas">${loading}</div>`),
    intro('/archive/','Search & archive','Find a story, place, cause or walk. Planned, underway and completed journeys stay clearly labelled.',`${actions('/archive/')}<div data-wr="archive">${loading}</div>`),
    intro('/saved/','Saved stories','Your reading list on this device. Save an entry from the live journal and return whenever you have time.',`${actions('/saved/')}<div data-wr="saved">${loading}</div>`),
    intro('/community/','Walk with the purpose','Send encouragement, ask a question, offer your skills or request to join a published walking opportunity.',`<div data-wr="community">${loading}</div><noscript><p>Email <a href="mailto:${esc(site.email)}">${esc(site.email)}</a> to contact the team.</p></noscript>`),
    intro('/partners/','Causes & partnerships','The people, institutions and causes behind the miles. Explore a purpose, support the campaign or start a conversation.',`<div data-wr="partners">${loading}</div>`),
    intro('/reports/','Journey reports','Create a personal reading copy or an editor-selected report of a journey, with dates, photographs and sources.',`${actions('/reports/')}<div data-wr="reports">${loading}</div>`),
    intro('/subscribe/','Your journey updates','Confirm your email subscription or manage the journeys and update frequency you follow.',`<div data-wr="subscription">${loading}</div>`),
    {...intro('/studio/','Publishing studio','A simple place for Mbanda and the team to publish, organise the journey and follow up on requests.',`<div data-wr="studio">${loading}</div><noscript><p>The publishing studio needs JavaScript. The public journal remains available without signing in.</p></noscript>`),noindex:true},
    {...intro('/offline/','A pause in the connection','You are reading a saved part of the journey.',`<p>Reconnect for the latest updates and media. Your saved story text stays on this device.</p><div class="wr-actions"><a class="wr-action" href="${rel('/offline/','/saved/')}">Open saved stories</a><a class="wr-action" href="${rel('/offline/','/live/')}">Try the live journal</a></div>`),noindex:true},
    ...seed.entries.map(e=>({path:`/journal/${e.id}/`,title:e.title,description:e.body.slice(0,160),current:'live',body:`<section class="block"><div class="container wr-story"><p><a href="${rel(`/journal/${e.id}/`,'/live/')}">Live journal / All stories</a></p><article data-wr="story" data-entry="${esc(e.id)}"><p class="eyebrow">${esc(e.place)} · ${esc(e.author)}</p><h1>${esc(e.title)}</h1><p><time datetime="${esc(e.publishedAt)}">${esc(e.publishedAt.slice(0,10))}</time></p>${e.body.split('\n\n').map(t=>`<p>${esc(t)}</p>`).join('')}${e.media.map(m=>`<figure><img src="${esc(m.url)}" alt="${esc(m.alt)}" width="1000" height="750" loading="lazy"><figcaption>${esc(m.caption)} ${esc(m.credit)}</figcaption></figure>`).join('')}${e.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></p>`).join('')}</article></div></section>`})),
  ];
}

export function homepageJournal(){const p='/';return `<section class="block block--tint" aria-labelledby="journal-preview-h"><div class="container"><div class="wr-section-heading"><div><p class="eyebrow">The living journal</p><h2 id="journal-preview-h">Latest from the road</h2></div><a class="button button--secondary" href="${rel(p,'/live/')}">Open the live journal</a></div><div data-wr="preview">${platformData().entries.slice(0,3).map(e=>journalCard(e,p)).join('')}</div><p class="muted">Dated records and new updates, with sources and the last published time. Live blogging does not imply continuous GPS tracking.</p></div></section>`;}
