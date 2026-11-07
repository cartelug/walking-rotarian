# Publishing and operating the Walking Rotarian

## Simple publishing on the current website

Open `/studio/`, choose **Write a live update**, sign in to an approved GitHub account, write the headline and story, attach photographs, and choose **Publish now**. Submitting the form starts the publishing workflow, then builds and deploys the website. Check the workflow result if a submitted update has not appeared. Publishing takes the time of a Pages build rather than appearing immediately.

Edit the same submission to correct a story. Choose **Draft - keep off website** or **Withdraw from website** to remove it from the next build. GitHub form submissions and attachments are public even when marked Draft. Keep private drafts on your own device.

The existing `cartelug` account is approved. Add Mbanda's exact GitHub username to `src/data/publishing.json` to let him publish with his own account. The workflow checks both the submitter and actor against this list. Approved publishers need a GitHub login but do not need repository write access. Do not share an account or place a token in the website.

The workflow writes only `src/data/journal.json` or `src/data/shop.json`. It uses the temporary Actions token, checks the current form, retries content conflicts against fresh data, and invokes the Pages workflow directly after saving. Earlier content versions remain in Git history.

## Shop on the current website

The `/shop/` page supports category and text filters, size and colour choices, quantities, a device-local enquiry list, and one prepared WhatsApp message. The contact is the site's existing public WhatsApp number. Visitors review and send the message themselves. The team confirms stock, item prices, delivery and payment arrangements in that conversation.

Starter merchandise and publication categories are enquiries with illustrative artwork. Their actual designs, stock and prices need the team's confirmation. No sale or donation total is inferred from an enquiry.

Use **Add or update a product** in `/studio/` to maintain the collection. Use the existing product identifier to update it. **Available** requires a confirmed price in whole UGX. **Enquiry** requests a quote, **Sold out** disables adding the item, and **Hidden** removes it from the public catalogue. Attach a real product photograph to replace an illustration. Edit the original product submission for later corrections.

The optional server deployment below provides an independent publishing login, moderation, protected uploads, email delivery and automatic Facebook Page posting. Browser storage holds reading preferences, saved copies and enquiry selections on one device.

## What works on GitHub Pages

- Live-journal reader and homepage previews using the existing dated source records.
- Permanent pages for existing records; search, filters, archive and journey links.
- Low-data mode, device-local saved stories, offline fallback and installation on supported devices.
- Journey atlas UI and replay from approved records, with no invented coordinates or live GPS.
- Facebook/WhatsApp sharing and copied captions; selected public Facebook embeds when an editor attaches an eligible post.
- Branded portrait/square card rendering, locally generated journey PDF reading copies, RSS, campaign step calculation, cause/partner information and the press-kit downloads.
- Community forms use an explicitly unsent email-app fallback until the server is connected.

## Activate shared publishing

1. Deploy the included Docker image or run Node 24.14+ on hosting with a **persistent volume**. GitHub Pages cannot execute this server. Do not use an ephemeral filesystem for the database/uploads.
2. Build with the same `BASE_PATH` as the Pages site. The current value is `/walking-rotarian`. Set `PUBLIC_URL` to the backend HTTPS origin plus that path. Set `DATA_DIR` to the persistent directory and `ALLOWED_ORIGINS=https://cartelug.github.io`.
3. Initialise the owner once by passing a JSON object with `email`, `name` and a strong `password` through stdin to `node server/create-owner.mjs`. Do not put the password in shell arguments, source files, build variables or public assets. The command refuses to create a second owner. No account is pre-created in production.
4. Open the backend's `/walking-rotarian/studio/`. Sign in, add each team member's own account and assign owner, editor, contributor or finance permissions.
5. Set the GitHub repository variable `WALKING_ROTARIAN_API_URL` to `https://BACKEND/walking-rotarian/api`. Re-run the existing Pages workflow. This is a public address, not a credential.
6. Check publishing from a phone and reading from a separate browser. The homepage, live feed and archive should reflect one saved entry. Studio sign-in stays on the backend origin so it does not depend on third-party cookies.

