import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { RantForm } from '@/src/components/rants/rant-form';
export default async function NewRant(){const client=await createServerSupabaseClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect('/?auth=required');return <RantForm imageEnabled={process.env.GEMINI_IMAGE_ENABLED==='true'&&!!process.env.GEMINI_API_KEY&&!!process.env.SUPABASE_SERVICE_ROLE_KEY}/>;}
