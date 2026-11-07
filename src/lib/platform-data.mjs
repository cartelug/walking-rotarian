import { site, currentWalk } from '../data/site.mjs';
import { journeys } from '../data/journeys.mjs';
import { notes } from '../data/fieldnotes.mjs';
import { items } from '../data/gallery.mjs';
import { bio, timeline } from '../data/story.mjs';
import * as media from '../data/media.mjs';
import { BASE, manifest } from './util.mjs';
import fs from 'node:fs';
import {visibleEntries, validateRecord} from '../assets/platform/model.js';

const journal = JSON.parse(fs.readFileSync(new URL('../data/journal.json', import.meta.url), 'utf8'));
const publishedJournal = journal.map(entry => ({...validateRecord('entries', entry), updatedAt: entry.updatedAt}));

const image = name => name && manifest[name] ? `${BASE}/assets/img/${name}-${manifest[name].widths.includes(800)?800:manifest[name].widths.at(-1)}.webp` : '';
export function platformData() {
  return {
    version:1, generatedAt:new Date().toISOString(),
    settings:{name:site.name,person:site.person,email:site.email,siteUrl:site.url,basePath:BASE,currentJourney:currentWalk.journeySlug,
      socials:{linkedin:'https://www.linkedin.com/in/mbanda-shyaka-0313a58a/'},
      campaignUrl:currentWalk.url,contributeUrl:currentWalk.contributeUrl,stepRate:5000,currency:'UGX',stepRateSource:currentWalk.url,
      bio:bio.short,portrait:image('portrait'),logo:`${BASE}/assets/img/logo-ink-320.webp`,publishing:site.publishing,
    },
    journeys:journeys.map(j=>({id:j.slug,slug:j.slug,title:j.title,summary:j.summary||'',route:j.route||'',years:j.years||'',topic:j.topic||'',walkStatus:j.status,status:'published',distance:j.distance||'',distanceBasis:j.distanceBasis||'',image:image(j.hero?.image),url:j.page?`${BASE}/journeys/${j.slug}/`:`${BASE}/journeys/`,source:j.record?.sources?.[0]?.url||''})),
    entries:visibleEntries([...publishedJournal,...notes.map(n=>({id:n.id,title:n.title,body:n.text.join('\n\n'),journey:n.journey||'',place:n.place||'',type:'update',status:'published',publishedAt:`${n.date}T12:00:00+03:00`,dateOnly:true,author:'Editorial record',evidence:n.evidence,sources:n.source?[n.source]:[],media:n.image?[{id:n.image.image,url:image(n.image.image),type:'image',alt:n.image.alt,caption:n.image.caption,credit:n.image.caption.includes('Supplied')?'':'Supplied via PCI'}]:[],pinned:false}))]),
    media:items.map(m=>({id:m.id,title:m.title,journey:m.journey||'',url:image(m.image),type:'image',alt:m.alt,caption:m.caption,credit:m.credit,status:'published',source:m.source})),
    checkpoints:[],distances:[],tracks:[],finance:[],recognition:[],translations:[],opportunities:[],
    partners:[{id:'pci',title:'Pamodzi Community Initiative',role:'Walk for Education campaign convener',summary:'Lead convener and overall campaign coordinator.',url:currentWalk.url,status:'published',journey:currentWalk.journeySlug}],
    causes:[{id:'education',title:'Education at Kagando',journey:currentWalk.journeySlug,summary:currentWalk.purpose,url:currentWalk.url,status:'published'},
      {id:'faith',title:'St Joseph Rwembyo',journey:'faith-in-motion',summary:'Faith in Motion supported completion of St Joseph Rwembyo Catholic Church at Kiburara. Follow the organiser for project updates.',url:'https://pamodzici.com/walk/',status:'published'}],
    coverage:media.press||media.pressList||[],listen:media.listen||[],
    searchExtras:timeline.map(t=>({title:t.title,body:t.text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1'),url:`${BASE}/his-story/#${t.id}`,type:'biography'})),
  };
}
