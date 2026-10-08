import { notFound } from 'next/navigation';
import { RantDetail } from '@/src/components/rants/rant-detail';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { getRant,parsePage } from '@/src/lib/rants/queries';
export default async function RantPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{comments?:string}>}){const {id}=await params;const client=await createServerSupabaseClient();const {data:{user}}=await client.auth.getUser();const rant=await getRant(client,id,user?.id,parsePage((await searchParams).comments));if(!rant)notFound();return <RantDetail rant={rant} user={user}/>;}
