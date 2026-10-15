import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { getCatSeed } from "@/src/lib/cats/queries";
import { CatComposer } from "@/src/components/cats/cat-composer";
import type { CatSeed } from "@/src/lib/cats/types";
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
  let seed: CatSeed | undefined;
  let unavailable = false;
  if (reuse) {
    try {
      seed = (await getCatSeed(client, reuse)) ?? undefined;
      unavailable = !seed;
    } catch {
      unavailable = true;
    }
  }
  return (
    <>
      <CatComposer
        key={`${user.id}:${reuse ?? ""}`}
        userId={user.id}
        seed={seed}
        imageEnabled={
          process.env.GEMINI_IMAGE_ENABLED === "true" &&
          !!process.env.GEMINI_API_KEY &&
          !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      />
      {unavailable ? <ReuseUnavailable /> : null}
    </>
  );
}
import { ReuseUnavailable } from "@/src/components/cats/reuse-unavailable";
