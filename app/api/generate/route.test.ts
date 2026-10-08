import {afterEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({user:null as {id:string}|null}));
vi.mock('@/src/lib/supabase/server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user},error:null})}})}));
vi.mock('@/src/lib/supabase/admin',()=>({createAdminSupabaseClient:()=>{throw new Error('Admin must not be touched');}}));
vi.mock('@/src/lib/rants/gemini',()=>({generateDraft:()=>{throw new Error('Provider must not be called');}}));
import {POST} from './route';
afterEach(()=>{state.user=null;vi.unstubAllEnvs();});
it('denies guest image requests before any provider or admin work',async()=>{const response=await POST(new Request('https://app.example/api/generate',{method:'POST',headers:{origin:'https://app.example'}}));expect(response.status).toBe(401);});
it('keeps paid image generation disabled even when both secrets are configured',async()=>{state.user={id:'user'};vi.stubEnv('GEMINI_API_KEY','test');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');vi.stubEnv('GEMINI_IMAGE_ENABLED','false');const response=await POST(new Request('https://app.example/api/generate',{method:'POST',headers:{origin:'https://app.example'}}));expect(response.status).toBe(503);expect(await response.json()).toEqual({error:'aiUnavailable'});});
