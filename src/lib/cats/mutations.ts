import type { SupabaseClient } from "@supabase/supabase-js";
import { RantError, isUuid } from "../rants/validation";
export function optionalCatText(value: unknown, max = 120): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || [...value.trim()].length > max)
    throw new RantError("invalidText");
  return value.trim();
}
export async function publishCat(
  client: SupabaseClient,
  input: { generationId: string; title?: string; location?: string; caption?: string },
): Promise<{ id: string }> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new RantError("signInRequired");
  if (!isUuid(input.generationId)) throw new RantError("invalidText");
  const { data, error } = await client.rpc("publish_cat_image_with_caption", {
    p_generation_id: input.generationId,
    p_title: optionalCatText(input.title),
    p_caption: optionalCatText(input.caption, 1000),
    p_location: optionalCatText(input.location),
  });
  if (error || !data)
    throw new RantError(
      error?.message?.includes("invalidText")
        ? "invalidText"
        : "mutationFailed",
    );
  return { id: data };
}
