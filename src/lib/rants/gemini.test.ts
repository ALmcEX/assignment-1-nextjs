import {afterEach,expect,test,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {generateDraft} from './gemini';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
test('provider failure exposes only its HTTP status for server diagnostics',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test-secret');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{message:'private provider details'}}),{status:429})));
 await expect(generateDraft({prompt:'a fictional washing machine',location:'Dorm',language:'en'})).rejects.toThrow('Gemini HTTP 429');
});
