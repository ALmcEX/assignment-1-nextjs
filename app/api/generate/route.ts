import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';
import { createDraft, type DraftInput } from '@/src/lib/rants/generation-service';
import { generateDraft } from '@/src/lib/rants/gemini';
import { RantError } from '@/src/lib/rants/validation';
export const maxDuration = 120;
export async function POST(request: Request) {
 if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'signInRequired'},{status:403});
 const client = await createServerSupabaseClient(); const {data:{user},error} = await client.auth.getUser();
 if (error || !user) return Response.json({error:'signInRequired'},{status:401});
 // Enable only after the owner has activated billing and approved a test budget.
 if (process.env.GEMINI_IMAGE_ENABLED !== 'true' || !process.env.GEMINI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({error:'aiUnavailable'},{status:503});
 try {
  if (Number(request.headers.get('content-length') ?? 0) > 16000) throw new RantError('invalidText');
  const text = await request.text(); if (text.length > 16000) throw new RantError('invalidText');
  const input = JSON.parse(text) as DraftInput; if (!input || typeof input !== 'object') throw new RantError('invalidText');
  const admin = createAdminSupabaseClient();
  const result = await createDraft(user.id,input,{
   configured:true, generate:generateDraft,
   reserve:async id => { const {data,error} = await admin.rpc('reserve_ai_generation',{p_user_id:id}); if (error) { console.error('AI reservation failure',{code:error.code}); throw new RantError(error.message.includes('quotaExceeded') ? 'quotaExceeded' : error.message.includes('generationBusy') ? 'generationBusy' : 'aiFailed'); } return data as string; },
   release:async (id,token) => { const {error} = await admin.rpc('release_ai_generation',{p_user_id:id,p_token:token}); if (error) throw error; },
   upload:async (id,image,mimeType) => { const ext = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mimeType]; if (!ext) throw new Error('aiFailed'); const path = `${id}/${crypto.randomUUID()}.${ext}`; const {error} = await admin.storage.from('ai-cat-images').upload(path,image,{contentType:mimeType,upsert:false}); if (error) throw error; return path; },
   remove:async path => { const {error} = await admin.storage.from('ai-cat-images').remove([path]); if (error) throw error; },
   preview:async path => { const {data,error} = await admin.storage.from('ai-cat-images').createSignedUrl(path,3600); if (error || !data) throw error ?? new Error('aiFailed'); return data.signedUrl; },
   save:async d => { const {data,error} = await admin.rpc('finish_ai_cat_image',{p_user_id:d.userId,p_token:d.token,p_prompt:d.prompt,p_system_prompt:d.systemPrompt,p_language:d.language,p_model:d.model,p_image_path:d.imagePath,p_mime_type:d.mimeType,p_breed:d.breed,p_style:d.style}); if (error) throw error; return data as string; },
  });
  return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 } catch (error) { const key = error instanceof RantError ? error.key : 'aiFailed'; return Response.json({error:key},{status:key === 'quotaExceeded' || key === 'generationBusy' ? 429 : key === 'invalidText' ? 400 : 502}); }
}