The server serves the same website too. It provides SSR story pages with per-entry metadata and a dynamic RSS feed, so newly published entries have shareable URLs without waiting for a Pages rebuild. New entries link to those server-rendered pages; original static record URLs remain unchanged.

## Connections

### Facebook

The official Facebook URL is deliberately unfilled until the owner verifies the correct account. Add it in Studio → Connections. Profile sharing is manual. Connected Page publishing requires `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` and a currently supported `FACEBOOK_GRAPH_VERSION` in the server environment, together with the necessary Meta access. No Facebook password is collected.

Website publication succeeds independently of Facebook. Delivery jobs are unique per entry. Ambiguous Facebook failures are marked `needs_review`; they are not automatically posted again. An owner must check the Page before explicitly retrying through the admin endpoint. Source, browser bundles and public configuration never contain these credentials.

### Email

Configure `RESEND_API_KEY` and an authorised `MAIL_FROM` on the server. Until then email subscriptions and queued sending are not represented as active. Signups require confirmation; manage/unsubscribe links are opaque tokens. An editor can preview and queue selected public stories. Owners can enable automated daily/weekly digests; each subscriber receives only their chosen journey, at their chosen frequency, when new stories exist.

No email or Facebook service is contacted by the test suite. Provider calls use mocked responses in tests.

## Editorial operation

- Mbanda can write, dictate through his phone keyboard, attach library media and publish. The title is optional. A contributor can save only their own drafts; an editor reviews them.
- Add a caption, alternative text and credit to each uploaded photograph. Images are resized on the device before upload. Longer videos can remain on their original video platform.
- Checkpoints require a date, source, coordinates and approval. GPX imports need a recording date, source and explicit review. Publishing a story alone never moves the map.
- Daily distance records are unique by journey and date. Editing a day's record changes that record rather than counting it twice. Planned route distances remain separate.
- Finance records are available only to owners/finance reviewers. Confirmed funds and pledges stay separate, with an approved source and as-of date. Payment continues on the authorised PCI campaign site.
- Public supporter messages need consent and editorial approval. Enquiries and volunteer requests remain in the private inbox.
- Translation text is published only after editorial review. No machine translation is silently added.

## Backups and maintenance

Run `node server/backup.mjs` with the correct `DATA_DIR` and a private `BACKUP_DIR` outside the served directory. It makes a consistent SQLite backup and copies uploaded media. Schedule this on the chosen host, retain backups away from the instance and test restoration. While media files are immutable, an upload may finish during a backup; run a second backup if the source was actively changing.

To restore a full backup, stop the server, preserve the current data directory, copy the backed-up database and uploads into the persistent directory, then restart and verify. Do not overwrite a running SQLite database. The Studio content backup excludes passwords and sessions; use it for editorial exports, not as a replacement for the database/media backup.

Revision restoration preserves the previous version. Automated tests exercise publishing, revision conflicts/restoration, roles, CSRF, private uploads, moderation, double opt-in, unsubscribe, digest frequency and Facebook duplicate protection. Apply software updates on the host and review delivery errors in the Studio.

## Running and verification

```sh
node build.mjs
npm test
node tools/check_site.mjs
npm start
```

For a Pages-path build, use `BASE_PATH=/walking-rotarian` and `SITE_URL=https://cartelug.github.io/walking-rotarian` with the same checks. Preserve the existing noindex preview setting unless the owner requests a public search launch.

## Remaining deployment inputs

- A persistent Node hosting destination and its supported deployment connection.
- The owner's intended login identity, set privately during bootstrap.
- The exact verified Mbanda Facebook profile/Page URL; Page access only if automatic posting is wanted.
- An authorised email provider/sending domain for confirmed subscriptions and digest delivery.

These are connection requirements, not simulated features. Until connected, the site continues to show real sourced records and labels delivery accurately.
