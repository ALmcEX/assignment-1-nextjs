import { MemeFeed } from "@/src/components/memes/meme-feed";
import { getCats } from "@/src/lib/cats/queries";
import { parseCatFilters } from "@/src/lib/cats/filters";
import type { CatFeedItem } from "@/src/lib/cats/types";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    window?: string;
    page?: string;
    auth?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = parseCatFilters(params);
  const client = await createServerSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  let items: CatFeedItem[] = [];
  let hasMore = false;
  let hasError = false;
  try {
    ({ items, hasMore } = await getCats(client, filters));
  } catch {
    hasError = true;
  }
  return (
    <MemeFeed
      items={[]}
      imageItems={items}
      filters={filters}
      user={user}
      hasMore={hasMore}
      hasError={hasError}
      authRequired={params.auth === "required"}
    />
  );
}
