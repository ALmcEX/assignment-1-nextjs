# Assignment 4 verification — 2026-10-08

## Implemented

CITY / VENT extends Assignment 3 with a Columbia / NYC rant board, title-and-location-only feed, full detail pages, optional photos, authenticated publishing / voting / comments, Gemini drafts with stored original prompts and outputs, and English / Simplified Chinese settings. Six AI-authored example posts are seeded without fabricated authors or votes.

## Confirmed

- Vitest: 83 passing tests across 17 files, including auth checks, vote mutations, failure preservation, pending request handling, pagination, language persistence and photo controls.
- ESLint and production build: exit 0 with Next.js 16.4.0.
- Production dependency audit: zero vulnerabilities. Development dependency advisories remain; no forced framework downgrade.
- Live Supabase SQL permission suite: PASS, with all fixtures rolled back. Anonymous writes, identity spoofing, invalid votes, foreign generation / photo association and quota misuse are denied. The suite is sequential, not a multi-connection load test.
- All seven public tables report `relrowsecurity = true`: courses, profiles, rants, rant_votes, rant_comments, ai_generations and ai_generation_usage.
- All four Assignment 4 migrations were applied to the existing project, including pagination and explicit anonymous vote-function revocation.
- Browser: public deployed homepage loads, six titles and locations display, Chinese interface switch works, and detail pages show the example body / AI label / comments with a guest sign-in prompt.
- Browser: guest publication redirects to a sign-in prompt; existing Google account signs in on localhost and can access the Chinese publication form. Profile and publication photo controls use site-language labels.
- Vercel: Require Log In is unchecked, so deployment protection is already disabled. Git integration produced a Ready preview deployment.

## Remaining verification and configuration

`GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` were absent from both local and Vercel configuration at the time of verification. The live AI provider flow is therefore not yet verified. Configure both as server environment variables, redeploy, then verify a generated draft and its saved original prompt / output. Never put these keys in client code or Git.

Manual end-to-end photo publishing and comment posting have not been performed against the live site. Their client mutations and database permission paths are covered by unit and rollback SQL tests. The browser viewport override did not change the connected tab's effective width; mobile menu behavior has a regression test, but an actual narrow-screen check remains.

PM feedback has not been received. Collect it at the feedback session and record actual changes afterward. The submission form itself has not been submitted.
