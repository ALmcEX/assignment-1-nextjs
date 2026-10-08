# Assignment 4 verification — 2026-10-08

## Implemented

CITY / VENT extends Assignment 3 with a Columbia / NYC rant board, title-and-location-only feed, full detail pages, optional photos, authenticated publishing / voting / comments, AI cat image generation with stored original prompts and outputs (off pending owner billing activation), and English / Simplified Chinese settings. Six AI-authored example posts are seeded without fabricated authors or votes.

## Confirmed

- Vitest: 85 passing tests across 18 files, including auth checks, vote mutations, failure preservation, pending request handling, pagination, language persistence and photo controls.
- ESLint and production build: exit 0 with Next.js 16.4.0.
- Production dependency audit: zero vulnerabilities. Development dependency advisories remain; no forced framework downgrade.
- Live Supabase SQL permission suite: PASS, with all fixtures rolled back. Anonymous writes, identity spoofing, invalid votes, foreign generation / photo association and quota misuse are denied. The suite is sequential, not a multi-connection load test.
- All seven public tables report `relrowsecurity = true`: courses, profiles, rants, rant_votes, rant_comments, ai_generations and ai_generation_usage.
- All four Assignment 4 migrations were applied to the existing project, including pagination and explicit anonymous vote-function revocation.
- Browser: public deployed homepage loads, six titles and locations display, Chinese interface switch works, and detail pages show the example body / AI label / comments with a guest sign-in prompt.
- Browser: guest publication redirects to a sign-in prompt; existing Google account signs in on localhost and can access the Chinese publication form. Profile and publication photo controls use site-language labels.
- Browser: latest preview Google login originally fell back to the old Site URL; adding its exact callback fixed it. Authenticated upvote, switch to downvote and repeat-to-remove were verified; final vote counts were restored to zero.
- Vercel: Require Log In is unchecked, so deployment protection is already disabled. Git integration produced a Ready preview deployment.

## Remaining verification and configuration

`GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are now configured as Secret variables in Vercel Production and Preview, with explicit user authorization. Local development still has only the public Supabase variables. No credentials are stored in source control.

Live provider verification is blocked by Google capacity errors: direct authenticated requests to Gemini 3.8 Flash and 3.5 Flash-Lite returned HTTP 503 / UNAVAILABLE; the recommended Interactions API also returned 503 / service_unavailable. No successful generated result or published Gemini post is claimed. A separate HTTP 400 revealed that the REST structured-output MIME field requires `APPLICATION_JSON`; that contract is fixed and covered by a regression test. Server diagnostics record only the failure stage and HTTP status, never prompts or API response bodies.

During UI configuration, two tool outputs inadvertently displayed credentials. The user was notified and advised to rotate them themselves. The final deployment must be updated if the user rotates either key. No automatic credential rotation or paid billing was performed.

Manual end-to-end photo publishing and comment posting have not been performed against the live site. Their client mutations and database permission paths are covered by unit and rollback SQL tests. The browser viewport override did not change the connected tab's effective width; mobile menu behavior has a regression test, but an actual narrow-screen check remains.

PM feedback has not been received. Collect it at the feedback session and record actual changes afterward. The submission form itself has not been submitted.


## Cat image revision

The owner approved cat image code/UI first, with real generation deferred until they enable billing. Text drafting was replaced by six cat breeds and three art styles; authored text is preserved. Cat/paw/yarn vectors decorate the interface. `GEMINI_IMAGE_ENABLED` defaults to false, including a disabled button and localized explanation. Private image storage and ownership-derived publication use migration `20261008000004`; live application and rollback SQL validation remain pending while Chrome access is unavailable. The older detail schema is supported during this rollout. See `docs/ai-cat-images.md` for activation steps and verification boundaries.

Local revision verification: 93 tests across 19 files passed; ESLint and production build exited 0. Independent image-flow review found no material correctness/security issue. Paid provider calls were not made.
