# City Vent — Design for AI Assignment 4

A bilingual Columbia / NYC rant board. Visitors browse a feed containing only titles and locations, then open a post to read its body, optional photo, votes and comments. Google sign-in is required to publish, upload, vote, comment or generate an AI draft. English and Simplified Chinese settings persist in the browser.

## Setup

1. `npm ci` and copy `.env.example` to `.env.local`.
2. Configure the existing Supabase URL and anon key. Add `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` **only on the server**. `GEMINI_MODEL` is configurable.
3. Apply the migrations in `supabase/migrations/` in timestamp order. The original course table must already exist. The seed migration inserts six clearly marked AI examples and their actual original prompts; it does not invent users, votes or comments.
4. `npm run dev` and open `http://localhost:3000`.

Never commit `.env.local` or secrets. For Vercel, configure the same variables in the appropriate deployment environments and redeploy.

## Features and security

- Posts require title, location and body, with an optional JPEG / PNG / WebP photo up to 5 MB.
- AI drafts use Gemini, retain the original user prompt, system prompt and original output, and remain editable before publication. A generation is saved before being returned to the editor.
- Each user can cast one upvote or downvote per post. Repeating a vote removes it; choosing the other changes it. PostgreSQL serializes mutations for that user / post.
- AI generation allows ten successful drafts per New York calendar day, with a reserved request token to prevent overlapping requests and avoid charging failed requests against the allowance.
- RLS is enabled on every public table. Public feed and comments expose limited columns; owner identifiers and unpublished AI prompts are private. Client inserts must match `auth.uid()`. Server quota functions are service-role only.
- Rant photos are intentionally public content; avatar files are private and displayed through short-lived signed URLs. Storage writes are restricted to the owner's folder.
- Feed and comment pagination keep older content accessible.

## Authentication and deployment

Keep the Google provider configured in Supabase Auth. Allow `/auth/callback` for localhost, production and the exact deployment domain. The app reuses the existing authentication, profiles and protected dashboard; the original course catalog is at `/courses`.

Disable Vercel deployment protection for the submitted deployment so visitors can browse without a Vercel account. Application sign-in still protects mutations. Submit the **commit-specific deployment URL**, rather than the moving production alias.

## Verification

```sh
npm test
npm run lint
npm run build
npm audit --omit=dev
```

Run `supabase/tests/rant_permissions.sql` in the SQL editor. It creates transactional fixtures and rolls them back, checking guest rejection, ownership, private generation access, vote insert / change / removal, invalid values and quota reservation behavior. It is not a parallel load test.

Before submission, verify Google login and logout, both languages, mobile navigation, optional photo upload, live Gemini generation, voting and comments in the deployed app. Record actual PM feedback after the feedback group; no PM feedback is assumed in this implementation.
