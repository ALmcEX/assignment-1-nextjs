import {getMemeTemplates} from '@/src/lib/memes/templates';
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { getMemeSeed } from "@/src/lib/memes/queries";
import { MemeComposer } from "@/src/components/memes/meme-composer";
import type { MemeSeed } from "@/src/lib/memes/types";
export default async function CreateCat({
  searchParams,
}: {
  searchParams: Promise<{ reuse?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/?auth=required");
  const { reuse } = await searchParams;
  let seed: MemeSeed | undefined;
  let unavailable = false;
  if (reuse) {
    try {
      seed = (await getMemeSeed(client, reuse)) ?? undefined;
      unavailable = !seed;
    } catch {
      unavailable = true;
    }
  }
  return (
    <>
      <MemeComposer
        key={`${user.id}:${reuse ?? ""}`}
        userId={user.id}
        seed={seed}
        templates={await getMemeTemplates()}
        textEnabled={
          process.env.GEMINI_TEXT_ENABLED === "true" &&
          !!process.env.GEMINI_API_KEY &&
          !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      />
      {unavailable ? <ReuseUnavailable /> : null}
    </>
  );
}
import { ReuseUnavailable } from "@/src/components/cats/reuse-unavailable";
