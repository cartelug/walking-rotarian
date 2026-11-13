import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateRecord, cleanText, slugify, webURL} from '../src/assets/platform/model.js';
import {validateProduct, SHOP_CATEGORIES} from '../src/assets/platform/shop-model.js';
import {JOURNEY_NAMES, SOCIAL_HOSTS, validateSiteSettings} from '../src/assets/platform/github-model.js';
import {journeys as knownJourneys} from '../src/data/journeys.mjs';

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
// Built-in journey names, plus every journey's title (including journeys added from the admin).
const journeyNames = {...JOURNEY_NAMES, ...Object.fromEntries(knownJourneys.filter(j => j.slug !== 'earlier-walks').map(j => [j.title, j.slug]))};
const knownSlugs = new Set(knownJourneys.map(j => j.slug));
/** Accept a journey's name as shown on the website, or its identifier. Blank means no journey. */
function journeyFromName(value, {required = false} = {}) {
  const text = cleanText(value, 180);
  if (!text || /^(none|no journey|general update)$/i.test(text)) {
    if (required) throw new Error('Choose the journey this belongs to.');
    return '';
  }
  if (Object.hasOwn(journeyNames, text)) return journeyNames[text];
  const match = Object.keys(journeyNames).find(name => name.toLowerCase() === text.toLowerCase());
  if (match) return journeyNames[match];
  const slug = slugify(text);
  if (knownSlugs.has(slug)) return slug;
  throw new Error('Use a journey name exactly as it appears on the Journeys page.');
}

export function formSections(body) {
  const sections = {};
  const labels = new Set(['Story','Journey','Place','Author','Facebook post URL','Publication','Publishing confirmation','Product identifier','Category','Description','Price in UGX','Availability','Product photograph','Sizes','Colours','Product confirmation','Contact email','WhatsApp number','Facebook account','Instagram account','Tiktok account','Linkedin account','Youtube account','X account','Default journal journey','Connection confirmation','Walking date','Town or place','Daily kilometres','Latitude','Longitude','Verification source','Progress confirmation','Walk name','Journey page','Route','Purpose','Walk status','Status note','Planned distance','Distance basis','Campaign page','Last verified update','Current walk confirmation','Journey identifier','Dates','Start date','Cause','Distance','Evidence','Summary','What happened','Source link','Source name','Journey confirmation','Photographs','Caption','Photo description','Photo credit','Date taken','Photo confirmation','Link','Media type','Outlet','Date published','Short description','Media confirmation']);
  const text = String(body || '').replace(/\r\n/g, '\n');
  const headings = [...text.matchAll(/^### ([^\n]+)$/gm)].filter(match => labels.has(match[1].trim()));
  for (let index = 0; index < headings.length; index++) {
    const heading = headings[index], label = heading[1].trim();
    if (Object.hasOwn(sections, label)) throw new Error('A form field heading was repeated. Use ## rather than ### for headings inside your story.');
    const value = text.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? text.length).trim();
    sections[label] = value === '_No response_' ? '' : value;
  }
  return sections;
}

function attachmentURL(value) {
  const url = webURL(value, {empty: false});
  if (!url.startsWith('https://')) throw new Error('Photographs need a complete HTTPS address.');
  return url;
}

export function extractPhotographs(text) {
  const media = [];
  let body = String(text || '').replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g, (_, alt, url) => {
    media.push({url: attachmentURL(url), alt: cleanText(alt || 'Photograph supplied with the update', 600), type: 'image'});
    return '';
  });
  body = body.replace(/<img\b[^>]*>/gi, tag => {
    const url = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (url) media.push({url: attachmentURL(url), alt: cleanText(tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] || 'Photograph supplied with the update', 600), type: 'image'});
    return '';
  });
  if (media.length > 20) throw new Error('An update can contain at most 20 photographs.');
  return {body: body.trim(), media: media.map((item, index) => ({...item, id: 'photo-' + (index + 1)}))};
}

