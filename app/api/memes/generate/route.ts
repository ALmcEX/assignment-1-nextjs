import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createMemeDraft,
  validateMemeSeed,
} from "@/src/lib/memes/generation-service";
import { generateMemeCaption } from "@/src/lib/memes/gemini";
import { RantError } from "@/src/lib/rants/validation";
export const maxDuration = 60;
function rpcError(error: { message?: string }): never {
  const key = ["quotaExceeded", "generationBusy", "invalidText"].find((k) =>
    error.message?.includes(k),
  );
  throw new RantError(key ?? "aiFailed");
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
    if (Number(request.headers.get("content-length") ?? 0) > 16000)
      throw new RantError("invalidText");
    const body = await request.text();
    if (body.length > 16000) throw new RantError("invalidText");
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new RantError("invalidText");
    }
    const seed = validateMemeSeed(parsed);
    const admin = createAdminSupabaseClient();
    const result = await createMemeDraft(user.id, seed, {
      configured: true,
      generate: generateMemeCaption,
      reserveUser: async (id) => {
        const { data, error } = await admin.rpc("reserve_ai_generation", {
          p_user_id: id,
        });
        if (error) rpcError(error);
        return data as string;
      },
      releaseUser: async (id, token) => {
        const { error } = await admin.rpc("release_ai_generation", {
          p_user_id: id,
          p_token: token,
        });
        if (error) rpcError(error);
      },
      reserveAttempt: async () => {
        const { error } = await admin.rpc("reserve_meme_attempt");
        if (error) rpcError(error);
      },
      save: async (d) => {
        const { data, error } = await admin.rpc("finish_meme_caption", {
          p_user_id: d.userId,
          p_token: d.token,
          p_prompt: d.seed.prompt,
          p_system_prompt: d.systemPrompt,
          p_language: d.seed.language,
          p_model: d.model,
          p_caption: d.caption,
          p_template: d.template,
        });
        if (error) rpcError(error);
        return data as string;
      },
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const key = error instanceof RantError ? error.key : "aiFailed";
    return Response.json(
      { error: key },
      {
        status: ["quotaExceeded", "generationBusy"].includes(key)
          ? 429
          : key === "invalidText"
            ? 400
            : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
