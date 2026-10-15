import {afterEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({user:null as {id:string}|null}));
vi.mock('@/src/lib/supabase/server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user},error:null})}})}));
vi.mock('@/src/lib/supabase/admin',()=>({createAdminSupabaseClient:()=>{throw new Error('Admin must not be touched');}}));
import {POST} from './route';
afterEach(()=>{state.user=null;vi.unstubAllEnvs();});
function request(body='{}',origin='https://app.example'){return new Request('https://app.example/api/memes/generate',{method:'POST',headers:{origin},body});}
it('denies cross origin and guests',async()=>{expect((await POST(request('{}','https://evil.example'))).status).toBe(403);expect((await POST(request())).status).toBe(401);});
it('keeps text generation disabled until configured',async()=>{state.user={id:'owner'};expect((await POST(request())).status).toBe(503);});
it.each(['null','{','x'.repeat(16001)])('rejects malformed body before admin',async(body)=>{state.user={id:'owner'};vi.stubEnv('GEMINI_TEXT_ENABLED','true');vi.stubEnv('GEMINI_API_KEY','test');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');expect((await POST(request(body))).status).toBe(400);});
