# AI image test activation — 2026-10-15

Owner approved the existing input → cat image → publish/vote flow and a $5 total test budget. The image studio is `/create/image`, public image gallery `/images`, personal image gallery `/my-images`. Existing meme captions remain available.

## Cost isolation

Use a separate Google image-test project and server-only `GEMINI_IMAGE_API_KEY`. Keep the existing free caption project's `GEMINI_API_KEY` unchanged; older deployments still use it. Never fall back to the caption key. Owner must personally complete billing/payment confirmation and save the new secret in Vercel **Preview**. No raw key belongs in source, logs, chat or evidence.

Pinned model `gemini-3.1-flash-lite-image`: one 1K square image, candidateCount1, maxOutputTokens4096, no tools, no retries, 90-second timeout. Official pricing checked 2026-10-15: image output $30/million tokens, 1120 tokens/1K image ($0.0336); text input $0.25/million, text/thinking output $1.50/million. Request input is bounded to1000 scene +120 location characters and a fixed cat system prompt. Even pricing all4096 output tokens at the higher image-token rate is approximately $0.123, plus bounded input. Reserve a conservative $0.50 per attempt.

Migration `20261015000001_image_test_budget.sql` persists a **lifetime10-attempt cap shared by all app users/deployments using this DB**. Atomic conditional update serializes admission. Timeouts, provider errors, and downstream save/upload failures are not refunded. Restarting/redeploying does not reset usage. Guests cannot invoke the RPC or read/write the table; only service_role can invoke admission. Missing migration fails closed before provider work. Per-user successful daily quota remains in addition.

This bounds image requests made through this app, not unrelated Google project use, taxes, currency conversions, or Google-required prepaid credit. Do not use the image-test key in other projects. Do not increase/reset the limit without new budget approval.

## Activation sequence

1. Apply migration and run `supabase/tests/image_test_budget.sql` (transaction rolls back all test requests).
2. Owner creates independent image-test project and enables billing. If minimum required prepayment exceeds $5, stop and report rather than charge it.
3. Owner saves `GEMINI_IMAGE_API_KEY` to Preview. Existing text key stays unchanged.
4. Set `GEMINI_IMAGE_ENABLED=true` in Preview only and deploy this commit. Production stays off.
5. Verify one real generation, persisted image preview, publication, signed-out gallery/detail, votes and owned reuse; record actual request count. Do not claim live generation before this passes.
6. Verify final commit-specific URL and its exact OAuth callback before submission.

## Verification status

Local tests174/174, lint/build and lifetime SQL budget + all existing SQL suites passed before deployment. Live image/provider verification pending owner billing and secret entry. No paid provider request has been made for this iteration at this point.

Sources: https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/generate-content/image-generation

## Owner configuration handoff

Owner reports image key saved (key name CatMeme). Native Chrome verification shows separate project CatMeme test (`gen-lang-client-0265715630`) at Tier1, while Default Gemini Project (`gen-lang-client-0496703209`) remains Free tier. Live provider acceptance and final OAuth callback remain pending; no provider success is claimed by this configuration note.
