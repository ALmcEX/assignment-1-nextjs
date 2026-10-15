import { getMemeSeed } from "@/src/lib/memes/queries";
import { notFound } from "next/navigation";
import { RantDetail } from "@/src/components/rants/rant-detail";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { getRant, parsePage } from "@/src/lib/rants/queries";
import { getCatSeed } from "@/src/lib/cats/queries";
export default async function RantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comments?: string }>;
}) {
  const { id } = await params;
  const client = await createServerSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const rant = await getRant(
    client,
    id,
    user?.id,
    parsePage((await searchParams).comments),
  );
  if (!rant) notFound();
  let seed = null;
  if (user && rant.ai_image_path) {
    try {
      seed = await getCatSeed(client, id);
    } catch {
      /* Reading optional own parameters must not hide a published work. */
    }
  }
  let memeSeed = null;
  if (user && rant.meme_template) {
    try {
      memeSeed = await getMemeSeed(client, id);
    } catch {
      /* Optional owner reuse must not hide a published meme. */
    }
  }
  return (
    <RantDetail
      rant={rant}
      user={user}
      canReuse={!!memeSeed}
      breed={seed?.breed}
      style={seed?.style}
    />
  );
}
