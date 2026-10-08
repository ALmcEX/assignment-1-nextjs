import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
import { RantInteractions } from './rant-interactions';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn(),replace:vi.fn()})}));
vi.mock('@/src/lib/supabase/browser',()=>({createBrowserSupabaseClient:()=>({})}));
vi.mock('@/src/lib/rants/mutations',()=>({setVote:async()=>{throw new Error('mutationFailed');},addComment:async()=>{throw new Error('mutationFailed');}}));
afterEach(cleanup);
const base={rantId:'33333333-3333-4333-8333-333333333333',myVote:null,totals:{upvotes:0,downvotes:0,score:0},comments:[]};
it('offers sign-in instead of mutation controls to visitors',()=>{render(<RantInteractions {...base} user={null}/>);expect(screen.getByRole('button',{name:'Continue with Google'})).toBeTruthy();expect(screen.queryByRole('textbox')).toBeNull();expect(screen.queryByRole('button',{name:/Upvote/})).toBeNull();});
it('preserves a comment after failed submission',async()=>{render(<RantInteractions {...base} user={{id:'user'} as never}/>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'My comment'}});fireEvent.click(screen.getByRole('button',{name:'Post comment'}));await waitFor(()=>expect(screen.getByRole('alert')).toBeTruthy());expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('My comment');});
it('does not mark a vote as successful after a failed save',async()=>{render(<RantInteractions {...base} user={{id:'user'} as never}/>);fireEvent.click(screen.getByRole('button',{name:/Upvote/}));await waitFor(()=>expect(screen.getByRole('alert')).toBeTruthy());expect(screen.getByRole('button',{name:/Upvote/}).getAttribute('aria-pressed')).toBe('false');});
it('locks the comment being saved until the pending request finishes',async()=>{
 const mutations=await import('@/src/lib/rants/mutations');let finish!:()=>void;const spy=vi.spyOn(mutations,'addComment').mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve;}));
 render(<RantInteractions {...base} user={{id:'user'} as never}/>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'Submitted comment'}});fireEvent.click(screen.getByRole('button',{name:'Post comment'}));
 expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true);finish();await waitFor(()=>expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(false));spy.mockRestore();
});
