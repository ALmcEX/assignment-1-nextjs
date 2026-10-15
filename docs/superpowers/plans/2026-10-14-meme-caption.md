# Cat Meme Caption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the disabled cat image composer with existing cat meme templates, real free-tier AI captions, trusted publication and community voting.

**Architecture:** Add a server-owned template catalog and a caption generation service beside the existing image service. An additive Supabase migration stores trusted template snapshots, enforces publication provenance and counts provider attempts atomically. Switch the primary pages to memes while keeping old detail URLs and data.

**Tech Stack:** Existing Next.js 16.4, React 19, TypeScript, Supabase PostgreSQL/RLS, Vitest, Gemini REST, public Imgflip templates; no new product dependency required.

**Spec:** `docs/superpowers/specs/2026-10-14-meme-caption-design.md` (approved 2026-10-14).

## Global Constraints

- Budget $0; `gemini-3.1-flash-lite`; no billing activation, paid fallback, image generation or paid Imgflip AI endpoints.
- At least two verified cat templates; retain template name, original HTTPS image URL and source link. Label the generated media “AI 配文” / “AI caption”.
- Scene 1–1000 Unicode characters, caption 1–300, optional title/location at most 120; supported languages `en` and `zh-CN`.
- User limit 10 successful generations/day; provider attempt limit 10/minute and 400/day. Global day resets at America/Los_Angeles midnight; existing user day stays America/New_York.
- Public browsing; login enforced in UI, server and database for generation, publication, votes and comments. Secrets remain server-only.
- One generation yields one candidate and at most one published post. No caption editing or image download/compositing in this release.
- Preserve dark/yellow theme, bilingual controls, eight-item pages, NY publication windows and cumulative net-vote sorting. Preserve historical detail URLs, courses and authentication behavior.
- Use the existing attached worktree `/Users/alex/.codex/worktrees/assignment-4-rants/Design for AI`; inspect its status before changes and read its AGENTS.md / installed Next.js guides before product code.
- Final delivery includes a verified commit-specific Vercel URL. PM/group feedback remains pending until actually supplied.

## Review Focus

1. Edited form during/after generation: a candidate keeps the template and scene that actually produced it; Task 4 tests snapshot consistency.
2. Midnight and concurrent requests: reservations cannot exceed either quota, nor increment the wrong user date; Task 2 SQL tests expiry and date boundaries.
3. Template URL disappears or catalog changes: published snapshot stays unchanged and text remains readable; Tasks 1 and 5 test catalog fallback and broken images.
4. Direct database writes bypass UI: another user's generation and forged meme fields must be rejected; Task 2 tests insert/update/RPC paths.
5. Safety-blocked/empty/429 provider output: no fake success, no retry loop, user reservation released and global attempt retained; Task 3 tests each failure.

## File Map

- New `src/lib/memes/{types,templates,gemini,generation-service,queries,mutations,local-draft}.ts`: domain types, catalog, provider adapter, orchestration, DB access and versioned local draft respectively; matching `.test.ts` files.
- New `app/api/memes/generate/{route.ts,route.test.ts}`: authenticated caption endpoint; existing image endpoint stays disabled.
- New `src/components/memes/{meme-composer,meme-card,meme-feed,my-memes}.tsx` and matching component tests: focused new UI, reusing existing voting controls and filters.
- Modify `app/{page,create/page,my-cats/page,rants/[id]/page}.tsx`, `src/components/rants/rant-detail.tsx`, `src/lib/rants/{types,queries}.ts`, `src/lib/i18n.ts`, `app/globals.css`, `src/components/site-header.tsx` and affected tests: integration and compatible detail projection.
- New `supabase/migrations/20261014000001_meme_captions.sql`, `supabase/tests/meme_caption_permissions.sql`: additive data/provenance and rolled-back permission tests.
- Remove unused original sample components/assets after references are removed; preserve cat branding icons that are not sample illustrations.
- Update `.env.example`, `README.md`, `docs/ai-cat-images.md`; new `docs/meme-caption-verification.md`: operational handoff and real evidence.

---

### Task 1: Verified template catalog and shared types

**Files:** Create `src/lib/memes/types.ts`, `templates.ts`, `templates.test.ts`.

