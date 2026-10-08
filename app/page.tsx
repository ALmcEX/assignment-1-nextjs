import { RantFeed } from '@/src/components/rants/rant-feed';
import { getRants } from '@/src/lib/rants/queries';
import type { RantSummary } from '@/src/lib/rants/types';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
export default async function Home({searchParams}:{searchParams:Promise<{sort?:string;auth?:string}>}) {
 const params=await searchParams;const sort=params.sort==='popular'?'popular':'latest';const client=await createServerSupabaseClient();
 let rants:RantSummary[]=[];let hasError=false;try{rants=await getRants(client,sort);}catch{hasError=true;}
 return <RantFeed rants={rants} sort={sort} hasError={hasError} authRequired={params.auth==='required'}/>;
}
