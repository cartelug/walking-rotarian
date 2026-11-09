import {h, readLocal, writeLocal, paragraphs, dateLabel} from './client.js';
import {githubFormURL, JOURNEY_NAMES} from './github-model.js';
import {SHOP_CATEGORIES, money} from './shop-model.js';

const iconOut = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5 15 15 5M5 5h10v10"/></svg>';
const iconRight = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 10h13m-5-5 5 5-5 5"/></svg>';
const external = (url, label, primary = false) => `<a class="wr-action${primary ? ' wr-action--primary' : ''}" href="${h(url)}" target="_blank" rel="noopener noreferrer">${label}${iconOut}</a>`;
const input = (name, label, value = '', extra = '') => `<div class="wr-field"><label for="admin-${name}">${label}</label><input id="admin-${name}" name="${name}" value="${h(value)}" ${extra}></div>`;
const today = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());

export async function renderGitHubAdmin(root, ctx) {
  const repository = ctx.data.settings.publishing.repository;
  const form = (template, values) => githubFormURL(repository, template, values);
  let products = [];
  let shopError = '';
  try {
    const response = await fetch(ctx.href('/data/admin-shop.json'), {cache: 'no-cache'});
    if (!response.ok) throw new Error('The product list could not be loaded.');
    products = (await response.json()).products;
  } catch { shopError = 'The product list is temporarily unavailable. You can still open the shop form.'; }
  const entries = ctx.data.entries.filter(entry => entry.sources?.some(source => source.url.startsWith(repository + '/issues/')));
  const tabs = [['home', 'Overview'], ['write', 'Write an update'], ['shop', 'Shop'], ['progress', 'Walking progress'], ['connections', 'Official links'], ['help', 'How it works']];
  root.innerHTML = `<div class="wr-admin">
    <div class="wr-admin-welcome"><div><p class="eyebrow">Your publishing desk</p><h2>A story only you can tell.</h2><p>Share a moment from the road. Keep the shop and journey up to date.</p></div><div class="wr-admin-github"><span class="wr-badge">GitHub publishing</span><p>Sign in on GitHub to confirm changes.</p></div></div>
    <nav class="wr-admin-nav" aria-label="Admin sections">${tabs.map(([id, label]) => `<button class="wr-tab" type="button" data-admin-view="${id}" aria-pressed="false">${label}</button>`).join('')}</nav>
    <div data-admin-panel></div>
    <p class="wr-admin-footnote">Only approved GitHub accounts can change the website. Form submissions and attachments are public, including GitHub drafts. Keep private notes on your device.</p>
  </div>`;
  const panel = root.querySelector('[data-admin-panel]');
  const issueLink = number => repository + '/issues/' + Number(number);
  const allIssues = prefix => repository + '/issues?q=' + encodeURIComponent('is:issue "[' + prefix + ']"');
  const progressLink = form('progress.yml', {title: '[Progress] ' + today(), 'walking-date': today()});

  function home() {
    panel.innerHTML = `<div class="wr-admin-layout"><section class="wr-admin-feature"><p class="eyebrow">From your phone. From the road.</p><h3>What happened on the walk today?</h3><p>A few words, a photograph, a person you met. Every small moment is part of the journey.</p><button class="wr-action wr-action--primary" data-go="write" type="button">Write an update ${iconRight}</button><p class="wr-muted">Write here, review on GitHub, then publish.</p></section><section class="wr-panel wr-admin-status"><p class="eyebrow">Your website</p><h3>One place to keep it moving.</h3><dl class="wr-admin-counts"><div><dt>Published updates</dt><dd>${entries.length}</dd></div><div><dt>Shop items</dt><dd>${products.length}</dd></div><div><dt>Verified walking days</dt><dd>${ctx.data.distances.length}</dd></div></dl><div class="wr-actions"><a class="wr-action" href="${ctx.href('/live/')}">View live journal</a><a class="wr-action" href="${ctx.href('/shop/')}">View shop</a></div></section></div>
      <div class="wr-admin-cards"><button type="button" data-go="shop"><span class="wr-admin-number">01</span><h3>Look after the shop</h3><p>Photographs, prices, sizes and availability.</p><span>Manage products ${iconRight}</span></button><button type="button" data-go="progress"><span class="wr-admin-number">02</span><h3>Mark the journey</h3><p>Confirmed distances and places along the way.</p><span>Update progress ${iconRight}</span></button><button type="button" data-go="connections"><span class="wr-admin-number">03</span><h3>Keep people connected</h3><p>Facebook, social accounts and team contacts.</p><span>Update official links ${iconRight}</span></button></div>
      <section class="wr-panel wr-admin-build"><div><h3>Has your latest change appeared?</h3><p>GitHub saves the approved form, checks the website and publishes a new build.</p></div><div class="wr-actions"><button class="wr-action" type="button" data-build-status>Check latest build</button>${external(repository + '/actions', 'Publishing history')}</div><p data-build-result role="status"></p></section>`;
    panel.querySelector('[data-build-status]').onclick = async event => {
      const button = event.currentTarget, result = panel.querySelector('[data-build-result]');
      button.disabled = true;
      result.textContent = 'Checking GitHub…';
      try {
        const path = new URL(repository).pathname;
        const response = await fetch('https://api.github.com/repos' + path + '/actions/workflows/pages.yml/runs?per_page=1', {headers: {Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(12000)});
        if (!response.ok) throw new Error('Open Publishing history to see the latest build.');
        const run = (await response.json()).workflow_runs?.[0];
        if (!run) throw new Error('No website build has been recorded yet.');
        const labels = {success: 'Published successfully', failure: 'Build needs attention', cancelled: 'Build cancelled', skipped: 'Build skipped', timed_out: 'Build timed out'};
        result.textContent = (labels[run.conclusion] || (run.status === 'completed' ? 'Build completed: ' + run.conclusion : 'Build ' + run.status.replaceAll('_', ' '))) + ' · ' + dateLabel(run.updated_at) + '. This is the latest website build; your form must be submitted before it can be included.';
      } catch (error) { result.textContent = error.message; }
      finally { button.disabled = false; }
    };
  }

  function write() {
    const key = 'wr.github-draft.v1';
    const stored = readLocal(key, {});
    const draft = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    const journey = draft.journey || Object.entries(JOURNEY_NAMES).find(([, id]) => id === ctx.data.settings.currentJourney)?.[0] || 'Walk for Education';
    panel.innerHTML = `<div class="wr-admin-layout"><section class="wr-panel"><p class="eyebrow">A moment from the road</p><h3>Write your update</h3><form class="wr-form" data-quick-post>
      ${input('title', 'Headline', draft.title, 'maxlength="180" placeholder="A moment to remember"')}
      <div class="wr-field"><label for="admin-story">Your story</label><textarea id="admin-story" name="story" rows="9" maxlength="60000" required placeholder="Tell the story, or use the microphone on your phone keyboard.">${h(draft.story || '')}</textarea></div>
      <div class="wr-form-grid"><div class="wr-field"><label for="admin-journey">Journey</label><select id="admin-journey" name="journey">${Object.keys(JOURNEY_NAMES).map(name => `<option${name === journey ? ' selected' : ''}>${h(name)}</option>`).join('')}</select></div>${input('place', 'Town or place, optional', draft.place, 'maxlength="180"')}${input('author', 'Published by', draft.author || 'Walking Rotarian team', 'maxlength="140" required')}${input('facebook-url', 'Original Facebook post, optional', draft['facebook-url'], 'type="url" placeholder="https://www.facebook.com/…"')}</div>
      <p class="wr-notice">Add photographs on the next screen using GitHub’s attachment button. Choose <strong>Publish now</strong>, approve the content and select <strong>Create</strong> to submit.</p>
      <div class="wr-actions"><button class="wr-action wr-action--primary" type="submit">Review on GitHub ${iconOut}</button><button class="wr-action" type="button" data-copy-story>Copy story</button><button class="wr-action" type="button" data-clear-draft>Clear device draft</button></div><p data-draft-feedback role="status">${draft.story ? 'Your device draft has been restored.' : 'Draft text stays on this device until you clear it.'}</p><p>${external(form('journal.yml'), 'Open full publishing form')}</p>
      </form></section><aside class="wr-admin-side"><section class="wr-panel"><p class="eyebrow">Reading preview</p><div data-writing-preview></div></section><section class="wr-panel"><h3>Correct an earlier story</h3><p>Open its original submission on GitHub and edit it. Choose <strong>Withdraw from website</strong> to take it off the website.</p>${external(allIssues('Journal'), 'All earlier updates')}${entries.length ? `<ul class="wr-admin-records">${entries.slice(0, 5).map(entry => `<li>${external(entry.sources.find(source => source.url.startsWith(repository + '/issues/')).url, h(entry.title))}</li>`).join('')}</ul>` : ''}</section></aside></div>`;
    const post = panel.querySelector('[data-quick-post]');
    const values = () => Object.fromEntries(new FormData(post));
    const preview = () => {
      const value = values();
      panel.querySelector('[data-writing-preview]').innerHTML = `<h3>${h(value.title || 'Your headline will appear here')}</h3><p class="wr-muted">${h(value.place)}${value.place ? ' · ' : ''}${h(value.author)}</p>${paragraphs(value.story || 'Your words, in a simple reading view.')}`;
    };
    post.addEventListener('input', () => {
      const saved = writeLocal(key, values());
      panel.querySelector('[data-draft-feedback]').textContent = saved ? 'Draft saved on this device. It has not been published.' : 'This browser could not save your draft. Copy the story before leaving.';
      preview();
    });
    post.onsubmit = event => {
      event.preventDefault();
      const value = values();
      writeLocal(key, value);
      try {
        const url = form('journal.yml', {...value, title: '[Journal] ' + (value.title.trim() || value.story.split(/[.!?\n]/)[0].slice(0, 90))});
        location.assign(url);
      } catch (error) { panel.querySelector('[data-draft-feedback]').textContent = error.message; }
    };
    panel.querySelector('[data-copy-story]').onclick = async () => {
      try { await navigator.clipboard.writeText(post.elements.story.value); panel.querySelector('[data-draft-feedback]').textContent = 'Story copied. Paste it into the full GitHub publishing form.'; }
      catch { panel.querySelector('[data-draft-feedback]').textContent = 'Select the story text and use your browser’s Copy command.'; }
    };
    panel.querySelector('[data-clear-draft]').onclick = () => {
      if (post.elements.story.value && !confirm('Clear the draft text saved on this device?')) return;
      writeLocal(key, {}); write();
    };
    preview();
  }

  function shop() {
    panel.innerHTML = `<div class="wr-section-heading"><div><p class="eyebrow">Your collection</p><h3>Keep every item clear.</h3><p>Use real photographs, confirmed prices and availability.</p></div>${external(form('product.yml'), 'Add a product', true)}</div>${shopError ? `<p class="wr-notice">${h(shopError)}</p>` : ''}<div class="wr-admin-product-list">${products.map(product => `<article class="wr-panel"><div class="wr-section-heading"><div><p class="eyebrow">${h(SHOP_CATEGORIES[product.category])}</p><h4>${h(product.title)}</h4></div><span class="wr-badge">${h(product.status === 'available' ? money(product.price, product.currency) : product.status === 'sold-out' ? 'Sold out' : product.status === 'hidden' ? 'Hidden' : 'Enquiry')}</span></div><p>${h(product.description)}</p><p class="wr-muted">Product identifier: ${h(product.id)}</p><div class="wr-actions">${external(form('product.yml', {title: '[Product] ' + product.title, 'product-id': product.id, description: product.description, price: product.price ?? '', sizes: product.sizes.join(', '), colours: product.colours.join(', '), photograph: product.image}), 'Update this item', true)}${product.sourceIssue ? external(issueLink(product.sourceIssue), 'Original submission') : ''}</div></article>`).join('')}</div><p class="wr-notice">The form keeps an existing item’s category and availability unless you choose a change. Use <strong>Sold out</strong> to stop enquiries or <strong>Hidden</strong> to remove an item. The team confirms delivery and payment through WhatsApp.</p><div class="wr-actions">${external(allIssues('Product'), 'All product submissions')}<a class="wr-action" href="${ctx.href('/shop/')}">Open public shop</a></div>`;
  }

  function progress() {
    const distances = [...ctx.data.distances].sort((a, b) => b.date.localeCompare(a.date));
    const checkpoints = [...ctx.data.checkpoints].sort((a, b) => b.date.localeCompare(a.date));
    panel.innerHTML = `<div class="wr-admin-layout"><section class="wr-admin-feature"><p class="eyebrow">Mark the journey</p><h3>One verified day at a time.</h3><p>Record the town, walking date and that day’s kilometres. Add coordinates only when the team has confirmed the map stop.</p>${external(progressLink, 'Record walking progress', true)}<p class="wr-muted">A source link and confirmation are required. A correction replaces the day’s distance instead of counting it twice.</p></section><section class="wr-panel"><h3>See the journey take shape.</h3><p>The atlas shows approved records. Planned routes stay separate from distance already walked.</p><div class="wr-actions"><a class="wr-action" href="${ctx.href('/journey-atlas/')}">Open journey atlas</a>${external(allIssues('Progress'), 'Edit progress submissions')}</div></section></div><section class="wr-panel wr-admin-record-section"><h3>Published walking records</h3>${distances.length || checkpoints.length ? `<ul class="wr-admin-records">${distances.slice(0, 15).map(record => `<li><strong>${h(record.date)} · ${h(record.km)} km</strong><span>${h(ctx.data.journeys.find(journey => journey.id === record.journey)?.title || record.journey)}</span>${record.sourceIssue ? external(issueLink(record.sourceIssue), 'Edit record') : ''}</li>`).join('')}${checkpoints.slice(0, 15).map(record => `<li><strong>${h(record.date)} · ${h(record.place)}</strong><span>Verified map stop</span>${record.sourceIssue ? external(issueLink(record.sourceIssue), 'Edit stop') : ''}</li>`).join('')}</ul>` : '<p>No verified records have been submitted through the admin yet. Add a confirmed walking day when it is ready.</p>'}</section>`;
  }

  function connections() {
    const settings = ctx.data.settings;
    panel.innerHTML = `<div class="wr-admin-layout"><section class="wr-admin-feature"><p class="eyebrow">Stay connected</p><h3>Facebook first. Every official link together.</h3><p>Add the exact Facebook profile or Page, other social accounts, public contact email and the WhatsApp number for shop enquiries.</p>${external(form('connections.yml'), 'Update official links', true)}<p class="wr-muted">Leave a field blank to keep it. Type REMOVE into an account field to remove that link.</p></section><section class="wr-panel"><h3>Currently published</h3><dl class="wr-admin-contacts"><dt>Contact email</dt><dd>${h(settings.email)}</dd><dt>WhatsApp</dt><dd>+${h(settings.whatsapp)}</dd>${Object.entries(settings.socials).map(([name, url]) => `<dt>${h(name === 'x' ? 'X' : name[0].toUpperCase() + name.slice(1))}</dt><dd>${url ? `<a href="${h(url)}" target="_blank" rel="noopener noreferrer">Open official account ${iconOut}</a>` : 'Not added yet'}</dd>`).join('')}</dl></section></div><section class="wr-panel wr-admin-record-section"><h3>Share each new chapter</h3><p>After a story is published, use its Facebook, WhatsApp or Copy caption action. An official account link connects readers to that account; it does not automatically publish posts to Facebook.</p><a class="wr-action" href="${ctx.href('/live/')}">Open stories and sharing tools</a></section>`;
  }

  function help() {
    panel.innerHTML = `<section class="wr-panel wr-admin-help"><p class="eyebrow">Keep this link</p><h3>Your routine, in four steps.</h3><ol><li><strong>Open this admin link.</strong> Choose an update, product, walking record or official link.</li><li><strong>Complete the form.</strong> Write naturally and attach photographs on GitHub.</li><li><strong>Confirm on GitHub.</strong> Use your own approved GitHub account and select Create. A GitHub draft is still public.</li><li><strong>Let the website publish.</strong> GitHub checks, builds and deploys the change. Use Publishing history if it has not appeared.</li></ol><div class="wr-actions">${external(repository + '/actions', 'Publishing history')}<a class="wr-action" href="${ctx.href('/')}">View the website</a></div><details><summary>Using Mbanda’s own account</summary><p>The repository owner account is already approved. The owner must add Mbanda’s exact GitHub username to the publisher list once. He can then publish with that account without repository write access. The admin link itself does not grant publishing access.</p></details><details><summary>Correcting or removing content</summary><p>Edit the original GitHub submission. Choose Withdraw from website for a story, Withdraw this progress record for a walking record, or Hidden for a product. Earlier versions remain in GitHub history.</p></details><details><summary>What this GitHub setup includes</summary><p>Website hosting, posts, photographs, products, official social links, route records, revision history and automatic website deployment run through GitHub. Shop enquiries open WhatsApp. Community requests open the visitor’s email app. Automatic Facebook delivery, subscriber emails and online payment processing need their own external services and are not activated by this admin link.</p></details></section>`;
  }

  function show(view, updateHash = true) {
    if (!tabs.some(([id]) => id === view)) view = 'home';
    root.querySelectorAll('[data-admin-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.adminView === view)));
    if (updateHash) history.replaceState({}, '', location.pathname + location.search + '#' + view);
    ({home, write, shop, progress, connections, help})[view]();
    panel.querySelectorAll('[data-go]').forEach(button => button.onclick = () => show(button.dataset.go));
  }
  root.querySelectorAll('[data-admin-view]').forEach(button => button.onclick = () => show(button.dataset.adminView));
  show(location.hash.slice(1), false);
}