**Interfaces:** Export `MemeTemplate = { id:string; name:string; imageUrl:string; sourceUrl:string; description:string; width:number; height:number }`; `MemeSeed = { prompt:string; templateId:string; language:Language }`; `CaptionCandidate = MemeSeed & { generationId:string; caption:string; template:MemeTemplate }`; `MemeFeedItem = { id:string; title:string; body:string; location:string; created_at:string; scene:string; template:MemeTemplate; totals:VoteTotals; myVote:1|-1|null; canReuse:boolean }`. Reuse existing `CatFilters` without renaming its established semantics. Export `getMemeTemplates():Promise<MemeTemplate[]>` and `findMemeTemplate(id:string):MemeTemplate|null`.

- [ ] Verify Imgflip's public catalog and official template pages for Woman Yelling At Cat (188390779) and Grumpy Cat (405658). Record actual URL, dimensions and a short accurate description; no guessed asset URLs or remote media downloads.
- [ ] Write `templates.test.ts`: assert both verified IDs exist, unknown ID is null, only pinned cat IDs survive a changing popular catalog, HTTP failure/timeout returns the verified catalog, and untrusted remote URLs cannot replace approved origins/paths.
- [ ] Run `npm test -- src/lib/memes/templates.test.ts`; require failure from missing implementation.
- [ ] Implement the types and catalog. Cache the free `get_memes` lookup for one hour, abort after five seconds, and allow only pinned entries; validated local metadata supplies the fallback. Keep provider-facing descriptions server-owned; never accept client template objects as authority.
- [ ] Re-run the test; require zero failures. Commit only Task 1 files as `feat: add verified cat meme templates`.

### Task 2: Trusted text records, publication and atomic quotas

**Files:** Create migration and SQL suite above; modify the temporary SQL harness outside the repo only if needed for local execution.

**Interfaces:** Add nullable `ai_generations.purpose` (`meme_caption` when used here), `meme_template jsonb`; add nullable `rants.meme_template jsonb`, `meme_scene text`. Add service-only `reserve_meme_attempt() returns void`, service-only `finish_meme_caption(p_user_id uuid,p_token uuid,p_prompt text,p_system_prompt text,p_language text,p_model text,p_caption text,p_template jsonb) returns uuid`; authenticated `publish_meme_caption(p_generation_id uuid,p_title text default '',p_location text default '') returns uuid`; `meme_feed_page(p_sort text,p_window text,p_offset integer,p_mine boolean) returns` card rows matching `MemeFeedItem` (JSON template field named `template`). Continue using `reserve_ai_generation` / `release_ai_generation` for the user reservation.

- [ ] Write rolled-back SQL assertions for: anon denial; owner success; duplicate publication rejected without extra rows; cross-owner generation rejected; direct insert/update cannot forge template, scene, caption or AI attribution; private generation hidden; old image/text writes retain valid behavior. Populate pre-existing image/text fixtures rather than assuming an empty DB.
- [ ] Add quota assertions: 11th minute attempt rejected, 401st daily attempt rejected, failed provider attempts retained, user success capped at 10; expired or mismatched tokens cannot finish. A token reserved immediately before user midnight finishes against its reserved row, not the new date. Verify global day boundary in America/Los_Angeles. Run SQL suite against the isolated harness and observe missing migration failures.
- [ ] Implement additive constraints: meme purpose requires text media, no image path, valid caption/template metadata; non-meme generations retain old constraints. Use a locked quota row with an actual rolling minute attempt window plus LA date counter, hidden by RLS and executable only by service_role. Apply explicit function grants and empty search_path.
- [ ] Implement `finish_meme_caption` as one transaction: match user/token/unexpired reservation, increment its original usage row, insert the verified caption and server-supplied template snapshot. Enforce lengths and supported language/model; provider is fixed to Gemini. Never store keys.
- [ ] Extend `validate_rant_references` so meme fields and body derive from the owned generation and cannot be set independently; no-generation posts cannot carry meme metadata. Implement publish RPC and feed projection with existing pagination/window semantics, `auth.uid()` ownership and aggregate scores, excluding legacy posts from this feed.
- [ ] Run the new suite plus existing rant/image/cat permission suites; require all assertions and rollback to pass. Inspect migration status on the intended live project before applying the single new migration. Commit as `feat: enforce meme provenance and free-tier quotas`.

