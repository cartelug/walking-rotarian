import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateRecord, cleanText, slugify, webURL} from '../src/assets/platform/model.js';
import {validateProduct, SHOP_CATEGORIES} from '../src/assets/platform/shop-model.js';
import {JOURNEY_NAMES, SOCIAL_HOSTS, validateSiteSettings} from '../src/assets/platform/github-model.js';

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const journeyNames = JOURNEY_NAMES;

export function formSections(body) {
  const sections = {};
  const labels = new Set(['Story','Journey','Place','Author','Facebook post URL','Publication','Publishing confirmation','Product identifier','Category','Description','Price in UGX','Availability','Product photograph','Sizes','Colours','Product confirmation','Contact email','WhatsApp number','Facebook account','Instagram account','Tiktok account','Linkedin account','Youtube account','X account','Default journal journey','Connection confirmation','Walking date','Town or place','Daily kilometres','Latitude','Longitude','Verification source','Progress confirmation']);
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
    status, price: sections['Price in UGX']?.replace(/,/g, '') || null,
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
  if (!journal && !product && !progress && !settings) return {changed: false, skipped: true};
  if (issue.html_url !== `https://github.com/${repository}/issues/${number}`) throw new Error('Unexpected publishing form address.');
  const filename = journal ? 'src/data/journal.json' : product ? 'src/data/shop.json' : progress ? 'src/data/progress.json' : 'src/data/settings.json';
  const branch = event.repository?.default_branch || 'main';

  for (let attempt = 0; attempt < 3; attempt++) {
    const file = await request('/contents/' + filename + '?ref=' + encodeURIComponent(branch));
    const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    let result;
    if (settings) result = settingsFromIssue(issue, content);
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
          message: `Update ${journal ? 'journal' : product ? 'shop' : progress ? 'walking progress' : 'official links'} from publishing form #${number}`,
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
