import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRegister, validateRegister, auditBuiltPages} from '../src/lib/image-register.mjs';
import {imageSize, matchFile, planIngest, applyIngest} from '../tools/ingest-drive.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/img/manifest.json'), 'utf8'));
const states = {planned: '', candidate: '', ingested: '', ready: '', live: '', retired: '', excluded: ''};
const reg = (...images) => ({states, images});
const row = (extra) => ({id: 'x', class: 'documentary', status: 'live', permission: 'approved', derivativesOnly: true, ...extra});
const problems = (r) => validateRegister(reg(r), {root, manifest: {x: {}}});

const png = (w, h) => { const b = Buffer.alloc(40); b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b; };
const jpeg = (w, h) => { const b = Buffer.alloc(40); b[0] = 0xff; b[1] = 0xd8; b[2] = 0xff; b[3] = 0xc0; b.writeUInt16BE(17, 4); b[6] = 8; b.writeUInt16BE(h, 7); b.writeUInt16BE(w, 9); return b; };

test('the real register follows its rules and covers every content picture on the site', () => {
  const r = loadRegister();
  assert.deepEqual(validateRegister(r, {root, manifest}), []);
  const live = new Set(r.images.filter(i => i.status === 'live').map(i => i.id));
  for (const id of Object.keys(manifest)) if (!/^(logo|bg-|favicon|icon|share)/.test(id)) assert.ok(live.has(id), `${id} is on the site but not in the register`);
});

test('the register records the owner decisions and keeps the unsafe items out', () => {
  const r = loadRegister(), by = id => r.images.find(i => i.id === id);
  assert.equal(by('walking-front').caption.rule.startsWith('No date'), true);
  assert.equal(by('launch-group-9').status, 'excluded');
  assert.equal(by('archive-44-announcing-the-education-journey').claim.stageApproved, false);
  assert.equal(r.images.filter(i => i.class === 'generated-person' && i.status === 'planned').length, 25);
  assert.ok(r.images.filter(i => i.class === 'news-linkonly').every(i => !i.file));
});

test('rules: permission, children, news copies, stage claims and checksums', () => {
  assert.match(problems(row({permission: 'pending', status: 'ready'}))[0], /not approved/);
  assert.match(problems(row({people: {children: true}}))[0], /children/);
  assert.match(problems(row({class: 'news-linkonly', file: 'a.jpg'})).join(), /never copied/);
  assert.match(problems(row({claim: {journeyStatus: 'underway', stageApproved: false}})).join(), /not approved/);
  assert.deepEqual(problems(row({claim: {journeyStatus: 'underway', stageApproved: true}})), []);
  assert.match(problems(row({class: 'own-post'})).join(), /public source URL/);
  assert.match(problems(row({file: 'src/img-original/does-not-exist.jpg', derivativesOnly: false})).join(), /file missing/);
  assert.match(problems(row({status: 'bogus'}))[0], /unknown status/);
});

test('rules: AI images need a label, a passed gate, recorded branding removal and no journey page', () => {
  const ai = {class: 'generated-person', label: {text: 'Mbanda Shyaka, AI-generated image'}, generation: {gate: 'passed'}, branding: {removed: true}};
  assert.deepEqual(problems(row(ai)), []);
  assert.match(problems(row({...ai, label: {text: 'Photograph'}})).join(), /AI-generated/);
  assert.match(problems(row({...ai, generation: {gate: 'pending'}})).join(), /before it passed/);
  assert.match(problems(row({...ai, branding: {removed: null}})).join(), /Rotary and club marks/);
  assert.match(problems(row({...ai, placements: ['/journeys/walk-for-education/']})).join(), /journey page/);
  assert.deepEqual(problems(row({...ai, placements: ['/gallery/', '/journeys/']})), []);
});

