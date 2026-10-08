# AI cat images

## Approved change

Replace AI text drafting with cat image generation on the existing rant publication form. The user writes the title, location and body. They choose a cat (orange, tabby, ragdoll, British shorthair, tuxedo or calico), a style (photography, illustration or clay) and a scene. The image can be previewed, replaced or detached before publication. A user photo can also be uploaded independently. Homepage entries remain title/location only; published cat images appear on the existing detail page with votes and comments.

The shared interface includes original SVG cat, paw and yarn illustrations, a warm cream/peach/sage palette and English/Simplified Chinese copy. Decorations are not presented as generated user images.

## Storage and security

- `ai-cat-images` is a private bucket. Authors can read their own drafts; guests can read images associated with published rants.
- Only the server can upload outputs or call `finish_ai_cat_image`.
- The publication trigger derives the image path from an owned generation. The browser cannot choose another user's image path.
- Original scene prompt, system prompt, model, breed, style, MIME type and output path are stored in the existing owner-readable generation table.
- Successful generation consumes one of the existing ten daily slots. Failed generation/upload/signing/persistence releases the reservation and attempts upload cleanup.
- Signed previews and published image URLs last one hour. Visiting a detail page obtains a fresh URL.
- Existing text examples remain labeled as AI examples; no synthetic votes, users or successful Gemini images are fabricated.

## Activation after billing

The owner approved finishing code/UI first and waiting for them to enable billing. Generation is off by default at both server and UI layers.

1. Apply `supabase/migrations/20261008000004_ai_cat_images.sql` to the existing Supabase project. Run `supabase/tests/ai_cat_permissions.sql`; its fixtures roll back. Keep the existing permission suite passing.
2. The owner enables Google image-model billing and approves a live-test budget. Default model: `gemini-3.1-flash-lite-image`; override with `GEMINI_IMAGE_MODEL` if necessary. Do not enable billing automatically.
3. Set `GEMINI_IMAGE_ENABLED=true` in the existing Vercel project's intended environment, keep its server-only `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`, and redeploy. Test one approved generation, original-prompt persistence, publish association, guest visibility and voting.

Until activation the form clearly says cat generation is not enabled, disables its generation button, and still permits authored posts and uploads. The API makes no paid provider call with the flag absent/false. Existing detail pages tolerate the additive image column being absent during deployment.

## Verification scope

Tests cover binary-output selection, text-only refusal, image MIME/signature/size checks, private upload/save/preview sequencing, failure cleanup, quota release, safe diagnostics, preservation of authored text and previous image on replacement failure, removal, disabled paid calls and disabled UI, signed published image loading, and staged schema compatibility.

Live migration, live SQL suite, browser layout verification and paid-provider success require working browser access and, for generation, owner billing activation. Do not describe these as verified before they occur.

Official references: [image generation](https://ai.google.dev/gemini-api/docs/generate-content/image-generation), [pricing](https://ai.google.dev/gemini-api/docs/pricing).
