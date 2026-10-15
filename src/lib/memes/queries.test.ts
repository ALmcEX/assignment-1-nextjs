import {expect,it} from 'vitest';import type {SupabaseClient} from '@supabase/supabase-js';import {getMemes,getMemeSeed} from './queries';
const id='33333333-3333-4333-8333-333333333333';
it('returns eight rows plus lookahead and exact owned filter',async()=>{let received:unknown;const c={rpc:async(name:string,args:unknown)=>{received={name,args};return {data:Array.from({length:9},(_,i)=>({id:String(i)})),error:null};}} as unknown as SupabaseClient;
 const r=await getMemes(c,{sort:'popular',window:'week',page:2},true);expect(r.items).toHaveLength(8);expect(r.hasMore).toBe(true);expect(received).toEqual({name:'meme_feed_page',args:{p_sort:'popular',p_window:'week',p_offset:8,p_mine:true}});
});
it('query failure remains an error',async()=>{const c={rpc:async()=>({data:null,error:new Error('offline')})} as unknown as SupabaseClient;await expect(getMemes(c,{sort:'latest',window:'all',page:1})).rejects.toThrow('offline');});
it('does not return a private seed to guest or nonowner',async()=>{const guest={auth:{getUser:async()=>({data:{user:null},error:null})}} as unknown as SupabaseClient;expect(await getMemeSeed(guest,id)).toBeNull();
 const c={auth:{getUser:async()=>({data:{user:{id:'other'}},error:null})},from:(table:string)=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='rants'?{generation_id:id}:null,error:null})};return q;}} as unknown as SupabaseClient;expect(await getMemeSeed(c,id)).toBeNull();
});
