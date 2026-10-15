import { CatFeed } from "@/src/components/cats/cat-feed";
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
    samples?: string;
    auth?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = parseCatFilters(params);
  const client = await createServerSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const showSamples = params.samples === "1";
  let items: CatFeedItem[] = [];
  let hasMore = false;
  let hasError = false;
  if (!showSamples)
    try {
      ({ items, hasMore } = await getCats(client, filters));
    } catch {
      hasError = true;
    }
  return (
    <CatFeed
      items={items}
      filters={filters}
      user={user}
      hasMore={hasMore}
      hasError={hasError}
      showSamples={showSamples}
      authRequired={params.auth === "required"}
    />
  );
}
