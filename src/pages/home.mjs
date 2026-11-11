import {site, currentWalk} from '../data/site.mjs';
import {indexRows} from '../data/journeys.mjs';
import {listen} from '../data/media.mjs';
import {esc, rel, ext, icons, img} from '../lib/util.mjs';
import {donateSection} from '../lib/blocks.mjs';
import {homepageJournal} from './platform.mjs';

export function home(){
 const p='/'; const a=to=>rel(p,to);
 const photo=(name,alt,opts={})=>img(name,{ctx:p,alt,...opts});
 const link=(href,label,cls='button')=>`<a class="${cls}" href="${a(href)}">${label}${icons.arrow}</a>`;
 const routes=indexRows().slice(0,3);
 const routeImages=['campaign-highlands','kiburara-procession','campaign-forest'];
 const body=`
<section class="wr-opening" aria-labelledby="hero-h">
 <div class="wr-opening__landscape" aria-hidden="true"></div>
 <div class="container wr-opening__grid">
  <div class="wr-opening__copy">
   <p class="eyebrow">Mbanda Shyaka / The Walking Rotarian</p>
   <h1 id="hero-h">Every step<br>has a <span>story.</span></h1>
   <p class="wr-opening__intro">One man. A road ahead.<br>A purpose bigger than the miles.</p>
   <div class="wr-opening__actions">${link('/live/','Follow the journey','button button--clay')}${link('/his-story/','Meet Shyaka','wr-text-link')}</div>
  </div>
  <figure class="wr-opening__portrait">
   <span class="wr-opening__halo" aria-hidden="true"></span>
   ${photo('shyaka-cutout','Mbanda Shyaka, the Walking Rotarian, smiling in his grey Rotary shirt.',{priority:true,lazy:false,sizes:'(min-width: 900px) 48vw, 92vw'})}
   <figcaption>Mbanda Shyaka<span>Walking with purpose.</span></figcaption>
  </figure>
 </div>
 <div class="container wr-opening__trail"><span aria-hidden="true">01 / THE JOURNEY CONTINUES</span><a href="#current-walk">Discover the purpose <span aria-hidden="true">↓</span></a></div>
</section>

<section class="wr-current wr-scene" id="current-walk" aria-labelledby="current-h">
 <div class="container wr-current__grid">
  <div class="wr-current__heading"><p class="eyebrow"><span class="wr-live-dot" aria-hidden="true"></span> The current mission / 2026</p><h2 id="current-h">Walking for<br><span>their future.</span></h2><p class="intro">Nairobi to Kagando.<br>Education that goes further.</p></div>
  <div class="wr-current__details"><p class="wr-route-label">KENYA <span aria-hidden="true">────────</span> UGANDA</p><h3>Walk for Education</h3><p>${esc(currentWalk.purpose)}</p><div class="wr-distance"><strong>1,100 <small>km</small></strong><span>Approximate planned route<br>Not distance already walked</span></div><p class="wr-current__status">Underway · Organiser-reported. Verified stages will be added when confirmed.</p><div class="wr-actions">${link('/journeys/walk-for-education/','Explore this walk')}${ext(currentWalk.url,'Support through PCI','wr-text-link')}</div></div>
 </div>
</section>

${homepageJournal()}

<section class="wr-person wr-scene" aria-labelledby="person-h"><div class="container wr-person__grid">
 <figure class="wr-person__visual">${photo('shyaka-walking-cutout','Campaign artwork of Shyaka walking with a backpack.',{sizes:'(min-width: 900px) 40vw, 80vw',cls:'wr-walker'})}<figcaption>Campaign artwork · an illustration of the journey.</figcaption></figure>
 <div class="wr-person__copy"><p class="eyebrow">The person behind the miles</p><h2 id="person-h">A life in motion.<br><span>A purpose that stays.</span></h2><p class="intro">Before the long walks, there were classrooms, learning tools and communities.</p><p>Shyaka brings that same belief to the road: people can come together to move something meaningful forward. His journeys connect education, peace, faith and community.</p>${link('/his-story/','Discover his story','button button--secondary')}<a class="wr-person__signature" href="${esc('https://www.facebook.com/mbanda.shyaka')}" target="_blank" rel="noopener noreferrer">Follow Mbanda on Facebook ${icons.ext}</a></div>
</div></section>

<section class="wr-expeditions" aria-labelledby="expeditions-h"><div class="container"><div class="wr-section-heading"><div><p class="eyebrow">Different roads. Shared purpose.</p><h2 id="expeditions-h">The journeys.</h2></div>${link('/journeys/','Explore every walk','wr-text-link')}</div><div class="wr-expedition-grid">${routes.map((r,i)=>`<a class="wr-expedition" href="${a('/journeys/'+r.slug+'/')}"><div class="wr-expedition__image">${photo(routeImages[i],i===1?'Supporters welcome Shyaka at Kiburara.':'Campaign landscape artwork.',{sizes:'(min-width: 900px) 30vw, 90vw'})}<span class="wr-expedition__index">0${i+1}</span></div><div class="wr-expedition__copy"><p class="eyebrow">${esc(r.dateLabel)}</p><h3>${esc(r.title)}</h3><p>${esc(r.route)}</p><div class="wr-expedition__meta"><span>${esc(r.distance)}<small>${i===0?'Planned route':esc(r.evidence)}</small></span>${icons.arrow}</div></div></a>`).join('')}</div></div></section>

<section class="wr-together wr-scene" aria-labelledby="together-h"><div class="container"><p class="eyebrow">The people make the journey</p><h2 id="together-h">He walks.<br><span>We move together.</span></h2><p>Every welcome, every conversation, every act of support carries the purpose further.</p>${link('/community/','Find your place in the journey','button button--onink')}<p class="wr-art-credit">Campaign landscape artwork</p></div></section>

<section class="wr-moments" aria-labelledby="moments-h"><div class="container"><div class="wr-section-heading"><div><p class="eyebrow">Real people. Real moments.</p><h2 id="moments-h">Along the way.</h2></div>${link('/gallery/','Open the gallery','wr-text-link')}</div><div class="wr-moments__grid"><figure>${photo('kiburara-procession','Shyaka walking with the welcome procession at Kiburara.',{sizes:'(min-width: 900px) 60vw, 100vw'})}<figcaption>The welcome at Kiburara · Faith in Motion, 2 August 2026</figcaption></figure><figure>${photo('arrival-celebration','Shyaka with supporters at the finish of Faith in Motion.',{sizes:'(min-width: 900px) 36vw, 100vw'})}<figcaption>A shared finish. A shared purpose. · Photographs supplied via PCI</figcaption></figure></div></div></section>

<section class="wr-listen" aria-labelledby="listen-h"><div class="container"><div class="wr-section-heading"><div><p class="eyebrow">In his own voice</p><h2 id="listen-h">Stories worth hearing.</h2></div>${link('/media/','The media room','wr-text-link')}</div><div class="wr-listen__grid">${listen.slice(0,2).map((m,i)=>`<article class="wr-listen__item"><span class="wr-listen__play" aria-hidden="true">${icons.play}</span><p class="eyebrow">${esc(m.kind)} / ${esc(m.date)}</p><h3>${esc(m.title)}</h3><p>${esc(m.outlet)}</p><p class="wr-listen__note">${esc(m.note)}</p>${ext(m.url,i===0?'Watch the talk':'Listen to the conversation','wr-text-link')}</article>`).join('')}</div></div></section>

<section class="wr-carry" aria-labelledby="carry-h"><div class="container wr-carry__grid"><div><p class="eyebrow">Carry a little of the journey</p><h2 id="carry-h">Purpose, beyond<br>the road.</h2><p>Explore merchandise and publications. Ask the team about designs, availability and prices.</p>${link('/shop/','Explore the collection','button button--secondary')}</div><figure>${photo('campaign-essentials','Illustrative Walking Rotarian merchandise concepts.',{sizes:'(min-width: 900px) 46vw, 100vw'})}<figcaption>Collection concepts · products and prices to be confirmed.</figcaption></figure></div></section>
${donateSection(p)}
<section class="wr-closing wr-scene"><div class="container"><p class="eyebrow">There is a place for you</p><h2>The next step<br>can be yours.</h2><div class="wr-actions">${link('/get-involved/','Walk with the purpose','button button--onink')}${link('/live/','Read the journal','wr-text-link')}</div></div></section>`;
 return {path:p,title:'Home',description:site.description,body,jsonld:[{'@context':'https://schema.org','@type':'WebSite',name:site.name,...(site.url?{url:site.url}:{})},{'@context':'https://schema.org','@type':'Person',name:site.person,alternateName:[site.alsoPublishedAs,'The Walking Rotarian']}]};
}
