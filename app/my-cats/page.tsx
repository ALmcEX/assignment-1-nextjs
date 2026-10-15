import { redirect } from "next/navigation";
import { MyCats } from "@/src/components/cats/my-cats";
import { getCats } from "@/src/lib/cats/queries";
import { parseCatFilters } from "@/src/lib/cats/filters";
import type { CatFeedItem } from "@/src/lib/cats/types";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
export default async function MyCatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/?auth=required");
  const filters = parseCatFilters({ page: (await searchParams).page });
  let items: CatFeedItem[] = [];
  let hasMore = false;
  let hasError = false;
  try {
    ({ items, hasMore } = await getCats(client, filters, true));
  } catch {
    hasError = true;
  }
  return (
    <MyCats
      items={items}
      user={user}
      page={filters.page}
      hasMore={hasMore}
      hasError={hasError}
    />
  );
}
