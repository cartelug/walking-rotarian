import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateProduct, sanitiseCart, cartSummary, quoteMessage, whatsappQuote} from '../src/assets/platform/shop-model.js';
import {journalFromIssue, productFromIssue, publishIssue} from '../tools/publish-issue.mjs';
import {visibleEntries} from '../src/assets/platform/model.js';

const shirt = validateProduct({id: 'shirt', title: 'Walking shirt', category: 'clothing', status: 'available', price: 25000, sizes: ['M', 'L']});
const book = validateProduct({id: 'book', title: 'Journey book', category: 'books', status: 'enquiry'});
const products = [shirt, book];
const sections = values => Object.entries(values).map(([key, value]) => `### ${key}\n\n${value}`).join('\n\n');
const journalFields = {
  Story: 'Today we walked together.\n\n![The group](https://github.com/user-attachments/assets/example-photo)',
  Journey: 'Walk for Education', Place: 'Nakuru', Author: 'Walking Rotarian team', Publication: 'Publish now',
  'Publishing confirmation': '- [X] I approve this content and its photographs for the public website.',
};
const issue = (body = sections(journalFields)) => ({number: 12, title: '[Journal] An evening on the road', body, created_at: '2026-01-01T12:00:00Z', updated_at: '2026-01-02T12:00:00Z', html_url: 'https://github.com/cartelug/walking-rotarian/issues/12', user: {login: 'cartelug'}});

test('shop quantities, stale options and price rules preserve accurate quote totals', () => {
  assert.throws(() => validateProduct({...shirt, price: -1}));
  assert.throws(() => validateProduct({...shirt, price: 25000.5}));
  assert.throws(() => validateProduct({...shirt, price: null}));
  assert.throws(() => validateProduct({...shirt, image: 'javascript:alert(1)'}));
  const lines = [
    {productId: 'shirt', size: 'M', quantity: 2}, {productId: 'shirt', size: 'M', quantity: 1},
    {productId: 'shirt', size: 'XL', quantity: 1}, {productId: 'book', quantity: 3},
    {productId: 'book', quantity: -1}, {productId: 'book', quantity: 1.5}, {productId: 'missing', quantity: 1},
  ];
  const summary = cartSummary(lines, products);
  assert.equal(summary.quantity, 6);
  assert.equal(summary.subtotal, 75000);
  assert.equal(summary.quoteCount, 3);
  assert.equal(summary.cart.length, 2);
  assert.equal(sanitiseCart(lines, [validateProduct({...shirt, status: 'sold-out'}), book]).length, 1);
});

test('WhatsApp enquiries preserve selections and special characters without inventing an unpriced total', () => {
  const text = quoteMessage([{productId: 'shirt', size: 'L', quantity: 2}, {productId: 'book', quantity: 1}], products, {
    note: 'Club & family order — call after 5', delivery: 'Pickup preferred', page: 'https://cartelug.github.io/walking-rotarian/shop/',
  });
  assert.match(text, /Walking shirt × 2 \(size L\) — UGX 50,000/);
  assert.match(text, /Journey book × 1 — quote requested/);
  assert.match(text, /Priced items subtotal: UGX 50,000/);
  const link = new URL(whatsappQuote('256757112376', text));
  assert.equal(link.searchParams.get('text'), text);
  assert.throws(() => whatsappQuote('invalid', text));
  assert.throws(() => quoteMessage([], products));
});

test('journal forms handle photographs, corrections, draft visibility and withdrawal', () => {
  const published = journalFromIssue(issue());
  assert.equal(published.id, 'post-12');
  assert.equal(published.media.length, 1);
  assert.equal(published.body, 'Today we walked together.');
  const edited = journalFromIssue({...issue(), created_at: '2026-02-02T12:00:00Z'}, published);
  assert.equal(edited.publishedAt, published.publishedAt);
  const draft = journalFromIssue(issue(sections({...journalFields, Publication: 'Draft - keep off website'})));
  const publishedDraft = journalFromIssue({...issue(), updated_at: '2026-01-05T12:00:00Z'}, draft);
  assert.equal(publishedDraft.publishedAt, '2026-01-05T12:00:00Z');
  const withdrawn = journalFromIssue(issue(sections({...journalFields, Publication: 'Withdraw from website'})));
  assert.equal(visibleEntries([draft, withdrawn]).length, 0);
  assert.throws(() => journalFromIssue(issue(sections({...journalFields, 'Publishing confirmation': '- [ ] I approve this content and its photographs for the public website.'}))));
  assert.throws(() => journalFromIssue(issue(sections({...journalFields, Story: '![x](http://unsafe.invalid/photo)'}))));
});

