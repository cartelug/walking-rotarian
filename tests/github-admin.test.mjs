import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateSiteSettings, githubFormURL} from '../src/assets/platform/github-model.js';
import {distanceTotal, visibleEntries} from '../src/assets/platform/model.js';
import {settingsFromIssue, progressFromIssue, journalFromIssue, productFromIssue, publishIssue, formSections} from '../tools/publish-issue.mjs';

const sections = values => Object.entries(values).map(([key, value]) => `### ${key}\n\n${value}`).join('\n\n');
const issue = (title, values, number = 30) => ({number, title, body: sections(values), user: {login: 'cartelug'}, html_url: `https://github.com/cartelug/walking-rotarian/issues/${number}`, created_at: '2026-01-01T12:00:00Z', updated_at: '2026-01-02T12:00:00Z'});
const settings = {email: 'team@example.org', whatsapp: '256757112376', currentJourney: 'walk-for-education', socials: {facebook: '', linkedin: 'https://www.linkedin.com/in/example/'}};
const connections = {'Facebook account': 'https://www.facebook.com/example', 'Contact email': '', 'Connection confirmation': '- [x] I checked these public contact details and official account links.'};
const progress = {Journey: 'Walk for Education', 'Walking date': '2026-01-01', 'Town or place': 'A verified town', 'Daily kilometres': '12.5', Latitude: '0.42', Longitude: '32.58', 'Verification source': 'https://example.org/approved-log', Publication: 'Publish verified progress', 'Progress confirmation': '- [x] I verified this date, location, distance and source for public reporting.'};

test('admin handoff preserves text and journey selection without credentials or URL truncation', () => {
  const text = 'Walking together & learning.\n\nA story with # headings and a question?';
  const link = new URL(githubFormURL('https://github.com/cartelug/walking-rotarian', 'journal.yml', {story: text, journey: 'Faith in Motion', title: '[Journal] A day together'}));
  assert.equal(link.searchParams.get('story'), text);
  assert.equal(link.searchParams.get('journey'), 'Faith in Motion');
  assert.equal(link.searchParams.get('title'), '[Journal] A day together');
  assert.equal(link.searchParams.has('token'), false);
  assert.throws(() => githubFormURL('https://evil.invalid/repo', 'journal.yml'));
  assert.throws(() => githubFormURL('https://github.com/cartelug/walking-rotarian', 'journal.yml', {story: 'x'.repeat(9000)}), /too long/);
});

test('official account updates preserve blanks, allow explicit removal, and reject unsafe or mismatched account links', () => {
  const updated = settingsFromIssue(issue('[Connections] Accounts', connections), settings);
  assert.equal(updated.email, settings.email);
  assert.equal(updated.socials.linkedin, settings.socials.linkedin);
  assert.equal(updated.socials.facebook, connections['Facebook account']);
  const removed = settingsFromIssue(issue('[Connections] Accounts', {...connections, 'Facebook account': 'REMOVE'}), updated);
  assert.equal(removed.socials.facebook, '');
  assert.throws(() => settingsFromIssue(issue('[Connections] Accounts', {...connections, 'Facebook account': 'https://facebook.com.evil.invalid/user'}), settings));
  assert.throws(() => settingsFromIssue(issue('[Connections] Accounts', {...connections, 'Facebook account': 'javascript:alert(1)'}), settings));
  assert.throws(() => settingsFromIssue(issue('[Connections] Accounts', {...connections, 'Connection confirmation': ''}), settings));
  assert.throws(() => validateSiteSettings({...settings, whatsapp: 'wrong'}));
});

test('walking corrections and duplicate dates update the daily total once and withdrawals remove only their own records', () => {
  const first = progressFromIssue(issue('[Progress] Town', progress), undefined, new Date('2026-02-01'));
  assert.equal(first.checkpoints.length, 1);
  assert.equal(distanceTotal(first.distances, 'walk-for-education'), 12.5);
  const corrected = progressFromIssue(issue('[Progress] Town', {...progress, 'Daily kilometres': '15'}), first, new Date('2026-02-01'));
  assert.equal(corrected.checkpoints.length, 1);
  assert.equal(distanceTotal(corrected.distances, 'walk-for-education'), 15);
  const replacement = progressFromIssue(issue('[Progress] Same day', {...progress, 'Daily kilometres': '16'}, 31), corrected, new Date('2026-02-01'));
  assert.equal(distanceTotal(replacement.distances, 'walk-for-education'), 16);
  const withdrawOld = progressFromIssue(issue('[Progress] Town', {...progress, Publication: 'Withdraw this progress record'}), replacement);
  assert.equal(distanceTotal(withdrawOld.distances, 'walk-for-education'), 16);
  assert.equal(withdrawOld.checkpoints.length, 1);
  const withdrawn = progressFromIssue(issue('[Progress] Same day', {...progress, Publication: 'Withdraw this progress record'}, 31), withdrawOld);
  assert.equal(withdrawn.checkpoints.length, 0);
  assert.equal(withdrawn.distances.length, 0);
});

