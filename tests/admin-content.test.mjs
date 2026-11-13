import test from 'node:test';
import assert from 'node:assert/strict';
import {currentWalkFromIssue, journeyFromIssue, photosFromIssue, mediaFromIssue, publishIssue} from '../tools/publish-issue.mjs';
import {githubFormURL, validateSiteSettings} from '../src/assets/platform/github-model.js';

const sections = values => Object.entries(values).map(([key, value]) => `### ${key}\n\n${value}`).join('\n\n');
const issue = (title, values, number = 40) => ({number, title, body: sections(values), user: {login: 'cartelug'}, html_url: `https://github.com/cartelug/walking-rotarian/issues/${number}`, created_at: '2026-01-01T12:00:00Z', updated_at: '2026-01-02T12:00:00Z'});
const photo = id => `<img width="900" alt="IMG_20${id}" src="https://github.com/user-attachments/assets/0000000${id}-aaaa-bbbb-cccc-dddddddddddd" />`;

test('current walk updates keep blank fields and validate status, journey and dates', () => {
  const base = {name: 'Walk for Education 2026', status: 'Underway', route: 'Nairobi to Kagando'};
  const done = currentWalkFromIssue(issue('[Current walk] Update', {'Walk status': 'Completed', 'Status note': 'The walk finished in Kagando.', 'Walk name': '', 'Current walk confirmation': '- [x] I confirm these details about the current walk are correct for the public website.'}), base);
  assert.equal(done.status, 'Completed');
  assert.equal(done.statusNote, 'The walk finished in Kagando.');
  assert.equal(done.name, base.name);
  assert.equal(done.route, base.route);
  const kept = currentWalkFromIssue(issue('[Current walk] Update', {'Walk status': 'Keep current status', 'Journey page': 'Faith in Motion', 'Current walk confirmation': '- [x] I confirm these details about the current walk are correct for the public website.'}), done);
  assert.equal(kept.status, 'Completed');
  assert.equal(kept.journeySlug, 'faith-in-motion');
  const ok = '- [x] I confirm these details about the current walk are correct for the public website.';
  assert.throws(() => currentWalkFromIssue(issue('[Current walk] x', {'Walk status': 'Finished!', 'Current walk confirmation': ok}), base), /walk status/);
  assert.throws(() => currentWalkFromIssue(issue('[Current walk] x', {'Journey page': 'A walk that does not exist', 'Current walk confirmation': ok}), base), /Journeys page/);
  assert.throws(() => currentWalkFromIssue(issue('[Current walk] x', {'Last verified update': '12/03/2027', 'Current walk confirmation': ok}), base), /YYYY-MM-DD/);
  assert.throws(() => currentWalkFromIssue(issue('[Current walk] x', {'Campaign page': 'javascript:alert(1)', 'Current walk confirmation': ok}), base));
  assert.throws(() => currentWalkFromIssue(issue('[Current walk] x', {'Walk status': 'Completed'}), base), /confirmation/);
});

const journeyOk = {'Journey confirmation': '- [x] I confirm this journey information is accurate and approved for the public website.', Publication: 'Publish'};

test('a new journey needs its essentials, keeps photographs and sources, and can be withdrawn', () => {
  const values = {...journeyOk, 'Journey identifier': '', 'Walk status': 'Planned (not walked yet)', Dates: 'March 2027', 'Start date': '2027-03-01', Route: 'Kampala to Gulu', Cause: 'Peace', Evidence: 'Self-reported', Summary: 'A walk for peace in the north.', 'What happened': `We set off at dawn.\n\n${photo(1)}\n\nThe second day was long.`, 'Source link': 'https://www.facebook.com/example/posts/1'};
  const saved = journeyFromIssue(issue('[Journey] Walk to Gulu', values, 41));
  assert.equal(saved.length, 1);
  const [record] = saved;
  assert.equal(record.slug, 'walk-to-gulu');
  assert.equal(record.status, 'proposed');
  assert.equal(record.topic, 'peace');
  assert.equal(record.sortKey, 20270301);
  assert.deepEqual(record.story, ['We set off at dawn.', 'The second day was long.']);
  assert.equal(record.photos.length, 1);
  assert.equal(record.photos[0].alt, 'Walk to Gulu', 'camera file names are replaced by the journey title');
  assert.equal(record.source.label, 'facebook.com');
  assert.throws(() => journeyFromIssue(issue('[Journey] Half a journey', {...journeyOk, Dates: 'March 2027'}, 42)), /summary, walk status, cause/);
  const withdrawn = journeyFromIssue(issue('[Journey] Walk to Gulu', {...values, Publication: 'Withdraw this change'}, 41), saved);
  assert.equal(withdrawn.length, 0);
});

test('updating an existing journey only needs the changes, and each form replaces only its own record', () => {
  const update = journeyFromIssue(issue('[Journey] Walk for Education', {...journeyOk, 'Journey identifier': 'walk-for-education', 'Walk status': 'Completed', Cause: 'Keep current cause', Evidence: 'Keep current evidence', 'What happened': 'The walk reached Kagando.'}, 43));
  assert.equal(update[0].status, 'completed');
  assert.equal(update[0].topic, '');
  const edited = journeyFromIssue(issue('[Journey] Walk for Education', {...journeyOk, 'Journey identifier': 'walk-for-education', 'Walk status': 'Completed', 'What happened': 'The walk reached Kagando on 20 December.'}, 43), update);
  assert.equal(edited.length, 1);
  assert.deepEqual(edited[0].story, ['The walk reached Kagando on 20 December.']);
  assert.throws(() => journeyFromIssue(issue('[Journey] Earlier walks', {...journeyOk, 'Journey identifier': 'earlier-walks'}, 44)), /earlier walks/);
  assert.throws(() => journeyFromIssue(issue('[Journey] Walk for Education', {...journeyOk, 'Journey identifier': 'walk-for-education', 'Walk status': 'Finished'}, 45)), /walk status/);
});