function confirm(section, expected) {
  const confirmations = String(section).split('\n').filter(line => /^- \[x\] /i.test(line));
  if (!confirmations.some(line => line.slice(6).trim() === expected)) throw new Error('Approve the public content using the confirmation checkbox.');
}

export function journalFromIssue(issue, existing = null) {
  const sections = formSections(issue.body);
  confirm(sections['Publishing confirmation'], 'I approve this content and its photographs for the public website.');
  const statuses = {'Publish now': 'published', 'Draft - keep off website': 'draft', 'Withdraw from website': 'archived'};
  const status = statuses[sections.Publication];
  if (!status) throw new Error('Choose Publish now, Draft or Withdraw from website.');
  if (!Object.hasOwn(journeyNames, sections.Journey)) throw new Error('Choose a journey from the publishing form.');
  const photos = extractPhotographs(sections.Story);
  const wasPublished = existing && (existing.firstPublishedAt || ['published', 'archived'].includes(existing.status));
  const publishedAt = wasPublished ? existing.publishedAt : status === 'published' ? issue.updated_at || issue.created_at : issue.created_at;
  const record = validateRecord('entries', {
    id: 'post-' + issue.number,
    title: cleanText(issue.title.replace(/^\[Journal\]\s*/i, ''), 180),
    body: photos.body, media: photos.media,
    journey: journeyNames[sections.Journey],
    place: sections.Place,
    author: sections.Author || 'Walking Rotarian team',
    facebookUrl: sections['Facebook post URL'] || '',
    status,
    publishedAt,
    sources: [{label: 'Published by the Walking Rotarian team', url: issue.html_url}],
  });
  return {...record, sourceIssue: issue.number, updatedAt: issue.updated_at, firstPublishedAt: existing?.firstPublishedAt || (status === 'published' ? publishedAt : null)};
}

export function productFromIssue(issue, existing = null, currency = 'UGX') {
  const sections = formSections(issue.body);
  confirm(sections['Product confirmation'], 'I confirm the product details, availability and any stated price for the public shop.');
  const statuses = {
    'Enquiry - confirm with team': 'enquiry',
    'Available - confirmed price and stock': 'available',
    'Sold out': 'sold-out',
    Hidden: 'hidden',
  };
  const status = sections.Availability === 'Keep current availability' ? existing?.status || 'enquiry' : statuses[sections.Availability];
  if (!status) throw new Error('Choose a shop availability from the form.');
  const id = slugify(sections['Product identifier']);
  if (!id) throw new Error('Enter the permanent product identifier.');
  if (existing && existing.sourceIssue === issue.number && existing.id !== id) {
    throw new Error('Keep the product identifier unchanged when editing its original form.');
  }
  const picture = sections['Product photograph'] || '';
  const photos = extractPhotographs(picture);
  const image = picture.trim() === 'REMOVE' ? '' : photos.media[0]?.url || (picture.trim() && picture.trim() !== existing?.image ? attachmentURL(picture.trim()) : existing?.image || '');
  const category = sections.Category === 'Keep current category' ? existing?.category : Object.entries(SHOP_CATEGORIES).find(([, label]) => label === sections.Category)?.[0];
  const product = validateProduct({
    id, title: issue.title.replace(/^\[Product\]\s*/i, ''), category,
    description: sections.Description,
    status, price: (sections['Price'] ?? sections['Price in UGX'])?.replace(/,/g, '') || null,
    image, illustration: existing?.illustration || (category === 'clothing' ? 'shirt' : 'book'),
    sizes: (sections.Sizes || '').split(','), colours: (sections.Colours || '').split(','),
  }, currency);
  return {...product, sourceIssue: issue.number};
}

