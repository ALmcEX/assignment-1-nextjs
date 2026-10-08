import { RantFeed } from '@/src/components/rants/rant-feed';
import { getRants,parsePage } from '@/src/lib/rants/queries';
import type { RantSummary } from '@/src/lib/rants/types';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
export default async function Home({searchParams}:{searchParams:Promise<{sort?:string;auth?:string;page?:string}>}) {
 const params=await searchParams;const sort=params.sort==='popular'?'popular':'latest';const client=await createServerSupabaseClient();
 const page=parsePage(params.page);let rants:RantSummary[]=[];let hasError=false;let hasMore=false;try{const result=await getRants(client,sort,page);rants=result.rants;hasMore=result.hasMore;}catch{hasError=true;}
 return <RantFeed rants={rants} sort={sort} page={page} hasMore={hasMore} hasError={hasError} authRequired={params.auth==='required'}/>;
}
