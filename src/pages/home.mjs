import {site, currentWalk} from '../data/site.mjs';
import {indexRows, topicLabels} from '../data/journeys.mjs';
import {listen} from '../data/media.mjs';
import {esc, rel, ext, icons, img} from '../lib/util.mjs';
import {donateSection} from '../lib/blocks.mjs';
import {homepageJournal} from './platform.mjs';

export function home(){
 const p='/'; const a=to=>rel(p,to);
 const photo=(name,alt,opts={})=>img(name,{ctx:p,alt,...opts});
 const link=(href,label,cls='button')=>`<a class="${cls}" href="${a(href)}">${label}${icons.arrow}</a>`;
 const routes=indexRows().slice(0,3);
 // Built-in journeys keep their chosen pictures; a journey added from the admin shows its own photograph.
 const routeImages={'walk-for-education':'editorial-road','faith-in-motion':'kiburara-procession','peace-walk-nakivale-makerere':'campaign-forest'};
 const routePicture=(r,i)=>r.hero?.url&&!routeImages[r.slug]?`<img src="${esc(r.hero.url)}" alt="${esc(r.hero.alt)}" width="1200" height="900" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="object-fit:cover">`:photo(routeImages[r.slug]||['editorial-road','kiburara-procession','campaign-forest'][i],r.slug==='faith-in-motion'?'The community welcome at Kiburara.':'A green landscape and a road stretching toward the horizon.',{sizes:'(min-width: 900px) 50vw, 90vw'});
 const routeLabel=r=>topicLabels[r.topic]||'Journey';
 const mission=`<section class="wr-current wr-scene wr-journey-picker" id="current-walk" aria-labelledby="current-h" data-journey-explorer><div class="container"><div class="wr-route-heading"><div><p class="eyebrow">Education. Faith. Peace.</p><h2 id="current-h">Every road.<br><span>A reason.</span></h2></div><div><p>Choose a journey. Meet the people and the purpose behind each walk.</p><div class="wr-purpose-tabs" role="tablist" aria-label="Explore a walking purpose">${routes.map((r,i)=>`<button id="purpose-tab-${i}" type="button" role="tab" aria-selected="${i===0}" aria-controls="purpose-panel-${i}" tabindex="${i===0?0:-1}">${esc(routeLabel(r))}</button>`).join('')}</div></div></div>${routes.map((r,i)=>`<div class="wr-route-panel" id="purpose-panel-${i}" role="tabpanel" aria-labelledby="purpose-tab-${i}" tabindex="0"${i?' hidden':''}><figure>${routePicture(r,i)}<figcaption>${r.slug==='faith-in-motion'?'The welcome at Kiburara':esc(r.hero?.caption&&!routeImages[r.slug]?r.hero.caption:'A road ahead. A reason to walk.')}</figcaption><span class="wr-route-panel__stamp">0${i+1} / ${esc(routeLabel(r).toUpperCase())}</span></figure><div class="wr-route-panel__copy"><p class="eyebrow"><span class="wr-live-dot" aria-hidden="true"></span> ${esc(r.dateLabel)}</p><h3>${esc(r.title)}</h3><p class="wr-route-panel__route">${esc(r.route)}</p><p>${esc(r.summary)}</p><div class="wr-distance"><strong>${esc(r.distance)}</strong><span>${esc(r.distanceBasis||r.evidence)}</span></div><div class="wr-actions">${link('/journeys/'+r.slug+'/','Discover this journey','button button--onink')}${r.slug==='walk-for-education'&&r.status==='underway'?link('/donate/?purpose=education','Support this journey','wr-text-link'):link('/live/?journey='+r.slug,'Read the journal','wr-text-link')}</div></div></div>`).join('')}<div class="wr-route-more">${link('/journeys/','Explore every journey','wr-text-link')}${link('/journey-atlas/','Open the journey atlas','wr-text-link')}</div></div></section>`;
 const body=`
<section class="wr-opening" aria-labelledby="hero-h"><span class="wr-opening__wordmark" aria-hidden="true">THE WALKING ROTARIAN</span>
 <div class="wr-opening__landscape" aria-hidden="true"></div>
 <div class="container wr-opening__grid">
  <div class="wr-opening__copy">
   <p class="eyebrow">Mbanda Shyaka / The Walking Rotarian</p>
   <h1 id="hero-h">Every step<br>has a <span>story.</span></h1>
   <p class="wr-opening__intro">One man. A road ahead.<br>A purpose bigger than the miles.</p>
   <div class="wr-opening__actions">${link('/live/','Follow the journey','button button--clay')}${link('/donate/','Make a difference','wr-text-link')}</div>
  </div>
  <figure class="wr-opening__portrait">
   <span class="wr-opening__halo" aria-hidden="true"></span>
   ${photo('shyaka-cutout','Mbanda Shyaka, the Walking Rotarian, smiling in his grey Rotary shirt.',{priority:true,lazy:false,sizes:'(min-width: 900px) 48vw, 92vw'})}
   <figcaption>Mbanda Shyaka<span>Walking with purpose.</span></figcaption>
  </figure>
 </div>
 <div class="container wr-opening__trail"><span aria-hidden="true">01 / THE JOURNEY CONTINUES</span><a href="#current-walk">Discover the purpose <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v11M4 9l4 4 4-4"/></svg></a></div>
</section>

${mission}

${homepageJournal()}

<section class="wr-person wr-scene" aria-labelledby="person-h"><div class="container wr-person__grid">
 <figure class="wr-person__visual">${photo('shyaka-walking-cutout','Mbanda Shyaka walking with a backpack.',{sizes:'(min-width: 900px) 40vw, 80vw',cls:'wr-walker'})}</figure>
 <div class="wr-person__copy"><p class="eyebrow">The person behind the miles</p><h2 id="person-h">A life in motion.<br><span>A purpose that stays.</span></h2><p class="intro">Before the long walks, there were classrooms, learning tools and communities.</p><p>Shyaka brings that same belief to the road: people can come together to move something meaningful forward. His journeys connect education, peace, faith and community.</p>${link('/his-story/','Discover his story','button button--secondary')}<a class="wr-person__signature" href="${esc('https://www.facebook.com/mbanda.shyaka')}" target="_blank" rel="noopener noreferrer">Follow Mbanda on Facebook ${icons.ext}</a></div>
</div></section>

<section class="wr-together wr-scene" aria-labelledby="together-h"><div class="container"><p class="eyebrow">The people make the journey</p><h2 id="together-h">He walks.<br><span>We move together.</span></h2><p>Every welcome, every conversation, every act of support carries the purpose further.</p>${link('/community/','Find your place in the journey','button button--onink')}</div></section>

<section class="wr-moments" aria-labelledby="moments-h"><div class="container"><div class="wr-section-heading"><div><p class="eyebrow">Real people. Real moments.</p><h2 id="moments-h">Along the way.</h2></div>${link('/gallery/','Open the gallery','wr-text-link')}</div><div class="wr-moments__grid"><figure>${photo('kiburara-procession','Shyaka walking with the welcome procession at Kiburara.',{sizes:'(min-width: 900px) 60vw, 100vw'})}<figcaption>The welcome at Kiburara · Faith in Motion, 2 August 2026</figcaption></figure><figure>${photo('arrival-celebration','Shyaka with supporters at the finish of Faith in Motion.',{sizes:'(min-width: 900px) 36vw, 100vw'})}<figcaption>A shared finish. A shared purpose. · Photographs supplied via PCI</figcaption></figure></div></div></section>

<section class="wr-listen" aria-labelledby="listen-h"><div class="container"><div class="wr-section-heading"><div><p class="eyebrow">In his own voice</p><h2 id="listen-h">Stories worth hearing.</h2></div>${link('/media/','The media room','wr-text-link')}</div><div class="wr-listen__grid">${listen.slice(0,2).map((m,i)=>`<article class="wr-listen__item"><span class="wr-listen__play" aria-hidden="true">${icons.play}</span><p class="eyebrow">${esc(m.kind)} / ${esc(m.date)}</p><h3>${esc(m.title)}</h3><p>${esc(m.outlet)}</p><p class="wr-listen__note">${esc(m.note)}</p>${ext(m.url,i===0?'Watch the talk':'Listen to the conversation','wr-text-link')}</article>`).join('')}</div></div></section>

<section class="wr-carry" aria-labelledby="carry-h"><div class="container wr-carry__grid"><div><p class="eyebrow">Carry a little of the journey</p><h2 id="carry-h">Purpose, beyond<br>the road.</h2><p>Discover the WR streetwear collection. Signature pieces for the road, the city and the story ahead.</p>${link('/shop/','Explore the collection','button button--secondary')}</div><figure>${photo('street-hero','Walking Rotarian streetwear collection with the signature WR logo.',{sizes:'(min-width: 900px) 46vw, 100vw'})}<figcaption>The Journey Collection · explore the pieces and published prices.</figcaption></figure></div></section>
${donateSection(p)}
<section class="wr-closing wr-scene"><div class="container"><p class="eyebrow">There is a place for you</p><h2>The next step<br>can be yours.</h2><div class="wr-actions">${link('/get-involved/','Walk with the purpose','button button--onink')}${link('/live/','Read the journal','wr-text-link')}</div></div></section>`;
 return {path:p,title:'Home',description:site.description,body,jsonld:[{'@context':'https://schema.org','@type':'WebSite',name:site.name,...(site.url?{url:site.url}:{})},{'@context':'https://schema.org','@type':'Person',name:site.person,alternateName:[site.alsoPublishedAs,'The Walking Rotarian']}]};
}