test('gallery photographs need an attachment and permission, keep one caption, and can be removed', () => {
  const ok = {'Photo confirmation': '- [x] I have permission to publish these photographs on the public website.', Publication: 'Show in gallery'};
  const saved = photosFromIssue(issue('[Photo] Day one', {...ok, Photographs: `${photo(1)}\n${photo(2)}`, Caption: 'Leaving Kampala at dawn.', 'Photo credit': 'Team', Journey: 'Faith in Motion'}, 50));
  assert.equal(saved.length, 2);
  assert.equal(saved[0].id, 'photo-50-1');
  assert.equal(saved[1].title, 'Day one (2)');
  assert.equal(saved[0].alt, 'Leaving Kampala at dawn.');
  assert.equal(saved[0].journey, 'faith-in-motion');
  assert.throws(() => photosFromIssue(issue('[Photo] Empty', {...ok, Photographs: 'No picture here'}, 51)), /at least one photograph/);
  assert.throws(() => photosFromIssue(issue('[Photo] x', {Photographs: photo(3), Publication: 'Show in gallery'}, 52)), /confirmation/);
  assert.equal(photosFromIssue(issue('[Photo] Day one', {...ok, Publication: 'Remove from gallery'}, 50), saved).length, 0);
});

test('media links are sorted into news or recordings and need a safe link', () => {
  const ok = {'Media confirmation': '- [x] I checked this link and it is about the Walking Rotarian.', Publication: 'Show on website', Outlet: 'Nile Post', 'Date published': '12 March 2027'};
  const [news] = mediaFromIssue(issue('[Media] Walker reaches Gulu', {...ok, 'Media type': 'News article', Link: 'https://nilepost.co.ug/news/1'}, 60));
  assert.equal(news.bucket, 'press');
  assert.equal(news.title, 'Walker reaches Gulu');
  const [video] = mediaFromIssue(issue('[Media] Interview', {...ok, 'Media type': 'TV interview', Link: 'https://www.youtube.com/watch?v=x'}, 61));
  assert.equal(video.bucket, 'listen');
  assert.throws(() => mediaFromIssue(issue('[Media] Bad', {...ok, 'Media type': 'News article', Link: 'http://insecure.example/x'}, 62)), /https/);
  assert.throws(() => mediaFromIssue(issue('[Media] No outlet', {...ok, Outlet: '', 'Media type': 'Video', Link: 'https://youtu.be/x'}, 63)), /who published/);
  assert.equal(mediaFromIssue(issue('[Media] Walker reaches Gulu', {...ok, Publication: 'Remove from website'}, 60), [news]).length, 0);
});

test('the publishing workflow saves each new form type to its own file', async () => {
  const files = {'src/data/gallery-admin.json': '[]', 'src/data/media-admin.json': '[]', 'src/data/journeys-admin.json': '[]', 'src/data/current-walk.json': '{}'};
  const forms = {
    70: ['[Photo] Day one', {'Photo confirmation': '- [x] I have permission to publish these photographs on the public website.', Publication: 'Show in gallery', Photographs: photo(1)}, 'src/data/gallery-admin.json'],
    71: ['[Media] Walker reaches Gulu', {'Media confirmation': '- [x] I checked this link and it is about the Walking Rotarian.', Publication: 'Show on website', Outlet: 'Nile Post', 'Date published': '2027', 'Media type': 'News article', Link: 'https://nilepost.co.ug/news/1'}, 'src/data/media-admin.json'],
    72: ['[Current walk] Update', {'Walk status': 'Completed', 'Current walk confirmation': '- [x] I confirm these details about the current walk are correct for the public website.'}, 'src/data/current-walk.json'],
  };
  for (const [number, [title, values, filename]] of Object.entries(forms)) {
    const form = issue(title, values, Number(number));
    let written = null;
    const fetcher = async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path.endsWith('/issues/' + number)) return {ok: true, json: async () => form};
      assert.ok(path.endsWith('/contents/' + filename), 'writes only ' + filename);
      if (options.method === 'PUT') { written = JSON.parse(Buffer.from(JSON.parse(options.body).content, 'base64').toString()); return {ok: true, json: async () => ({commit: {sha: 'abc'}})}; }
      return {ok: true, json: async () => ({sha: 's', content: Buffer.from(files[filename]).toString('base64')})};
    };
    const result = await publishIssue({event: {sender: {login: 'cartelug'}, issue: {number: Number(number), user: {login: 'cartelug'}}, repository: {default_branch: 'main'}}, repository: 'cartelug/walking-rotarian', token: 't', publishers: ['cartelug'], fetcher});
    assert.equal(result.changed, true);
    assert.equal(result.filename, filename);
    assert.ok(written);
  }
});

test('admin links open only the known forms, and new journeys can be the default journal journey', () => {
  for (const template of ['current-walk.yml', 'journey.yml', 'photo.yml', 'media.yml']) assert.match(githubFormURL('https://github.com/cartelug/walking-rotarian', template), new RegExp('template=' + template));
  assert.throws(() => githubFormURL('https://github.com/cartelug/walking-rotarian', 'other.yml'));
  const settings = {email: 'team@example.org', whatsapp: '256757112376', socials: {}};
  assert.equal(validateSiteSettings({...settings, currentJourney: 'walk-to-gulu'}).currentJourney, 'walk-to-gulu');
  assert.throws(() => validateSiteSettings({...settings, currentJourney: '<script>'}));
});