### Task 3: Real Gemini caption endpoint

**Files:** Create `src/lib/memes/gemini.ts`, `generation-service.ts`, matching tests and `app/api/memes/generate/route.ts` / test; update `.env.example`, `src/lib/i18n.ts` for error keys.

**Interfaces:** `generateMemeCaption(seed:MemeSeed,template:MemeTemplate):Promise<{caption:string; model:string; systemPrompt:string}>`; `createMemeDraft(userId:string|null,input:MemeSeed,deps:MemeGenerationDependencies):Promise<CaptionCandidate>`. Dependencies: `configured:boolean`, `reserveUser(id):Promise<string>`, `releaseUser(id,token):Promise<void>`, `reserveAttempt():Promise<void>`, `generate(seed,template)` matching provider return, `save({userId,token,seed,template,caption,model,systemPrompt}):Promise<string>`. Endpoint consumes only seed fields and returns candidate with `Cache-Control: no-store`.

- [ ] Write adapter tests for plain text success, safe rendering of markup as text, 300/301 Unicode boundary, empty/safety-blocked output, HTTP 429, abort and malformed responses. Mock fetch; assert pinned model, capped output tokens, no tools and one request without automatic retries.
- [ ] Write service/route tests asserting auth and origin rejection, null/invalid JSON and >16000-character body rejection, disabled/missing config causes no reservations, unknown template causes no call, one successful save returns its true ID, and save/provider/global-limit failures release user reservation while never undoing an attempt. Failed calls do not create success records or log raw response/credentials.
- [ ] Run `npm test -- src/lib/memes/gemini.test.ts src/lib/memes/generation-service.test.ts app/api/memes/generate/route.test.ts`; observe expected failures.
- [ ] Implement the adapter with `AbortSignal.timeout(25000)`, maximum 256 output tokens and explicit concise language/template instructions. Parse a successful text response, validate the 1–300-character caption and reject absent/blocked results. Model errors map to bounded translated keys; output is always rendered as text.
- [ ] Implement orchestration in order: auth/config/input/template validation → user reservation → global attempt → provider → finish/save. Implement route with `maxDuration=60`, private admin RPCs, controlled 400/401/403/429/502/503 responses. Add `GEMINI_TEXT_ENABLED=false`, `GEMINI_TEXT_MODEL=gemini-3.1-flash-lite`; keep image switch false. Missing keys fail closed.
- [ ] Re-run Task 3 tests; require zero failures. Commit as `feat: generate AI meme captions with Gemini`.

### Task 4: Composer, local drafts and owned reuse

**Files:** Create meme composer and tests, `local-draft.ts` / tests, `mutations.ts` / tests and `queries.ts` / tests; modify `app/create/page.tsx` and bilingual messages.

**Interfaces:** `publishMeme(client:SupabaseClient,input:{generationId:string;title?:string;location?:string}):Promise<{id:string}>`; `getMemeSeed(client,id:string):Promise<MemeSeed|null>`; `getMemes(client,filters:CatFilters,mine=false):Promise<{items:MemeFeedItem[];hasMore:boolean}>`. `MemeComposer({userId,templates,seed?,textEnabled})` consumes Task 1 types; local draft helpers read/write/clear versioned `MemeSeed & {title:string;location:string}` under user-specific `catcanvas:meme:v1:<userId>` keys.

- [ ] Write helper tests for optional Unicode title/location boundaries, invalid ID, unauthenticated publication, other-owner seed unavailable, 9th-row pagination and thrown RPC errors. Test malformed/old draft JSON, unknown template and separate accounts.
- [ ] Write composer tests asserting template selection, independent output language, generated caption/source preview, no caption editing, disabled configuration, successful publication ID, duplicate-action disabling and failure preservation. Specifically change template/scene/language after success and assert publishing still sends only the existing candidate ID, with original candidate parameters visibly identified. An in-flight request cannot silently rebind to newly edited fields.
- [ ] Run these new tests and observe expected failures.
- [ ] Implement helper RPCs and the composer using `/api/memes/generate`. Separate editable seed from immutable successful candidate; render caption with React text nodes. Use original source URLs, fixed contain images, explicit public-scene notice and save/clear local draft controls. Keep title/location optional and preserve last success on errors.
- [ ] Integrate protected `/create`, server catalog and owner-only reuse with user/reuse keyed state. Reject unavailable reuse without hiding the usable composer; don't put prompts in URL. Re-run tests and commit as `feat: create and reuse captioned cat memes`.

