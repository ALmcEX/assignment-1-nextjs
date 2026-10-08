import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { RantForm } from '@/src/components/rants/rant-form';
export default async function NewRant(){const client=await createServerSupabaseClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect('/?auth=required');return <RantForm/>;}