test('walking records reject invented dates, incomplete map points, unverified input and invalid distances', () => {
  const bad = changes => () => progressFromIssue(issue('[Progress] Town', {...progress, ...changes}), undefined, new Date('2026-02-01'));
  assert.throws(bad({'Walking date': '2026-02-30'}));
  assert.throws(bad({'Walking date': '2026-03-01'}));
  assert.throws(bad({Latitude: '', Longitude: '32.58'}));
  assert.throws(bad({'Daily kilometres': 'Infinity'}));
  assert.throws(bad({'Daily kilometres': '251'}));
  assert.throws(bad({'Verification source': 'http://example.org/log'}));
  assert.throws(bad({'Progress confirmation': '- [ ] I verified this date, location, distance and source for public reporting.'}));
});

test('GitHub-only journal supports Facebook source links and product updates keep existing category and availability', () => {
  const entry = journalFromIssue(issue('[Journal] A story', {Story: 'Our own words.', Journey: 'Faith in Motion', Author: 'Walking Rotarian team', Publication: 'Publish now', 'Facebook post URL': 'https://www.facebook.com/example/posts/12', 'Publishing confirmation': '- [x] I approve this content and its photographs for the public website.'}));
  assert.equal(entry.journey, 'faith-in-motion');
  assert.equal(entry.facebookUrl, 'https://www.facebook.com/example/posts/12');
  assert.equal(visibleEntries([entry]).length, 1);
  const old = {id: 'cap', category: 'accessories', status: 'available', price: 25000, image:'https://example.org/real-cap.jpg'};
  const product = productFromIssue(issue('[Product] Cap', {'Product identifier': 'cap', Category: 'Keep current category', Description: 'A walking cap.', Availability: 'Keep current availability', 'Price in UGX': '25000', 'Product confirmation': '- [x] I confirm the product details, availability and any stated price for the public shop.'}), old);
  assert.equal(product.category, 'accessories');
  assert.equal(product.status, 'available');
  assert.equal(product.image, old.image);
});

test('story subheadings stay in the story and duplicate form headings fail explicitly', () => {
  const body = sections({Story:'The road today.\n\n### A moment to remember\n\nWe shared a meal.', Journey:'Walk for Education'});
  assert.match(formSections(body).Story, /### A moment to remember\n\nWe shared a meal\./);
  assert.throws(() => formSections(body + '\n\n### Journey\n\nFaith in Motion'), /repeated/);
});

test('new admin form types require both an approved sender and approved original author and write only their fixed data file', async () => {
  for (const [title, values, content, filename] of [
    ['[Connections] Accounts', connections, settings, 'src/data/settings.json'],
    ['[Progress] Town', progress, {checkpoints: [], distances: []}, 'src/data/progress.json'],
  ]) {
    const form = issue(title, values);
    const event = {sender: {login: 'cartelug'}, issue: form, repository: {default_branch: 'main'}};
    const options = {event, repository: 'cartelug/walking-rotarian', token: 'test-only', publishers: ['cartelug']};
    assert.equal((await publishIssue({...options, event: {...event, issue: {...form, user: {login: 'stranger'}}}, fetcher: () => {throw new Error('Must not fetch');}})).skipped, true);
    const result = await publishIssue({...options, fetcher: async (url, request) => {
      if (url.endsWith('/issues/30')) return Response.json(form);
      assert.ok(url.includes('/contents/' + filename));
      if (request.method !== 'PUT') return Response.json({sha: 'fresh-sha', content: Buffer.from(JSON.stringify(content)).toString('base64')});
      const update = JSON.parse(request.body);
      assert.equal(update.sha, 'fresh-sha');
      assert.equal(update.branch, 'main');
      return Response.json({commit: {sha: 'saved'}});
    }});
    assert.equal(result.filename, filename);
    assert.equal(result.commit, 'saved');
  }
});

test('the public admin is a noindex route and does not introduce a shared password or repository token', async () => {
  const admin = await readFile(new URL('../src/assets/platform/github-admin.js', import.meta.url), 'utf8');
  const pages = await readFile(new URL('../src/pages/platform.mjs', import.meta.url), 'utf8');
  assert.match(pages, /adminPage\('\/admin\/'\)/);
  assert.match(pages, /noindex:true/);
  assert.doesNotMatch(admin, /Authorization\s*:|access_token\s*:|type="password"/i);
});
