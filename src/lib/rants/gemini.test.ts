import {afterEach,expect,test,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {generateDraft} from './gemini';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
test('provider failure exposes only its HTTP status for server diagnostics',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test-secret');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{message:'private provider details'}}),{status:429})));
 await expect(generateDraft({prompt:'a fictional washing machine',location:'Dorm',language:'en'})).rejects.toThrow('Gemini HTTP 429');
});
test('structured output request uses the REST APPLICATION_JSON enum',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test-secret');
 const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({title:'A slow machine',body:'One minute has become a whole semester.'})}]}}]}),{status:200}));
 vi.stubGlobal('fetch',fetchMock);
 const result=await generateDraft({prompt:'a fictional washing machine',location:'Dorm',language:'en'});
 expect(result.title).toBe('A slow machine');
 expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig.responseFormat.text.mimeType).toBe('APPLICATION_JSON');
});
