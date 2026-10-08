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
it('signs the published AI cat image independently of an uploaded photo',async()=>{
 const {getRant}=await import('./queries');const signed:unknown[]=[];const id='33333333-3333-4333-8333-333333333333';
 const client={from:(table:string)=>table==='rants'?{select:()=>({eq:()=>({maybeSingle:async()=>({data:{id,title:'Title',location:'NYC',body:'Body',image_path:null,ai_image_path:'author/cat.png',generation_id:'44444444-4444-4444-8444-444444444444',is_example:false,created_at:'2026-10-08T00:00:00Z'},error:null})})})}:{select:()=>({eq:()=>({order:()=>({order:()=>({range:async()=>({data:[],count:0,error:null})})})})})},rpc:async()=>({data:[{upvotes:0,downvotes:0,score:0}],error:null}),storage:{from:(bucket:string)=>({createSignedUrl:async(path:string,seconds:number)=>{signed.push({bucket,path,seconds});return{data:{signedUrl:'https://storage.example/signed/cat.png'},error:null};}})}} as unknown as SupabaseClient;
 expect((await getRant(client,id))?.aiImageUrl).toBe('https://storage.example/signed/cat.png');expect(signed).toEqual([{bucket:'ai-cat-images',path:'author/cat.png',seconds:3600}]);
});
it('keeps existing detail pages available during the staged image-schema rollout',async()=>{
 const{getRant}=await import('./queries');let attempts=0;const id='33333333-3333-4333-8333-333333333333';
 const client={from:(table:string)=>table==='rants'?{select:()=>({eq:()=>({maybeSingle:async()=>++attempts===1?{data:null,error:{code:'42703',message:'column does not exist'}}:{data:{id,title:'Old title',location:'Dorm',body:'Old body',image_path:null,generation_id:null,is_example:false,created_at:'2026-10-08T00:00:00Z'},error:null}})})}:{select:()=>({eq:()=>({order:()=>({order:()=>({range:async()=>({data:[],count:0,error:null})})})})})},rpc:async()=>({data:[],error:null})} as unknown as SupabaseClient;
 expect((await getRant(client,id))?.body).toBe('Old body');expect(attempts).toBe(2);
});
