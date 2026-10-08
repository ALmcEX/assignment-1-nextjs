import { notFound } from 'next/navigation';
import { RantDetail } from '@/src/components/rants/rant-detail';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { getRant } from '@/src/lib/rants/queries';
export default async function RantPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const client=await createServerSupabaseClient();const {data:{user}}=await client.auth.getUser();const rant=await getRant(client,id,user?.id);if(!rant)notFound();return <RantDetail rant={rant} user={user}/>;}
