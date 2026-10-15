import { resolveMemePhoto } from "./photo-url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../rants/validation";
import type { CatFilters } from "../cats/types";
import type { MemeFeedItem, MemeSeed } from "./types";
export async function getMemes(
  client: SupabaseClient,
  filters: CatFilters,
  mine = false,
): Promise<{ items: MemeFeedItem[]; hasMore: boolean }> {
  const { data, error } = await client.rpc("meme_feed_page", {
    p_sort: filters.sort,
    p_window: filters.window,
    p_offset: (filters.page - 1) * 8,
    p_mine: mine,
  });
  if (error) throw error;
  const rows = (data ?? []) as MemeFeedItem[];
  return { items: await Promise.all(rows.slice(0, 8).map(async item => ({ ...item, template: await resolveMemePhoto(client, item.template) }))), hasMore: rows.length > 8 };
}
export async function getMemeSeed(
  client: SupabaseClient,
  id: string,
): Promise<MemeSeed | null> {
  if (!isUuid(id)) return null;
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) return null;
  const { data: post, error } = await client
    .from("rants")
    .select("generation_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!post?.generation_id) return null;
  const { data: g, error: gError } = await client
    .from("ai_generations")
    .select("prompt,language,purpose,meme_template")
    .eq("id", post.generation_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (gError) throw gError;
  if (g?.purpose !== "meme_caption") return null;
  return {
    prompt: g.prompt,
    templateId: g.meme_template.id === "uploaded" ? "405658" : g.meme_template.id,
    ...(g.meme_template.id === "uploaded" ? { photoGenerationId: post.generation_id, photoTemplate: await resolveMemePhoto(client, g.meme_template) } : {}),
    language: g.language,
  };
}