test('image sizes are read from PNG and JPEG headers', () => {
  assert.deepEqual(imageSize(png(1536, 1024)), {w: 1536, h: 1024});
  assert.deepEqual(imageSize(jpeg(640, 1136)), {w: 640, h: 1136});
  assert.equal(imageSize(Buffer.from('not an image')), null);
});

test('ingest matches by archive number, name and picture id, and respects permission and exclusions', () => {
  const r = {images: [
    {id: 'a29', status: 'candidate', permission: 'approved', class: 'own-post', match: {archiveNo: '29'}},
    {id: 'walking-front', status: 'candidate', permission: 'approved', class: 'documentary', match: {name: '22-23.jpg.jpeg'}},
    {id: 'road-bootlace', status: 'planned', permission: 'approved', class: 'generated-person', match: {stem: 'road-bootlace'}, generation: {gate: 'pending'}},
    {id: 'pending-one', status: 'candidate', permission: 'pending', class: 'documentary', match: {name: '20230308_132430.jpg'}},
    {id: 'group', status: 'excluded', permission: 'excluded', class: 'documentary', match: {name: '22-9.jpg.jpeg'}, note: 'crowd'},
  ]};
  assert.equal(matchFile(r, '/x/29_akright_city.jpeg', 'h').by, 'archive number');
  assert.equal(matchFile(r, '/x/22-23.jpg.jpeg', 'h').row.id, 'walking-front');
  assert.equal(matchFile(r, '/x/Road_Bootlace.png', 'h').by, 'picture id');
  assert.equal(matchFile(r, '/x/unknown.jpg', 'h'), null);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-ingest-')), out = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-root-'));
  try {
    const put = (n, buf) => { const f = path.join(dir, n); fs.writeFileSync(f, buf); return f; };
    const files = [put('29_x.jpeg', jpeg(640, 1136)), put('22-23.jpg.jpeg', jpeg(1500, 2000)), put('road-bootlace.png', png(1024, 1536)),
      put('20230308_132430.jpg', jpeg(10, 10)), put('22-9.jpg.jpeg', jpeg(10, 10)), put('stranger.jpg', jpeg(10, 10))];
    const plan = planIngest(r, files, {root: out});
    assert.deepEqual(plan.map(p => p.action), ['copy', 'copy', 'copy', 'skip', 'skip', 'skip']);
    assert.match(plan[3].why, /permission/); assert.match(plan[4].why, /excluded/); assert.match(plan[5].why, /no matching row/);
    applyIngest(r, plan, {root: out});
    assert.equal(r.images[0].status, 'ingested'); assert.equal(r.images[0].height, 1136);
    assert.equal(r.images[2].generation.gate, 'pending'); assert.equal(r.images[2].file, 'src/img-original/road-bootlace.png');
    assert.ok(fs.existsSync(path.join(out, 'src/img-original/a29.jpg')));
    const again = planIngest(r, files.slice(0, 1), {root: out});
    assert.equal(again[0].action, 'skip'); assert.match(again[0].why, /already ingested/);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); fs.rmSync(out, {recursive: true, force: true}); }
});

test('a built page that shows AI artwork must say AI-generated', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-dist-'));
  try {
    const r = reg({id: 'campaign-hero', class: 'generated-person', status: 'live'});
    fs.writeFileSync(path.join(dist, 'index.html'), '<img src="a/assets/img/campaign-hero-960.webp"><p>Artwork</p>');
    assert.match(auditBuiltPages(dist, r)[0], /never says "AI-generated"/);
    fs.writeFileSync(path.join(dist, 'index.html'), '<img src="a/assets/img/campaign-hero-960.webp"><p>AI-generated campaign artwork</p>');
    assert.deepEqual(auditBuiltPages(dist, r), []);
    fs.writeFileSync(path.join(dist, 'plain.html'), '<p>No pictures here</p>');
    assert.deepEqual(auditBuiltPages(dist, r), []);
  } finally { fs.rmSync(dist, {recursive: true, force: true}); }
});
