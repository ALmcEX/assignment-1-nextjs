import type { SupabaseClient } from '@supabase/supabase-js';
import type { Rant, RantDetail, RantSummary, RantComment, VoteTotals } from './types';
import { isUuid } from './validation';
export function parsePage(value: string | undefined): number { const n=Number(value??1);return Number.isSafeInteger(n)&&n>=1&&n<=100000000?n:1; }
export async function getRants(client:SupabaseClient,sort:'latest'|'popular',page=1):Promise<{rants:RantSummary[];hasMore:boolean}> {
 const {data,error}=await client.rpc('rant_feed_page',{p_sort:sort,p_offset:(page-1)*20});
 if(error)throw error;const rows=(data??[]) as RantSummary[];return {rants:rows.slice(0,20),hasMore:rows.length>20};
}
export async function getRant(client:SupabaseClient,id:string,userId?:string,commentsPage=1):Promise<RantDetail|null> {
 if(!isUuid(id))return null;
 let {data,error}=await client.from('rants').select('id,title,location,body,image_path,ai_image_path,generation_id,is_example,created_at').eq('id',id).maybeSingle();
 // Keep older rows readable while the additive storage migration rolls out.
 if(error?.code==='42703'){({data,error}=await client.from('rants').select('id,title,location,body,image_path,generation_id,is_example,created_at').eq('id',id).maybeSingle());}
 if(error)throw error;if(!data)return null;
 const rant=data as Rant;
 const [commentsResult,totalsResult]=await Promise.all([
  client.from('rant_comments').select('id,body,created_at',{count:'exact'}).eq('rant_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).range((commentsPage-1)*20,commentsPage*20-1),
  client.rpc('rant_vote_totals',{p_rant_id:id})
 ]);
 if(commentsResult.error||totalsResult.error)throw commentsResult.error??totalsResult.error;
 let myVote:1|-1|null=null;
 if(userId){const {data:vote,error:voteError}=await client.from('rant_votes').select('value').eq('rant_id',id).eq('user_id',userId).maybeSingle();if(voteError)throw voteError;myVote=vote?.value??null;}
 let aiImageUrl:string|null=null;
 if(rant.ai_image_path){const {data:signed,error:signError}=await client.storage.from('ai-cat-images').createSignedUrl(rant.ai_image_path,3600);if(signError)throw signError;aiImageUrl=signed?.signedUrl??null;}
 return {...rant,aiImageUrl,commentsCount:commentsResult.count??0,commentsPage,hasOlderComments:commentsPage*20<(commentsResult.count??0),comments:((commentsResult.data??[]) as RantComment[]).reverse(),totals:totalsResult.data?.[0] as VoteTotals??{upvotes:0,downvotes:0,score:0},myVote,imageUrl:rant.image_path?client.storage.from('rant-photos').getPublicUrl(rant.image_path).data.publicUrl:null};
}
