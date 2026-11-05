// Shared, dependency-free rules used by the reader, studio and server.
export const ENTRY_TYPES = ['update', 'reflection', 'checkpoint', 'milestone', 'announcement', 'photo-essay'];
export const CONTENT_KINDS = ['entries', 'journeys', 'checkpoints', 'distances', 'tracks', 'media', 'partners', 'causes', 'finance', 'recognition', 'translations', 'opportunities'];
export const ROLES = ['owner', 'editor', 'contributor', 'finance'];
export const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cleanText = (value, max = 20000) => String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
export const slugify = value => cleanText(value, 180).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
export function webURL(value, { relative = false, empty = true } = {}) {
  const s = cleanText(value, 2048);
  if (!s && empty) return '';
  if (relative && /^\/(?!\/)[^\s\\]*$/.test(s)) return s;
  try { const u = new URL(s); if (['http:', 'https:'].includes(u.protocol) && !u.username && !u.password) return u.href; } catch {}
  throw new Error('Use a complete http or https web address.');
}
export function facebookURL(value) {
  const s = webURL(value);
  if (!s) return '';
  const u = new URL(s);
  if (!['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch'].includes(u.hostname)) throw new Error('Use a Facebook post or video address.');
  return u.href;
}
export function visibleEntries(entries, now = Date.now()) {
  return entries.filter(e => ['published', 'scheduled'].includes(e.status) && Date.parse(e.publishedAt) <= now)
    .sort((a,b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
export function distanceTotal(rows, journey) {
  const unique = new Map();
  rows.filter(r => r.journey === journey && r.status === 'published' && r.verified === true).forEach(r => unique.set(r.date, r));
  return [...unique.values()].reduce((n,r) => n + Number(r.km || 0), 0);
}
export function validateRecord(kind, input) {
  if (!CONTENT_KINDS.includes(kind) || !input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Unknown content type.');
  const r = { id: slugify(input.id || input.title || input.name || ''), title: cleanText(input.title || input.name, 180), journey: slugify(input.journey || ''), status: input.status || 'draft' };
  if (!['draft','published','scheduled','archived'].includes(r.status)) throw new Error('Choose a valid publication status.');
  if (!r.id) throw new Error('A title or identifier is required.');
  if (kind === 'entries') {
    Object.assign(r, { body: cleanText(input.body, 60000), type: ENTRY_TYPES.includes(input.type) ? input.type : 'update',
      place: cleanText(input.place, 180), author: cleanText(input.author || 'Walking Rotarian team', 140), pinned: input.pinned === true,
      publishedAt: input.publishedAt || new Date().toISOString(), correction: cleanText(input.correction, 2000), language: cleanText(input.language || 'en', 12),
      facebookUrl: facebookURL(input.facebookUrl || ''), sources: (Array.isArray(input.sources) ? input.sources : []).slice(0,12).map(s => ({label:cleanText(s.label,180),url:webURL(s.url,{empty:false})})),
      media: (Array.isArray(input.media) ? input.media : []).slice(0,20).map(m => ({id:slugify(m.id || ''), url:webURL(m.url,{relative:true,empty:false}), type:['image','video','audio'].includes(m.type) ? m.type : 'image', alt:cleanText(m.alt,600), caption:cleanText(m.caption,2000), credit:cleanText(m.credit,600)})),
    });
    if (!r.title) r.title = r.body.split(/[.!?\n]/)[0].slice(0,90) || 'From the road';
    if (!r.body && !r.media.length) throw new Error('Add a message or media before saving.');
    if (!Number.isFinite(Date.parse(r.publishedAt))) throw new Error('Choose a valid publication date.');
    if (r.status === 'published' && Date.parse(r.publishedAt) > Date.now() + 60000) throw new Error('Use Scheduled for a future publication date.');
  } else if (kind === 'journeys') {
    Object.assign(r, { slug:r.id, summary:cleanText(input.summary), route:cleanText(input.route,500), topic:cleanText(input.topic,60), years:cleanText(input.years,40),
      walkStatus:['underway','resting','completed','proposed'].includes(input.walkStatus) ? input.walkStatus : 'proposed', distance:cleanText(input.distance,140), distanceBasis:cleanText(input.distanceBasis,500), image:webURL(input.image,{relative:true}), url:webURL(input.url,{relative:true}), startDate:cleanText(input.startDate,10) });
  } else if (kind === 'checkpoints') {
    Object.assign(r,{ place:cleanText(input.place || input.title,180), date:cleanText(input.date,10), day:Number(input.day)||null, lat:Number(input.lat), lon:Number(input.lon), source:webURL(input.source,{empty:false}), verified:input.verified === true, entryId:slugify(input.entryId || '') });
    if (!r.journey || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(r.lat) || Math.abs(r.lat)>90 || !Number.isFinite(r.lon) || Math.abs(r.lon)>180) throw new Error('A checkpoint needs a journey, valid date and valid coordinates.');
    if (r.status === 'published' && !r.verified) throw new Error('Confirm this checkpoint before publishing it.');
  } else if (kind === 'distances') {
    Object.assign(r,{date:cleanText(input.date,10), km:Number(input.km), source:cleanText(input.source,1000), verified:input.verified===true});
    if (!r.journey || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(r.km) || r.km<0 || r.km>250 || !r.source) throw new Error('Enter a journey, date, daily distance (0-250 km) and source.');
    r.id = `${r.journey}-${r.date}`;
    if (r.status==='published'&&!r.verified) throw new Error('Verify the daily record before publishing it.');
  } else if (kind === 'tracks') {
    const points=Array.isArray(input.points)?input.points:[];
    if (!r.journey || !points.length || points.length>5000 || points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180)) throw new Error('Use a GPX track with 1-5,000 valid coordinates.');
    Object.assign(r,{points:points.map(p=>p.map(n=>Math.round(n*100000)/100000)),recordedAt:cleanText(input.recordedAt,40),source:cleanText(input.source,500),verified:input.verified===true});
    if (!r.recordedAt || !r.source || (r.status==='published'&&!r.verified)) throw new Error('Add the recording date and source, then approve the track.');
  } else if (kind === 'media') {
    Object.assign(r,{url:webURL(input.url,{relative:true,empty:false}),type:['image','audio','video'].includes(input.type)?input.type:'image',alt:cleanText(input.alt,600),caption:cleanText(input.caption,2000),credit:cleanText(input.credit,600),filename:cleanText(input.filename,120)});
  } else if (kind === 'finance') {
    Object.assign(r,{confirmed:Number(input.confirmed),pledged:Number(input.pledged),currency:cleanText(input.currency||'UGX',8),source:webURL(input.source,{empty:false}),asOf:cleanText(input.asOf,10),verified:input.verified===true});
    if (!r.journey || ![r.confirmed,r.pledged].every(n=>Number.isFinite(n)&&n>=0) || !/^\d{4}-\d{2}-\d{2}$/.test(r.asOf) || (r.status==='published'&&!r.verified)) throw new Error('Finance figures need a journey, date, source and verification.');
    r.id=r.journey;
  } else if (kind === 'recognition') {
    Object.assign(r,{name:cleanText(input.name,180),message:cleanText(input.message,2000),anonymous:input.anonymous===true,consent:input.consent===true});
    if (r.status==='published'&&!r.consent) throw new Error('Public recognition needs the supporter\'s consent.');
  } else if (kind === 'translations') {
    Object.assign(r,{entryId:slugify(input.entryId),language:cleanText(input.language,12),body:cleanText(input.body,60000),reviewed:input.reviewed===true});
    if (!r.entryId || !r.language || !r.body || (r.status==='published'&&!r.reviewed)) throw new Error('A translation needs a story, language and reviewed text.');
  } else {
    Object.assign(r,{body:cleanText(input.body),summary:cleanText(input.summary,3000),url:webURL(input.url),image:webURL(input.image,{relative:true}),role:cleanText(input.role,140),date:cleanText(input.date,40),contactNote:cleanText(input.contactNote,500)});
  }
  return r;
}
