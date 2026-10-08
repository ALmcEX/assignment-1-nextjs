import { expect,it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getRants } from './queries';
it('paginates public summaries and indicates whether the next page exists',async()=>{
 const calls:unknown[]=[];const rows=Array.from({length:21},(_,i)=>({id:String(i),title:'Title '+i,location:'NYC'}));
 const client={rpc:async(name:string,args:unknown)=>{calls.push({name,args});return{data:rows,error:null};}} as unknown as SupabaseClient;
 const result=await getRants(client,'latest',3);
 expect(result.rants).toHaveLength(20);expect(result.hasMore).toBe(true);
 expect(calls).toEqual([{name:'rant_feed_page',args:{p_sort:'latest',p_offset:40}}]);
});
it('loads older comments while keeping the real total count',async()=>{
 const {getRant}=await import('./queries');const ranges:unknown[]=[];const id='33333333-3333-4333-8333-333333333333';
 const client={from:(table:string)=>table==='rants'?{select:()=>({eq:()=>({maybeSingle:async()=>({data:{id,title:'Title',location:'NYC',body:'Body',image_path:null,generation_id:null,is_example:false,created_at:'2026-10-08T00:00:00Z'},error:null})})})}:{select:(_columns:string,options:unknown)=>{ranges.push(options);return{eq:()=>({order:()=>({order:()=>({range:async(start:number,end:number)=>{ranges.push([start,end]);return{data:[{id:'newer',body:'Newer',created_at:'2026-10-08T00:00:00Z'},{id:'older',body:'Older',created_at:'2026-10-07T00:00:00Z'}],count:50,error:null};}})})})};}},rpc:async()=>({data:[{upvotes:0,downvotes:0,score:0}],error:null})} as unknown as SupabaseClient;
 const result=await getRant(client,id,undefined,2);
 expect(result?.commentsCount).toBe(50);expect(result?.commentsPage).toBe(2);expect(result?.hasOlderComments).toBe(true);expect(result?.comments[0].body).toBe('Older');expect(ranges).toEqual([{count:'exact'},[20,39]]);
});
