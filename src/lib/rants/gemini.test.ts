import {afterEach,expect,test,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {generateDraft} from './gemini';
const input={prompt:'A cat waiting for a slow washing machine',location:'Dorm',language:'en' as const,breed:'orange' as const,style:'clay' as const};
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
test('provider failure exposes only its HTTP status',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test-secret');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{message:'private'}}),{status:429})));
 await expect(generateDraft(input)).rejects.toThrow('Gemini HTTP 429');
});
test('returns image bytes, requests an image model and constrains the subject to a cat',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test-secret');
 const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,inlineData:{mimeType:'image/png',data:'not-output'}},{inlineData:{mimeType:'image/png',data:png}}]}}]})));vi.stubGlobal('fetch',fetchMock);
 const result=await generateDraft(input);
 expect(result.image).toEqual(new Uint8Array(Buffer.from(png,'base64')));expect(result.mimeType).toBe('image/png');
 expect(fetchMock.mock.calls[0][0]).toContain('gemini-3.1-flash-lite-image');
 const body=JSON.parse(fetchMock.mock.calls[0][1].body);expect(body.generationConfig.responseModalities).toContain('IMAGE');expect(body.systemInstruction.parts[0].text).toContain('cat');expect(result.systemPrompt).toContain('orange');expect(result.systemPrompt).toContain('clay');
});
test('refuses text-only output instead of pretending an image was generated',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test-secret');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'I cannot create this image.'}]}}]}))));
 await expect(generateDraft(input)).rejects.toThrow('aiFailed');
});
