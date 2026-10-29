import { withGenerationTelemetry } from "@/src/lib/observability/telemetry";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { createCaptionChoices } from "@/src/lib/memes/choice-service";
import { generateCaptionChoices } from "@/src/lib/memes/caption-choices";
import { RantError, isUuid } from "@/src/lib/rants/validation";
export const maxDuration = 60;
function databaseError(error: { message?: string }): never {
  throw new RantError(
    ["quotaExceeded", "generationBusy", "invalidText"].find((k) =>
      error.message?.includes(k),
    ) ?? "aiFailed",
  );
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "signInRequired" }, { status: 403 });
  const client = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user)
    return Response.json({ error: "signInRequired" }, { status: 401 });
  if (
    process.env.GEMINI_TEXT_ENABLED !== "true" ||
    !process.env.GEMINI_API_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return Response.json({ error: "aiUnavailable" }, { status: 503 });
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 3500000)
      throw new RantError("invalidPhoto");
    const body = await request.formData();
    const file = body.get("photo");
    if (
      file &&
      (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024)
    )
      throw new RantError("invalidPhoto");
    let photo =
      file instanceof File
        ? {
            bytes: new Uint8Array(await file.arrayBuffer()),
            mimeType: file.type,
          }
        : undefined;
    const admin = createAdminSupabaseClient();
    const reuseId = body.get("reuseGenerationId");
    if (reuseId && !photo && body.get("templateId") === "uploaded") {
      if (typeof reuseId !== "string" || !isUuid(reuseId))
        throw new RantError("invalidPhoto");
      const { data: generation, error } = await client
        .from("ai_generations")
        .select("meme_template,purpose")
        .eq("id", reuseId)
        .eq("user_id", user.id)
        .maybeSingle();
      const template = generation?.meme_template;
      if (
        error ||
        generation?.purpose !== "meme_caption" ||
        template?.id !== "uploaded" ||
        !template.storagePath?.startsWith(user.id + "/")
      )
        throw new RantError("invalidPhoto");
      const { data: image, error: downloadError } = await admin.storage
        .from("caption-photos")
        .download(template.storagePath);
      if (downloadError || !image) throw new RantError("invalidPhoto");
      photo = {
        bytes: new Uint8Array(await image.arrayBuffer()),
        mimeType: image.type,
      };
      body.set("width", String(template.width));
      body.set("height", String(template.height));
    }
    const result = await createCaptionChoices(
      user.id,
      {
        prompt: body.get("prompt"),
        templateId: body.get("templateId"),
        language: body.get("language"),
        photo,
        width: body.has("width") ? Number(body.get("width")) : undefined,
        height: body.has("height") ? Number(body.get("height")) : undefined,
      },
      {
        observe: (input, run) =>
          withGenerationTelemetry(
            admin,
            user.id,
            "caption_choices",
            input,
            run,
          ),
        reserve: async (id) => {
          const { data, error } = await admin.rpc("reserve_ai_generation", {
            p_user_id: id,
          });
          if (error) databaseError(error);
          return data as string;
        },
        release: async (id, token) => {
          const { error } = await admin.rpc("release_ai_generation", {
            p_user_id: id,
            p_token: token,
          });
          if (error) databaseError(error);
        },
        reserveAttempt: async () => {
          const { error } = await admin.rpc("reserve_meme_attempt");
          if (error) databaseError(error);
        },
        generate: generateCaptionChoices,
        upload: async (id, photo) => {
          const ext = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/webp": "webp",
          }[photo.mimeType];
          if (!ext) throw new RantError("invalidPhoto");
          const path = `${id}/${crypto.randomUUID()}.${ext}`;
          const { error } = await admin.storage
            .from("caption-photos")
            .upload(path, photo.bytes, {
              contentType: photo.mimeType,
              upsert: false,
            });
          if (error) throw new RantError("uploadFailed");
          return path;
        },
        remove: async (path) => {
          const { error } = await admin.storage
            .from("caption-photos")
            .remove([path]);
          if (error) throw new RantError("uploadFailed");
        },
        sign: async (path) => {
          const { data, error } = await admin.storage
            .from("caption-photos")
            .createSignedUrl(path, 3600);
          if (error || !data) throw new RantError("aiFailed");
          return data.signedUrl;
        },
        save: async (d) => {
          const { data, error } = await admin.rpc("finish_caption_choices", {
            p_user_id: d.userId,
            p_token: d.token,
            p_prompt: d.seed.prompt,
            p_system_prompt: d.systemPrompt,
            p_language: d.seed.language,
            p_model: d.model,
            p_captions: d.captions,
            p_template: d.template,
          });
          if (error) databaseError(error);
          return data as string;
        },
      },
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const key = e instanceof RantError ? e.key : "aiFailed";
    return Response.json(
      { error: key },
      {
        status: ["quotaExceeded", "generationBusy"].includes(key)
          ? 429
          : ["invalidText", "invalidPhoto"].includes(key)
            ? 400
            : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
