# CatCanvas

A bilingual cat meme creation and voting app. Choose an existing meme, describe a moment, generate an AI caption, preview and publish it. Personal galleries, owned scene reuse and recent popular lists support returning with new ideas.

## Routes

- `/`: verified published AI-captioned memes; 8 works/page, latest/popular, New York publication windows.
- `/create`: protected template picker, scene, English/Chinese caption language, account-scoped device draft, preview and publication.
- `/my-cats`: protected personal meme gallery and owned scene/template reuse.
- `/rants/[id]`: stable detail URL, meme attribution, voting/comments; historical text and image posts remain readable.
- `/courses`, `/profile`, `/dashboard`: previous assignments retained.

Original illustration samples and `?samples=1` preview behavior were removed. Existing template images are attributed to Imgflip; the AI-generated medium is the caption, not the photograph. No fake community posts or votes are created.

## Development

Use `.env.example` and the existing Supabase project. Keep private keys out of Git, browser bundles, URLs and logs.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Read `AGENTS.md` and installed Next.js docs before framework changes. No additional product dependencies were added for this iteration.

## Database and privacy

Apply migrations in order after checking the intended project's schema; do not blindly replay existing migrations. The meme migrations are `supabase/migrations/20261014000001_meme_captions.sql` and `20261015000000_meme_quota_clock.sql`. SQL permission suites in `supabase/tests/` roll back their fixtures.

Generation prompts/system instructions remain owner-readable. The public post stores the scene, caption and template snapshot that were actually generated. Publication validates ownership and copies trusted metadata; clients cannot create provider records or forge AI attribution. Existing votes retain add/switch/cancel semantics; generation/publication/voting/comments require login on the server and in RLS.

## Free-tier caption configuration

1. In Google AI Studio verify `Default Gemini Project` (`gen-lang-client-0496703209`) is **Free**. Use its existing key for the intended Vercel **Preview** environment; the owner enters and saves credentials personally. Do not send keys in chat.
2. Keep server-only `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` configured in Vercel. Only after key/project verification, add the non-secret `GEMINI_TEXT_ENABLED=true` to Preview and deploy again. The adapter pins `gemini-3.1-flash-lite`; the documented model variable is descriptive, not permission to change to a paid model.
3. Keep `GEMINI_IMAGE_ENABLED` absent/false. No billing activation, search tools, paid Imgflip AI endpoint, or paid fallback is part of this release.
4. Complete a real caption → saved preview → publish → guest detail → vote test before describing the API as connected.

Each account has 10 successful generations per New York day. The app globally caps provider attempts at 10 per rolling minute / 400 per Pacific day, including failures; other applications sharing the Google project can still exhaust its quota. A failed request releases the user reservation, retains the previous candidate and never automatically retries. Changing form parameters does not change the original candidate's publication metadata.

The template catalog uses verified source metadata and a cached free Imgflip lookup. Published snapshots do not change when the catalog changes. Images depend on external sources; failed images have a retry action and captions stay readable.

## Verification and delivery

See `docs/meme-caption-verification.md` for actual results and pending live steps. Deliver the unique Vercel URL verified against the product commit SHA, not a mutable alias. Product Manager / Feedback Group feedback and course submission are not implied by deployment.
