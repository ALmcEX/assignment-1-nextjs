import {afterEach,expect,it,vi} from 'vitest';
import {findMemeTemplate,getMemeTemplates} from './templates';
afterEach(()=>vi.unstubAllGlobals());
it('keeps verified cats when popular list changes or is unavailable',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({success:true,data:{memes:[{id:'188390779',url:'https://evil.example/a.jpg'},{id:'other',url:'https://evil.example/b.jpg'}]}})}));
 const templates=await getMemeTemplates();
 expect(templates.map(t=>t.id)).toEqual(['188390779','405658']);
 expect(templates[0].imageUrl).toBe('https://i.imgflip.com/345v97.jpg');
 expect(templates[1].imageUrl).toBe('https://imgflip.com/s/meme/Grumpy-Cat.jpg');
 expect(findMemeTemplate('unknown')).toBeNull();
});
it.each(['HTTP','timeout'])('uses verified fallback on %s failure',async(kind)=>{
 vi.stubGlobal('fetch',kind==='HTTP'?vi.fn().mockResolvedValue({ok:false}):vi.fn().mockRejectedValue(new DOMException('timeout','TimeoutError')));
 expect((await getMemeTemplates()).length).toBe(2);
 expect(findMemeTemplate('405658')?.sourceUrl).toBe('https://imgflip.com/memetemplate/Grumpy-Cat');
});
