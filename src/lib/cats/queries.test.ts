import {expect,it} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {getCats,getCatSeed} from './queries';
const row={id:'33333333-3333-4333-8333-333333333333',title:'Cat',body:'A cat',location:'',created_at:'2026-10-14T12:00:00Z',ai_image_path:'owner/cat.png',breed:'orange',style:'clay',totals:{upvotes:1,downvotes:0,score:1},myVote:null,canReuse:false};
it('paginates image works, batches signing and isolates a failed image',async()=>{
 let received:unknown;let signedPaths:string[]=[];
 const client={rpc:async(_name:string,args:unknown)=>{received=args;return{data:Array.from({length:9},(_,i)=>({...row,id:String(i),ai_image_path:`owner/${i}.png`})),error:null};},storage:{from:()=>({createSignedUrls:async(paths:string[])=>{signedPaths=paths;return{data:paths.map((path,i)=>({path,signedUrl:i?'https://storage.example/cat.png':'',error:i?null:'missing'})),error:null};}})}} as unknown as SupabaseClient;
 const r=await getCats(client,{sort:'popular',window:'week',page:2},true);
 expect(r.items).toHaveLength(8);expect(r.hasMore).toBe(true);expect(signedPaths).toHaveLength(8);
 expect(r.items[0].imageError).toBe(true);expect(r.items[1].imageUrl).toBe('https://storage.example/cat.png');expect(received).toEqual({p_sort:'popular',p_window:'week',p_offset:8,p_mine:true});
});
it('does not turn a database failure into an empty or sample feed',async()=>{
 const client={rpc:async()=>({data:null,error:new Error('offline')})} as unknown as SupabaseClient;
 await expect(getCats(client,{sort:'latest',window:'all',page:1})).rejects.toThrow('offline');
});
it('returns no private seed when logged out or another owner RLS hides generation',async()=>{
 const guest={auth:{getUser:async()=>({data:{user:null},error:null})}} as unknown as SupabaseClient;
 expect(await getCatSeed(guest,row.id)).toBeNull();
 const other={auth:{getUser:async()=>({data:{user:{id:'other'}},error:null})},from:(t:string)=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:t==='rants'?{generation_id:row.id}:null,error:null}),eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})})} as unknown as SupabaseClient;
 expect(await getCatSeed(other,row.id)).toBeNull();
});
