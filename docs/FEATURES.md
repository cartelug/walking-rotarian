# Implementation map: 48 capabilities

`Browser` means implemented on the static-compatible website. `Server` means implemented in the included persistent Node/SQLite service and Studio; production activation needs its hosting connection. `Service` adds the stated external account requirements. The site does not claim that an unconnected service is operational.

The current GitHub Pages website also supports approved form publishing through `/studio/`. Journal text, photographs, corrections, draft exclusion, withdrawal, permanent story pages and RSS update after the automatic website build. The existing owner account is enabled. Independent server logins and the remaining server features still use the optional backend. See [the publishing guide](PUBLISHING.md).

The added `/shop/` supports merchandise, books, accessories, search, filters, size/colour selections, quantities, a saved enquiry list and a prepared WhatsApp quote request. Approved product forms manage photographs, prices, availability and visibility. Starter collection ideas have illustrative artwork and require confirmation of price and stock.

| ID | Capability | Implementation |
|---|---|---|
| 01 | Mobile composer | Approved GitHub form from Studio for the current website; optional server Studio with phone dictation. |
| 02 | Rich media entries | Form-published text and photographs; server adds protected uploads, audio/video, captions and credits. |
| 03 | Live reading feed | Browser checks for new entries; forms publish through an automatic Pages build, or the server publishes immediately. |
| 04 | Permanent story links | Build-generated pages for source and form-published stories; server SSR for its own entries. |
| 05 | Distinct story types | Browser filters + Studio entry types. |
| 06 | Pinned notices and corrections | Browser display + versioned server fields. |
| 07 | Draft recovery | Browser autosave keyed by signed-in author; server drafts and retry messages. |
| 08 | Home-screen access | Browser manifest, service worker, offline fallback and device-specific installation. |
| 09 | Scheduled stories | Server time-aware publication; no automatic future checkpoint claims. |
| 10 | Reusable media library | Server uploads and metadata, reused in entries, reports and cards. |
| 11 | Quick post templates | Studio departure and recap prompts; original author controls wording. |
| 12 | Team roles | Server owner/editor/contributor/finance permissions, sessions and account controls. |
| 13 | A hub for every walk | Existing journey pages plus native diary/atlas/report links. |
| 14 | Interactive checkpoint map | Browser coordinate atlas, approved checkpoint list and OpenStreetMap links. |
| 15 | Verified daily distance log | Server unique journey/date record; browser separate verified total. |
| 16 | GPX route import | Studio bounded GPX parsing/preview/review; server validation and persistence. |
| 17 | Map and diary filters | Browser journey/date filters with matching checkpoints and stories. |
| 18 | Journey replay | Browser previous/next approved checkpoint controls and related diary. |
| 19 | Searchable journey archive | Browser year/status/cause records with planned/completed separation. |
| 20 | Site search | Browser full-text story/place/biography search. |
| 21 | Photo essays and collections | Entry type, reusable media and the existing curated gallery. |
| 22 | Reviewed translations | Studio reviewed translation records; browser original/translation selector. |
| 23 | Save for later | Browser device-local snapshots, bookmarks and removal. Media may need a connection. |
| 24 | Low-data reading | Browser preference and on-demand third-party media. |
| 25 | Follow a journey by email | Server + email service: confirmed signup, preferences and unsubscribe. |
| 26 | Daily or weekly digest | Server + email service: previews, reviewed sends and opt-in frequency scheduler. |
| 27 | Encouragement wall | Server moderated consent-based submissions; browser approved messages. |
| 28 | Ask Mbanda | Community question form and private editorial inbox. |
| 29 | Join a walking leg | Published opportunities, request form and team confirmation workflow. |
| 30 | Volunteer matching | Skills/location requests, assigned owner and follow-up status. |
| 31 | Verified social directory | Server-managed URLs, Facebook-first placement, no guessed account. |
| 32 | Curated Facebook embeds | Browser explicit-load eligible post embed with original-link fallback. |
| 33 | Sharing and caption tools | Browser Facebook, WhatsApp, native sharing, copied links/captions. |
| 34 | Connected Page publishing | Server + authorised Meta Page access: queued delivery, status and duplicate protection. |
| 35 | Branded social cards | Browser local portrait/square JPEG export using the original WR mark. |
| 36 | RSS updates | Build-time feed includes source and form-published stories; live feed for optional server entries. |
| 37 | Cause and impact pages | Browser cause hub; server editable beneficiary/impact records. |
| 38 | Support and step calculator | Browser UGX step calculation linked to the official campaign contribution flow. |
| 39 | Verified funding panel | Finance-only server records; separate funds/pledges, source and date. |
| 40 | Supporter recognition | Server consent controls and anonymous public display option. |
| 41 | Sponsor and partner profiles | Browser profiles + server approved descriptions/logos; no invented sponsors. |
| 42 | Sponsorship and speaking enquiries | Focused community request types; server receipts or honest unsent mail fallback. |
| 43 | Press and speaker kit | Existing media room plus biography, portrait and supplied logo downloads. |
| 44 | Press coverage library | Existing sourced press library retained. |
| 45 | Website performance dashboard | Server aggregated event/referral counts; no claimed Facebook reach or donations. |
| 46 | Revisions and recovery | Server optimistic locking, revision restore, content export and database/media backup CLI. |
| 47 | One team inbox | Server assigned requests, moderation, private notes and JSON export. |
| 48 | Downloadable journey report | Browser selected-story PDF with dates, photographs and source credits. |
