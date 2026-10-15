import {afterEach,expect,it,vi} from 'vitest';
import {readLocalDraft,writeLocalDraft,clearLocalDraft} from './local-draft';
afterEach(()=>{vi.restoreAllMocks();window.localStorage.clear();});
const draft={prompt:'A cat in space',title:'',location:'',breed:'orange' as const,style:'clay' as const,language:'en' as const};
it('isolates accounts and serializes only editable parameters',()=>{
 expect(writeLocalDraft('a',{...draft,generationId:'private',imageUrl:'secret'} as typeof draft)).toBe(true);
 expect(readLocalDraft('a')).toEqual(draft);expect(readLocalDraft('b')).toBeNull();expect(window.localStorage.getItem('catcanvas:draft:v1:a')).not.toContain('private');
 expect(clearLocalDraft('a')).toBe(true);expect(readLocalDraft('a')).toBeNull();
});
it('ignores corrupted or invalid saved input',()=>{
 for(const data of ['bad','null',JSON.stringify({...draft,prompt:'x'.repeat(1001)}),JSON.stringify({...draft,breed:'dog'})]){window.localStorage.setItem('catcanvas:draft:v1:a',data);expect(readLocalDraft('a')).toBeNull();}
});
it('survives blocked storage without blocking editing',()=>{
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked');});expect(writeLocalDraft('a',draft)).toBe(false);
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked');});expect(readLocalDraft('a')).toBeNull();
});
