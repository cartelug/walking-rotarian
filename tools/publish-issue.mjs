import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateRecord, cleanText, slugify, webURL} from '../src/assets/platform/model.js';
import {validateProduct, SHOP_CATEGORIES} from '../src/assets/platform/shop-model.js';

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const journeyNames = {
  'Walk for Education': 'walk-for-education',
  'Faith in Motion': 'faith-in-motion',
  'Nakivale to Makerere peace walk': 'peace-walk-nakivale-makerere',
  'General update': '',
};

export function formSections(body) {
  const sections = {};
  const parts = String(body || '').replace(/\r\n/g, '\n').split(/^### (.+)\s*$/m);
  for (let index = 1; index < parts.length; index += 2) {
    const value = parts[index + 1].trim();
    sections[parts[index].trim()] = value === '_No response_' ? '' : value;
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
  const status = statuses[sections.Availability];
  if (!status) throw new Error('Choose a shop availability from the form.');
  const id = slugify(sections['Product identifier']);
  if (!id) throw new Error('Enter the permanent product identifier.');
  if (existing && existing.sourceIssue === issue.number && existing.id !== id) {
    throw new Error('Keep the product identifier unchanged when editing its original form.');
  }
  const picture = sections['Product photograph'] || '';
  const photos = extractPhotographs(picture);
  const image = photos.media[0]?.url || (picture.trim() ? attachmentURL(picture.trim()) : '');
  const category = Object.entries(SHOP_CATEGORIES).find(([, label]) => label === sections.Category)?.[0];
  const product = validateProduct({
    id, title: issue.title.replace(/^\[Product\]\s*/i, ''), category,
    description: sections.Description,
    status, price: sections['Price in UGX']?.replace(/,/g, '') || null,
    image, illustration: existing?.illustration || (category === 'clothing' ? 'shirt' : 'book'),
    sizes: (sections.Sizes || '').split(','), colours: (sections.Colours || '').split(','),
  }, currency);
  return {...product, sourceIssue: issue.number};
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
  if (!journal && !product) return {changed: false, skipped: true};
  if (issue.html_url !== `https://github.com/${repository}/issues/${number}`) throw new Error('Unexpected publishing form address.');
  const filename = journal ? 'src/data/journal.json' : 'src/data/shop.json';
  const branch = event.repository?.default_branch || 'main';

  for (let attempt = 0; attempt < 3; attempt++) {
    const file = await request('/contents/' + filename + '?ref=' + encodeURIComponent(branch));
    const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    const records = journal ? content : content.products;
    const id = product ? slugify(formSections(issue.body)['Product identifier']) : 'post-' + number;
    const existing = records.find(record => record.sourceIssue === number) || records.find(record => record.id === id);
    const record = journal ? journalFromIssue(issue, existing) : productFromIssue(issue, existing, content.currency);
    const next = records.filter(item => item.id !== record.id);
    next.push(record);
    if (journal) next.sort((a, b) => a.sourceIssue - b.sourceIssue);
    const result = journal ? next : {...content, products: next};
    const text = JSON.stringify(result, null, 2) + '\n';
    const previous = JSON.stringify(content, null, 2) + '\n';
    if (text === previous) return {changed: false, skipped: false};
    try {
      const saved = await request('/contents/' + filename, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Update ${journal ? 'journal' : 'shop'} from publishing form #${number}`,
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
