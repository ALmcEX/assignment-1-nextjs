# Meme caption iteration — verification record

Implementation began 2026-10-14; configuration continued 2026-10-15 (America/New_York).

## Implemented

Verified Woman Yelling At Cat and Grumpy Cat templates replace original illustration samples. The protected composer produces one immutable caption candidate, with separate editable scene/template/language, optional title/location, account-scoped drafts and owned reuse. The primary gallery/personal page display trusted AI-captioned memes; stable details preserve old text/images, comments and votes. Bilingual controls identify AI text and source images accurately.

The Gemini endpoint pins the free text model, applies same-origin/auth checks, validates Unicode lengths, has a 25-second provider deadline and no retry loop. Database functions enforce ownership, canonical publication metadata, one publication per generation and atomic user/provider quotas. Private generation fields are excluded from public projections.

## Verified so far

- Full test suite: 169 tests in 39 files passed after review fixes and formatting.
- Final ESLint, production build and diff checks passed after review fixes.
- Disposable PostgreSQL harness: meme, rant, image and cat-gallery permission suites passed against populated legacy fixtures.
- Live Supabase project `zsuvcnbgsvcxlwiankbf`: new migration applied; new columns/RPC existence checked; complete meme rollback suite passed. An initial Monaco editor fill appended to the prior buffer and failed syntax validation; a fresh editor with native paste ran the actual complete script successfully. No failed attempt is counted as a passing check.
- Verified source images: `https://i.imgflip.com/345v97.jpg` and `https://imgflip.com/s/meme/Grumpy-Cat.jpg`; no downloaded/recreated illustrations.
- AI Studio free project rechecked 2026-10-15; existing project key is available. Vercel contains server-only Gemini and Supabase keys for Production and Preview, but its write-only Gemini key cannot be attributed to a project from Vercel alone.
- Local browser homepage shows the real empty meme gallery, not sample votes/content.

## Independent review and fixes

The fresh reviewer found no critical issues and four important issues. All four were fixed in one pass: the preview keeps the validated server template snapshot, quota admission time is sampled after lock acquisition, profile saving resets pending state, and unavailable legacy image signing preserves text/comments with retry. Each JavaScript regression was observed failing before its fix, then passing; the complete suite is green.

The quota lock-wait regression was also reproduced against the live database with two independent SQL sessions: the old function failed “provider quota timestamp was captured before lock acquisition”. After additive `20261015000000_meme_quota_clock.sql`, the same 15-second lock-wait test passed and both sessions rolled back. Date attribution is derived from the post-lock timestamp. Existing SQL suites still pass locally.

No deferred minor findings. The reviewer excluded live configuration/deployment evidence (still executor responsibilities) and superseded unused composer presentation (not reachable in the current product).

## Live API and acceptance (2026-10-15)

The owner saved the free Default Gemini Project key into Vercel Preview. `GEMINI_TEXT_ENABLED=true` is scoped to Preview; the image switch remains absent/false. The same product commit `01d9495b9be941097e02f925a561c62f0784d77a` was redeployed with updated settings. GitHub deployment status reported success at `https://assignment-1-nextjs-2iizq1l4w-almcex.vercel.app` (a unique URL, not the branch alias).

Two real Gemini captions were generated, saved and published through the browser:

- English / Grumpy Cat: “I was told there would be a nap.” Post `19008ed3-11fd-4943-9cd9-17d14d3ac82d`, title “One deadline down”.
- Chinese / Woman Yelling At Cat: “组员：为什么还没写完作业？ 我：猫饿了，这是大自然不可抗拒的召唤。” Post `550333e6-659d-4dfc-a20e-ab4adfb0c042`, title “猫说这才是优先级”.

These are actual API outputs and owner-published acceptance examples, not fake engagement. Vote add → switch → cancel was verified on the English detail; both posts have net score zero after testing. One clearly labeled functional-check comment was saved. The personal gallery shows both posts; the owned reuse form restored the original English scene, template and language. A separate signed-out browser displayed the same public captions/templates and zero scores without private reuse controls.

Google account selection and callback landing on the homepage were verified at localhost:3000 and the existing branch Preview domain. A localhost:3014 attempt fell back to the site URL because that port is not allowlisted; it was not counted as successful. The owner-authorized `jsr28qn72` callback was added explicitly. Vercel redeployment creates new unique hostnames, so any final hostname needs its own precise callback authorization; no wildcard authorization was added.

IAB mobile public gallery at 390px had scrollWidth=390; desktop creator showed two columns, actual templates, bilingual controls, and valid device draft save/clear. Chrome viewport overrides did not change the actual page width; no mobile-creator claim is based on those screenshots. All viewport overrides were reset. Related broken-image and provider-failure behavior is covered by tests.

PM/group feedback has not been supplied. No course submission has been performed. Image billing and paid generation remain unauthorized and disabled.

Evidence directory: `/Users/alex/Documents/Design for AI/assignment-4-evidence/meme-caption-2026-10-14/`. `release.json` records the final source SHA, unique URL and remaining release steps; screenshots and the execution ledger contain no credential values.
