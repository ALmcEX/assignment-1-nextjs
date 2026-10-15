import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemeTemplate } from "./types";
export async function resolveMemePhoto(client: SupabaseClient, template: MemeTemplate): Promise<MemeTemplate> {
  if (template?.id !== "uploaded" || !template.storagePath) return template;
  try {
    const { data, error } = await client.storage.from("caption-photos").createSignedUrl(template.storagePath, 3600);
    if (error || !data?.signedUrl) return { ...template, imageUrl: "", imageError: true };
    return { ...template, imageUrl: data.signedUrl, imageError: false };
  } catch { return { ...template, imageUrl: "", imageError: true }; }
}