export function settingsFromIssue(issue, existing) {
  const sections = formSections(issue.body);
  confirm(sections['Connection confirmation'], 'I checked these public contact details and official account links.');
  const next = {...existing, socials: {...existing.socials}};
  if (sections['Contact email']) next.email = sections['Contact email'];
  if (sections['WhatsApp number']) next.whatsapp = sections['WhatsApp number'];
  for (const name of Object.keys(SOCIAL_HOSTS)) {
    const value = sections[name === 'x' ? 'X account' : name[0].toUpperCase() + name.slice(1) + ' account'];
    if (value) next.socials[name] = value === 'REMOVE' ? '' : value;
  }
  if (sections['Default journal journey'] && sections['Default journal journey'] !== 'Keep current journey') {
    if (!Object.hasOwn(journeyNames, sections['Default journal journey'])) throw new Error('Choose a valid default journal journey.');
    next.currentJourney = journeyNames[sections['Default journal journey']];
  }
  return validateSiteSettings(next);
}

const isoDate = (value, label) => {
  const date = cleanText(value, 10);
  if (!date) return '';
  const parsed = new Date(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error(label + ' must be a real date in YYYY-MM-DD format, such as 2027-03-15.');
  return date;
};
const paragraphsOf = text => String(text || '').split(/\n\s*\n/).map(part => cleanText(part.replace(/\s*\n\s*/g, ' '), 4000)).filter(Boolean);
const httpsLink = (value, label) => {
  const url = webURL(value, {empty: true});
  if (url && !url.startsWith('https://')) throw new Error(label + ' must start with https://');
  return url;
};

const WALK_STATUSES = {'Underway': 'Underway', 'Completed': 'Completed', 'Starting soon': 'Starting soon', 'Paused': 'Paused'};
/** The walk shown as current across the website. Blank fields keep what is already published. */
export function currentWalkFromIssue(issue, existing = {}) {
  const sections = formSections(issue.body);
  confirm(sections['Current walk confirmation'], 'I confirm these details about the current walk are correct for the public website.');
  const next = {...existing};
  const set = (key, value) => { if (value) next[key] = value; };
  set('name', cleanText(sections['Walk name'], 140));
  set('route', cleanText(sections.Route, 240));
  set('purpose', cleanText(sections.Purpose, 600));
  set('statusNote', cleanText(sections['Status note'], 600));
  set('distance', cleanText(sections['Planned distance'], 80));
  set('distanceBasis', cleanText(sections['Distance basis'], 240));
  set('url', httpsLink(sections['Campaign page'], 'The campaign page'));
  set('lastVerifiedUpdate', isoDate(sections['Last verified update'], 'Last verified update'));
  const status = sections['Walk status'];
  if (status && status !== 'Keep current status') {
    if (!WALK_STATUSES[status]) throw new Error('Choose the walk status from the list.');
    next.status = WALK_STATUSES[status];
  }
  if (sections['Journey page']) set('journeySlug', journeyFromName(sections['Journey page'], {required: true}));
  next.sourceIssue = issue.number;
  return next;
}

const JOURNEY_STATUS = {'Underway': 'underway', 'Completed': 'completed', 'Planned (not walked yet)': 'proposed'};
const JOURNEY_TOPIC = {'Education': 'education', 'Peace': 'peace', 'Faith': 'faith', 'Wellbeing': 'wellbeing'};
const JOURNEY_EVIDENCE = ['Self-reported', 'Organiser-reported', 'Media-reported', 'Club-reported'];
/**
 * Add a new journey, or update an existing one (status, dates, distance, summary) and
 * add what happened afterwards. Each form is saved as its own record, so editing or
 * withdrawing the form changes only what that form added.
 */
export function journeyFromIssue(issue, records = []) {
  const sections = formSections(issue.body);
  confirm(sections['Journey confirmation'], 'I confirm this journey information is accurate and approved for the public website.');
  const next = records.filter(record => record.sourceIssue !== issue.number);
  if (sections.Publication === 'Withdraw this change') return next;
  if (sections.Publication !== 'Publish') throw new Error('Choose Publish or Withdraw this change.');
  const title = cleanText(issue.title.replace(/^\[Journey\]\s*/i, ''), 180);
  const slug = slugify(sections['Journey identifier'] || title);
  if (!slug) throw new Error('Give the journey a name.');
  if (slug === 'earlier-walks') throw new Error('The earlier walks page cannot be changed from this form.');
  const pick = (value, map, label) => {
    if (!value || /^Keep current/.test(value)) return '';
    if (!Object.hasOwn(map, value)) throw new Error('Choose the ' + label + ' from the list.');
    return map[value];
  };
  const status = pick(sections['Walk status'], JOURNEY_STATUS, 'walk status');
  const topic = pick(sections.Cause, JOURNEY_TOPIC, 'cause');
  const evidence = sections.Evidence && !/^Keep current/.test(sections.Evidence) ? sections.Evidence : '';
  if (evidence && !JOURNEY_EVIDENCE.includes(evidence)) throw new Error('Choose who reported this from the list.');
  const start = isoDate(sections['Start date'], 'Start date');
  const story = extractPhotographs(sections['What happened']);
  const sourceUrl = httpsLink(sections['Source link'], 'The source link');
  const record = {
    sourceIssue: issue.number, slug, title, status, topic, evidence,
    dateLabel: cleanText(sections.Dates, 80),
    years: start ? start.slice(0, 4) : '',
    sortKey: start ? Number(start.replace(/-/g, '')) : 0,
    route: cleanText(sections.Route, 240),
    distance: cleanText(sections.Distance, 80),
    distanceBasis: cleanText(sections['Distance basis'], 240),
    summary: cleanText(sections.Summary, 600),
    story: paragraphsOf(story.body),
    photos: story.media.map(photo => ({url: photo.url, alt: /^(image|img[_ -]?\d+.*|screenshot.*)$/i.test(photo.alt) ? title : photo.alt, caption: ''})),
    source: sourceUrl ? {label: cleanText(sections['Source name'], 180) || new URL(sourceUrl).hostname.replace(/^www\./, ''), url: sourceUrl, kind: 'Source'} : null,
  };
  if (!knownSlugs.has(slug) && !records.some(r => r.slug === slug && r.sourceIssue !== issue.number)) {
    const missing = [['dates', record.dateLabel], ['summary', record.summary], ['walk status', status], ['cause', topic]].filter(([, value]) => !value).map(([name]) => name);
    if (missing.length) throw new Error('A new journey needs its ' + missing.join(', ') + '.');
  }
  next.push(record);
  return next.sort((a, b) => a.sourceIssue - b.sourceIssue);
}

/** Photographs for the gallery. One form can add several photographs with one caption. */
export function photosFromIssue(issue, records = []) {
  const sections = formSections(issue.body);
  confirm(sections['Photo confirmation'], 'I have permission to publish these photographs on the public website.');
  const next = records.filter(record => record.sourceIssue !== issue.number);
  if (sections.Publication === 'Remove from gallery') return next;
  if (sections.Publication !== 'Show in gallery') throw new Error('Choose Show in gallery or Remove from gallery.');
  const photos = extractPhotographs(sections.Photographs).media;
  if (!photos.length) throw new Error('Attach at least one photograph in the Photographs box.');
  const title = cleanText(issue.title.replace(/^\[Photo\]\s*/i, ''), 180) || 'From the road';
  const caption = cleanText(sections.Caption, 600) || title;
  const alt = cleanText(sections['Photo description'], 600) || caption;
  const journey = journeyFromName(sections.Journey);
  photos.forEach((photo, index) => next.push({
    id: `photo-${issue.number}-${index + 1}`, sourceIssue: issue.number, url: photo.url,
    title: photos.length > 1 ? `${title} (${index + 1})` : title, caption, alt,
    credit: cleanText(sections['Photo credit'], 180), date: cleanText(sections['Date taken'], 40), journey, status: 'published',
  }));
  return next;
}

const MEDIA_TYPES = {
  'News article': {bucket: 'press', kind: 'News report'},
  'Video': {bucket: 'listen', kind: 'Video'},
  'TV interview': {bucket: 'listen', kind: 'TV interview'},
  'Radio or podcast': {bucket: 'listen', kind: 'Audio'},
};
/** A news article, video, TV or radio item for the Media page. */
export function mediaFromIssue(issue, records = []) {
  const sections = formSections(issue.body);
  confirm(sections['Media confirmation'], 'I checked this link and it is about the Walking Rotarian.');
  const next = records.filter(record => record.sourceIssue !== issue.number);
  if (sections.Publication === 'Remove from website') return next;
  if (sections.Publication !== 'Show on website') throw new Error('Choose Show on website or Remove from website.');
  const type = MEDIA_TYPES[sections['Media type']];
  if (!type) throw new Error('Choose the type of media from the list.');
  const url = httpsLink(sections.Link, 'The link');
  if (!url) throw new Error('Paste the link to the article, video or recording.');
  const title = cleanText(issue.title.replace(/^\[Media\]\s*/i, ''), 200);
  const outlet = cleanText(sections.Outlet, 140);
  const date = cleanText(sections['Date published'], 60);
  if (!title || !outlet || !date) throw new Error('Add the headline, who published it and the date.');
  next.push({id: 'media-' + issue.number, sourceIssue: issue.number, ...type, title, outlet, date, url, note: cleanText(sections['Short description'], 600), status: 'published'});
  return next.sort((a, b) => a.sourceIssue - b.sourceIssue);
}

export function progressFromIssue(issue, existing = {checkpoints: [], distances: []}, now = new Date()) {
  const sections = formSections(issue.body);
  confirm(sections['Progress confirmation'], 'I verified this date, location, distance and source for public reporting.');
  const journey = journeyNames[sections.Journey];
  if (!journey) throw new Error('Choose the walk this progress record belongs to.');
  const next = {
    checkpoints: existing.checkpoints.filter(record => record.sourceIssue !== issue.number),
    distances: existing.distances.filter(record => record.sourceIssue !== issue.number),
  };
  if (sections.Publication === 'Withdraw this progress record') return next;
  if (sections.Publication !== 'Publish verified progress') throw new Error('Choose whether to publish or withdraw this record.');
  const date = sections['Walking date'];
  const parsed = new Date(date + 'T00:00:00Z');
  const today = new Intl.DateTimeFormat('en-CA', {timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > today) throw new Error('Use a real walking date, today or earlier, in YYYY-MM-DD format.');
  const source = attachmentURL(sections['Verification source']);
  const place = cleanText(sections['Town or place'], 180);
  if (!place) throw new Error('Add the confirmed town or place.');
  const base = {journey, date, title: place, place, source, status: 'published', verified: true};
  const km = sections['Daily kilometres'];
  const lat = sections.Latitude;
  const lon = sections.Longitude;
  if (!km && !lat && !lon) throw new Error('Add a verified daily distance, map coordinates, or both.');
  if (km) {
    const record = {...validateRecord('distances', {...base, km: km.replace(/,/g, '')}), sourceIssue: issue.number};
    next.distances = next.distances.filter(item => item.id !== record.id);
    next.distances.push(record);
  }
  if (lat || lon) {
    if (!lat || !lon) throw new Error('A map stop needs both latitude and longitude.');
    const record = {...validateRecord('checkpoints', {...base, id: 'checkpoint-' + issue.number, lat, lon}), sourceIssue: issue.number};
    next.checkpoints.push(record);
  }
  next.checkpoints.sort((a, b) => a.date.localeCompare(b.date));
  next.distances.sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

export async function publishIssue({event, repository, token, publishers, fetcher = fetch}) {
  if (!repositoryPattern.test(repository) || !token) throw new Error('The repository publishing connection is missing.');
  const allowed = new Set(publishers.map(user => user.toLowerCase()));
  const permitted = user => typeof user === 'string' && allowed.has(user.toLowerCase());
  if (!permitted(event.sender?.login) || !permitted(event.issue?.user?.login)) return {changed: false, skipped: true};
  const number = event.issue.number;
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid publishing form identifier.');
  const api = 'https://api.github.com/repos/' + repository;
  const headers = {Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'};
  async function request(route, options = {}) {
    const response = await fetcher(api + route, {
      ...options, headers: {...headers, ...(options.body ? {'Content-Type': 'application/json'} : {})},
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      const error = new Error('GitHub could not complete publishing (HTTP ' + response.status + '). Review the form and retry.');
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  // Retrieve the current form, rather than replaying an older queued edit event.
  const issue = await request('/issues/' + number);
  if (issue.pull_request || !permitted(issue.user?.login)) return {changed: false, skipped: true};
  const journal = /^\[Journal\]/i.test(issue.title);
  const product = /^\[Product\]/i.test(issue.title);
  const progress = /^\[Progress\]/i.test(issue.title);
  const settings = /^\[Connections\]/i.test(issue.title);
  const kind = [['current-walk', /^\[Current walk\]/i], ['journey', /^\[Journey\]/i], ['photo', /^\[Photo\]/i], ['media', /^\[Media\]/i]].find(([, pattern]) => pattern.test(issue.title))?.[0];
  if (!journal && !product && !progress && !settings && !kind) return {changed: false, skipped: true};
  if (issue.html_url !== `https://github.com/${repository}/issues/${number}`) throw new Error('Unexpected publishing form address.');
  const contentFiles = {'current-walk': ['src/data/current-walk.json', 'current walk', currentWalkFromIssue], journey: ['src/data/journeys-admin.json', 'journeys', journeyFromIssue], photo: ['src/data/gallery-admin.json', 'gallery', photosFromIssue], media: ['src/data/media-admin.json', 'media links', mediaFromIssue]};
  const filename = kind ? contentFiles[kind][0] : journal ? 'src/data/journal.json' : product ? 'src/data/shop.json' : progress ? 'src/data/progress.json' : 'src/data/settings.json';
  const branch = event.repository?.default_branch || 'main';

  for (let attempt = 0; attempt < 3; attempt++) {
    const file = await request('/contents/' + filename + '?ref=' + encodeURIComponent(branch));
    const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    let result;
    if (kind) result = contentFiles[kind][2](issue, content);
    else if (settings) result = settingsFromIssue(issue, content);
    else if (progress) result = progressFromIssue(issue, content);
    else {
      const records = journal ? content : content.products;
      const id = product ? slugify(formSections(issue.body)['Product identifier']) : 'post-' + number;
      const existing = records.find(record => record.sourceIssue === number) || records.find(record => record.id === id);
      const record = journal ? journalFromIssue(issue, existing) : productFromIssue(issue, existing, content.currency);
      const next = records.filter(item => item.id !== record.id);
      next.push(record);
      if (journal) next.sort((a, b) => a.sourceIssue - b.sourceIssue);
      result = journal ? next : {...content, products: next};
    }
    const text = JSON.stringify(result, null, 2) + '\n';
    const previous = JSON.stringify(content, null, 2) + '\n';
    if (text === previous) return {changed: false, skipped: false};
    try {
      const saved = await request('/contents/' + filename, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Update ${kind ? contentFiles[kind][1] : journal ? 'journal' : product ? 'shop' : progress ? 'walking progress' : 'official links'} from publishing form #${number}`,
          content: Buffer.from(text).toString('base64'), sha: file.sha, branch,
        }),
      });
      return {changed: true, commit: saved.commit.sha, filename};
    } catch (error) {
      if (![409, 422].includes(error.status) || attempt === 2) throw error;
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const config = JSON.parse(fs.readFileSync(new URL('../src/data/publishing.json', import.meta.url), 'utf8'));
  const result = await publishIssue({event, repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN, publishers: config.publishers});
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${result.changed}\ncommit_sha=${result.commit || ''}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.changed
    ? 'The approved form has been saved. The website build and deployment follow in the next job.\n'
    : 'No website change was needed. Publishing is limited to the approved accounts.\n');
  console.log(result.changed ? 'Approved content saved for the website build.' : 'No publishable change.');
}
