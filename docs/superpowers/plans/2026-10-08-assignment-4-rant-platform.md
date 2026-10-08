# Assignment 4 Rant Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Assignment 3 into a bilingual Columbia/NYC rant platform with authenticated publishing, AI drafts, voting, comments, and strict database permissions.

**Architecture:** Keep the existing Next.js App Router, Supabase SSR authentication, and Vercel project. Public server pages read published content; authenticated clients publish and interact under RLS. A server-only Gemini endpoint validates the session, reserves generation quota, calls the model, and saves the actual prompt/output using a service-role client.

**Tech Stack:** Existing Next.js 16, React 19, TypeScript, Supabase Auth/Postgres/Storage, Vitest/Testing Library; Gemini REST API via fetch.

**Spec:** `docs/superpowers/specs/2026-10-08-assignment-4-rant-platform-design.md`

## Global Constraints

- Reuse `ALmcEX/assignment-1-nextjs`, the existing Supabase project and Vercel project. Start from Assignment 3 commit `9bb5f6c`, preserving its history.
- Homepage list entries show only title and location. Body, photos, AI labels, vote controls, and comments appear on the detail page.
- Anonymous users may browse; publishing, uploading, generating, voting and commenting require authentication.
- Title/location limits: 120 characters each; body: 3000; comment: 1000. Reject blank trimmed strings. One optional JPEG/PNG/WebP image, maximum 5 MB.
- Default interface language is English; support Simplified Chinese and persisted selection. User content retains its original language.
- Store real prompts and original AI outputs. Clearly label the six Codex-generated seeds; do not invent users, votes, comments, or provider calls.
- Enable RLS for every application table. Public aggregate scores must not expose user vote records. Keep profile photos private.
- Secrets stay server-side and untracked. Final deployment must be publicly accessible and tied to the final commit.

## Review Focus

- Direct API/database calls must reject anonymous mutations and spoofed user IDs even if the caller bypasses the UI.
- A generated draft or image belonging to another user must never be attached to a new post.
- Concurrent votes and generation requests must respect uniqueness and the 10-successful-generations-per-New-York-day quota.
- A provider failure or failed post submission must preserve user text, release generation reservation, and never claim a successful generation.
- Changing interface language must update native-looking upload buttons, existing auth/profile UI, empty states and error messages without translating posted content.

---

### Task 1: Rant data model, validation and permissions

**Files:** Create `src/lib/rants/types.ts`, `src/lib/rants/validation.ts`, `src/lib/rants/validation.test.ts`, `supabase/migrations/20261008000000_rant_platform.sql`, `supabase/tests/rant_permissions.sql`.

**Interfaces:** `RantInput = { title: string; location: string; body: string; imagePath?: string | null; generationId?: string | null }`; `validateRant(input: unknown): RantInput`; `validateComment(body: unknown): string`; `validateRantPhoto(file: File | null): void`. Validation errors carry stable translation keys.

- [ ] Write and run failing validation tests: trimmed required text, exact limits, invalid UUID, photo MIME/size, malformed payloads; then implement and run the green test file.
- [ ] Create `rants`, `ai_generations`, `rant_votes`, `rant_comments`, `ai_generation_usage`; enforce text checks, foreign keys, one vote per user/post, and vote values of 1/-1. Treat seed-only null creators as trusted migration data.
- [ ] Add RLS: public rant/comment reads; authenticated self-owned post/comment mutations; own vote reads/mutations; own generation reads; service-only generation/usage writes. Check generation ownership and photo object ownership during publication. Prevent clients from changing owner IDs or seed flags.
- [ ] Add fixed-search-path aggregate and quota functions. Public functions return only total counts and published post data; service-only quota reservation expires after 2 minutes, limits successes to 10/day, and identifies each reservation with a UUID so stale releases cannot clear a new request.
- [ ] Make avatars private, retain owner policies, and create `rant-photos` with public reads and owner-path writes. Review all live public-schema tables and current grants before applying the migration.
- [ ] Execute rollback-contained SQL tests for anonymous writes, cross-user mutations, forged AI association, invalid votes, duplicate votes, own writes, and quota races. Commit this deliverable after validation.

### Task 2: Bilingual application shell and existing pages

**Files:** Create `src/lib/i18n.ts`, `src/components/language-provider.tsx`, `src/components/site-header.tsx`, `src/components/photo-picker.tsx`, `src/components/language-provider.test.tsx`; modify `app/layout.tsx`, `src/components/auth-nav.tsx`, `src/components/course-list.tsx`, `src/components/dashboard-panel.tsx`, `app/profile/page.tsx`, `app/profile/profile-form.tsx`, `app/auth/auth-code-error/page.tsx`, `app/globals.css`.

**Interfaces:** `Language = 'en' | 'zh-CN'`; `useLanguage(): { language: Language; setLanguage(language: Language): void; t(key: TranslationKey): string }`; shared `PhotoPicker` submits its underlying file field with an explicitly translated visible button.

- [ ] Write/run failing tests that switch languages, persist the choice, and display translated upload/status text; implement the provider and complete typed dictionaries.
- [ ] Add the top-right language menu and shared navigation. Translate existing interface strings, including profile/auth errors through stable error keys; adapt existing tests to the provider while preserving their original behavior checks.
- [ ] Replace profile public-avatar URLs with short-lived signed URLs; preserve existing avatars and Google sign-in/out behavior. Avoid displaying storage implementation details to users.
- [ ] Create a responsive, accessible visual style with strong typography, compact title/location rows, distinct detail/form layouts, keyboard focus, and mobile navigation.
- [ ] Run the suite and commit.