### Task 5: Gallery, personal page and compatible details

**Files:** Create meme feed/card/my-memes components and tests; modify primary pages, header, detail types/query/component and tests, CSS/i18n; remove unreferenced sample components and `public/cat-samples/*.svg`.

**Interfaces:** `MemeCard({item:MemeFeedItem,user:User|null})`, `MemeFeed({items,filters,user,hasMore,hasError,authRequired})`, `MyMemes({items,user,page,hasMore,hasError})`. Extend `Rant` with nullable `meme_template:MemeTemplate|null` and `meme_scene:string|null`; detail query retrieves only the public post snapshot, owner reuse uses Task 4's guarded query.

- [ ] Write tests for real empty/error distinction, no sample/fake votes, eight-item pagination/filter reset, caption/source labels in both languages, broken-image retry with caption still visible, own reuse, guest voting login, and preserving publication date. Add detail regressions for old text/image and new meme; query tests assert private generation/system prompt is never fetched for a guest.
- [ ] Run new/affected tests to observe failures.
- [ ] Switch home and `/my-cats` to `getMemes`, preserve filter semantics and existing vote controls, use “我的作品” / “My creations”. Remove samples query behavior, original sample art and image-generation copy. Keep existing branding and responsive dark/yellow design.
- [ ] Add meme branch to existing detail without changing comment/vote APIs. Display immutable public scene/template/source, keep legacy rendering and show owner reuse only after successful ownership check. Do not replace missing images with a different meme.
- [ ] Re-run new and affected tests; require zero failures. Commit as `feat: browse and vote on AI-captioned cat memes`.

### Task 6: Free-project configuration, end-to-end verification and release

**Files:** Update `README.md`, `docs/ai-cat-images.md`; create `docs/meme-caption-verification.md`; store screenshots/evidence under the existing assignment evidence directory, outside product source.

**Interfaces:** No new product interface. Operates the completed endpoint and pages from Tasks 1–5; delivers actual product commit SHA and matching Vercel deployment URL.

- [ ] Inspect Vercel configuration by variable names/presence and verify which Gemini project the deployed key belongs to without printing it. Use only the confirmed free Default Gemini Project. If a credential is absent/unverifiable, prepare the exact secure user handoff; do not claim connection or substitute paid service. Keep text generation off until mapping is verified, then configure the free text switch; image remains off.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, `git diff --check`; require zero failures and successful exits. Re-run SQL permissions after any migration repair. Report current results, not previous counts.
- [ ] In the browser verify signed-out browsing, Google callback home, protected creator, Chinese and English generation, one real successful caption saved/published, list/detail score consistency, vote add/switch/cancel, comment and owner reuse. Capture the real result and IDs without private credentials; label any authenticated action that needs user handoff as unverified until completed.
- [ ] Check desktop two-column and mobile single-column layouts, no horizontal overflow, focus, broken image and error states. Free-tier 429/timeout are verified by mocks rather than intentionally exhausting quota. Preserve historical detail smoke checks.
- [ ] Use the required fresh whole-branch review for the previously selected native execution method. Resolve critical/important issues; rerun checks affected by repairs. Document limits and missing real PM/group feedback without inventing it.
- [ ] Commit final fixes and evidence docs; push `codex/assignment-4-rants`, wait for deployment and verify its reported commit SHA matches the final product commit. Open its unique Vercel URL, smoke check feed/create/detail and return that link. Do not claim course submission or use a mutable alias as the assignment URL.

## Self-review and execution handoff

Spec sections 1–2 map to Tasks 1, 3 and 6; section 3 to Tasks 2–4; section 4 to Tasks 4–5; sections 5–6 to Tasks 1–3; section 7 to Task 6 and task-level verification. Each Review Focus case has a named owning test. Types and RPC arguments are shared explicitly; the historical image service remains independent. Secret/project verification is an execution dependency, not evidence already obtained.

Preserved execution method: native/inline implementation in this session, followed by one fresh whole-branch reviewer. This plan is ready for user review; approval of the written spec does not yet start product implementation.
