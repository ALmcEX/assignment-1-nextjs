# CatCanvas

A bilingual cat-image creation and voting app, iterated from the previous CITY / VENT assignment. Users describe an idea, choose a cat and a style, review the generated image, and publish it for community voting. Personal galleries and prompt reuse support returning to earlier ideas.

## Current stage

The redesign is implemented with image generation disabled by default. Original SVG illustrations at `/?samples=1` demonstrate the layout; they are explicitly labeled interface samples and never enter the live ranking or voting tables. Empty and failed live queries have separate states. No provider success, PM feedback, or assignment submission is implied.

## Routes

- `/`: live image gallery, 8 works per page, latest/popular and New York publication windows.
- `/?samples=1`: original preview illustrations, no fabricated accounts or votes.
- `/create`: protected studio with cat/style controls and account-scoped local drafts.
- `/my-cats`: protected personal gallery and owned prompt reuse.
- `/rants/[id]`: stable public detail address for new images and historical text posts.
- `/courses`, `/profile`, `/dashboard`: previous assignments retained.

Visitors can browse. Publishing, voting, commenting and private prompt access require authentication; database RLS and trusted generation references enforce ownership.

## Development

Use the existing `.env.local` containing public Supabase configuration, following `.env.example`. Keep private credentials out of Git and browser bundles.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Read `AGENTS.md` and the installed Next.js documentation before changing framework integration. The implementation uses the existing versions and adds no runtime dependencies.

## Database

Apply existing migrations in order after checking the target project's state. The image migration is `20261008000004_ai_cat_images.sql`; the gallery migration is `20261014000000_cat_rating.sql`. Do not blindly rerun an already-applied migration. Rollback role/ownership suites live under `supabase/tests/`.

Public gallery RPCs return public image metadata and aggregate votes. Private prompts and system instructions remain owner-only. `publish_cat_image` accepts an owned generation ID, derives the scene from the saved generation, and lets the existing trigger derive the storage path. Original text posts are preserved and excluded from image rankings.

## AI activation

See `docs/ai-cat-images.md`. Keep `GEMINI_IMAGE_ENABLED` absent or false until the owner authorizes provider configuration, billing and a live test budget. Successful local mocks and permission tests are not proof of a working provider. Do not expose service keys in logs, browser code or copied diagnostics.

## Verification and delivery

See `docs/cat-rating-verification.md` for this iteration's actual checks and remaining live steps. The assignment needs a Vercel deployment URL verified against a concrete Git SHA, rather than only the mutable branch or production alias.