### Task 3: Public feed and rant details

**Files:** Create `src/lib/rants/queries.ts`, `src/components/rants/rant-feed.tsx`, `src/components/rants/rant-detail.tsx`, `src/components/rants/rant-feed.test.tsx`, `app/rants/[id]/page.tsx`, `app/courses/page.tsx`; modify `app/page.tsx`.

**Interfaces:** `getRants(client, sort: 'latest' | 'popular'): Promise<RantSummary[]>`; `getRant(client, id: string): Promise<RantDetail | null>`; `RantSummary` exposes only `id`, `title`, `location`; detail includes body/image/source plus public vote totals and comment records.

- [ ] Write/run a failing rendering test asserting title/location links are present and body/photo/comment content is absent from the feed; implement the public feed and latest/popular sorting.
- [ ] Implement detail loading, missing-post handling, public images, safe text rendering, AI/example labels and comments. Use generic non-identifying author labels.
- [ ] Move the original course catalog to `/courses`; preserve its existing read-only data and navigation from the new app.
- [ ] Verify empty/error/loading states in both languages, run the suite, and commit.

### Task 4: Authenticated publishing, voting and comments

**Files:** Create `app/rants/new/page.tsx`, `src/components/rants/rant-form.tsx`, `src/components/rants/rant-interactions.tsx`, `src/lib/rants/mutations.ts`, `src/lib/rants/mutations.test.ts`, `src/components/rants/rant-interactions.test.tsx`; modify the detail component to embed interactions.

**Interfaces:** `publishRant(client, input: RantInput, photo: File | null): Promise<{ id: string }>`; `setVote(client, rantId: string, value: 1 | -1): Promise<void>` toggles an existing same-value vote off; `addComment(client, rantId: string, body: string): Promise<void>`.

- [ ] Write/run failing tests for unauthenticated publication, photo ownership paths, vote INSERT/UPDATE/DELETE transitions, failed mutations preserving UI state, and empty comment rejection; then implement each behavior and watch its test pass.
- [ ] Require a verified current user before every mutation, assign ownership from that session, and rely on RLS for database enforcement. Clean up a newly uploaded image if the post fails.
- [ ] Protect `/rants/new`; implement title/location/body/photo fields, disabled duplicate submissions, and redirect to the new detail page after a successful post.
- [ ] Show login actions for guests, vote toggles and comment form for authenticated users. Refresh confirmed state only after successful database writes; retain comments on failure.
- [ ] Run the suite and commit.

### Task 5: Gemini drafts and persisted AI examples

**Files:** Create `src/lib/supabase/admin.ts`, `src/lib/rants/gemini.ts`, `src/lib/rants/generation-service.ts`, `src/lib/rants/generation-service.test.ts`, `app/api/generate/route.ts`, `supabase/migrations/20261008000001_seed_rants.sql`; modify the rant form and `.env.example`.

**Interfaces:** `generateDraft(input: { prompt: string; language: Language; location: string }): Promise<{ title: string; body: string; model: string; systemPrompt: string }>`; authenticated endpoint returns `{ generationId, title, body }` after persisting the original output. Missing configuration and upstream errors return stable localized error keys.

- [ ] Write/run failing service tests for missing authentication, missing key, malformed Gemini output, upstream timeout/error, saved original prompt/output, and reservation release on failure; implement with injectable provider/storage boundaries.
- [ ] Use official Gemini documentation to select an available model and its structured-output request format. Keep service-role and Gemini keys server-only. Validate same-origin requests, prompt size, response shape and generated text limits; bound the provider timeout.
- [ ] Reserve generation quota atomically; save actual output before returning it; commit quota only for saved successful generations. The user can edit the draft while retaining its source generation ID.
- [ ] Add the 6 approved seeds idempotently with original prompts, actual Codex output/provider attribution, no real user attribution, and zero fabricated votes/comments.
- [ ] Verify the form permits plain manual posts when AI is unavailable; run the suite and commit.

### Task 6: Live configuration, verification and Vercel delivery

**Files:** Modify `README.md`; create `docs/assignment-4-verification.md`.

- [ ] Apply reviewed migrations to the existing Supabase project; audit all public tables for RLS and unnecessary grants. Configure server-only Gemini/service-role variables in the existing Vercel project using the authenticated service UI or supported CLI without printing secrets.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, `git diff --check`, and a tracked-secret scan; fix concrete failures. Perform a whole-branch review against the spec and security boundaries, then repeat affected checks only.
- [ ] Use disposable test accounts/data to verify text and photo publication, a real Gemini generation, saved prompts, vote transitions, comments, cross-user denial and private avatars. Do not fabricate personal profile information.
- [ ] Commit and push the feature branch, deploy to the existing Vercel project, disable Deployment Protection, and wait for Ready status tied to the final commit.
- [ ] Verify the exact deployment from an unauthenticated browser: feed/detail accessible, protected creation redirects, anonymous generation/mutations denied, both languages work, homepage still shows title/location only.
- [ ] Record evidence, final commit and commit-specific deployment URL. Clearly report any credential/login blocker and PM feedback still awaiting the actual Feedback Group session.