test('product forms require confirmed prices for available items and preserve permanent identifiers', () => {
  const values = {
    'Product identifier': 'shirt', Category: 'Clothing', Description: 'A confirmed shirt.', 'Price in UGX': '25,000',
    Availability: 'Available - confirmed price and stock', 'Product photograph': '_No response_', Sizes: 'M, L', Colours: 'Navy, White',
    'Product confirmation': '- [x] I confirm the product details, availability and any stated price for the public shop.',
  };
  const form = updates => ({...issue(sections({...values, ...updates})), title: '[Product] Walking shirt'});
  const product = productFromIssue(form());
  assert.equal(product.price, 25000);
  assert.deepEqual(product.sizes, ['M', 'L']);
  assert.equal(productFromIssue(form({Availability: 'Hidden'})).status, 'hidden');
  assert.throws(() => productFromIssue(form({'Price in UGX': ''})));
  assert.throws(() => productFromIssue(form({'Product identifier': 'renamed'}), product));
});

test('publishing rejects unapproved actors and retries conflicts using the latest form and catalogue', async () => {
  let calls = 0;
  const event = {sender: {login: 'cartelug'}, issue: issue(), repository: {default_branch: 'main'}};
  const options = {event, repository: 'cartelug/walking-rotarian', token: 'test-only', publishers: ['cartelug']};
  const skipped = await publishIssue({...options, event: {...event, sender: {login: 'stranger'}}, fetcher: () => {throw new Error('Must not fetch');}});
  assert.equal(skipped.skipped, true);
  let writes = 0;
  const existing = {id: 'post-9', sourceIssue: 9};
  const newer = {id: 'post-10', sourceIssue: 10};
  const result = await publishIssue({...options, fetcher: async (url, request) => {
    calls++;
    if (url.endsWith('/issues/12')) return Response.json(issue(sections({...journalFields, Story: 'The latest edited story.'})));
    if (request.method !== 'PUT') return Response.json({sha: writes ? 'fresh' : 'stale', content: Buffer.from(JSON.stringify(writes ? [existing, newer] : [existing])).toString('base64')});
    writes++;
    if (writes === 1) return Response.json({message: 'Concurrent edit'}, {status: 409});
    const update = JSON.parse(request.body);
    const records = JSON.parse(Buffer.from(update.content, 'base64').toString('utf8'));
    assert.equal(update.sha, 'fresh');
    assert.equal(records.length, 3);
    assert.equal(records.find(record => record.id === 'post-12').body, 'The latest edited story.');
    return Response.json({commit: {sha: 'saved-commit'}});
  }});
  assert.equal(result.commit, 'saved-commit');
  assert.equal(calls, 5);
  const noChange = await publishIssue({...options, fetcher: async url => url.endsWith('/issues/12') ? Response.json(issue()) : Response.json({sha: 'same', content: Buffer.from(JSON.stringify([journalFromIssue(issue())])).toString('base64')})});
  assert.equal(noChange.changed, false);
});

test('the catalogue validates and publishing does not interpolate submitted text into shell commands', async () => {
  const data = JSON.parse(await readFile(new URL('../src/data/shop.json', import.meta.url), 'utf8'));
  assert.ok(data.products.length > 0);
  for (const product of data.products) validateProduct(product, data.currency);
  assert.equal(new Set(data.products.map(p => p.id)).size, data.products.length);
  const source = await readFile(new URL('../.github/workflows/publish-content.yml', import.meta.url), 'utf8');
  assert.match(source, /uses: \.\/\.github\/workflows\/pages.yml/);
  assert.doesNotMatch(source, /\$\{\{\s*github.event.issue.body/);
});
