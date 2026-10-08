import type { SupabaseClient } from '@supabase/supabase-js';
import type { Rant, RantDetail, RantSummary, RantComment, VoteTotals } from './types';
import { isUuid } from './validation';
export async function getRants(client:SupabaseClient,sort:'latest'|'popular'):Promise<RantSummary[]> {
 const {data,error}=await client.rpc('rant_feed',{p_sort:sort});
 if(error)throw error;return (data??[]) as RantSummary[];
}
export async function getRant(client:SupabaseClient,id:string,userId?:string):Promise<RantDetail|null> {
 if(!isUuid(id))return null;
 const {data,error}=await client.from('rants').select('id,title,location,body,image_path,generation_id,is_example,created_at').eq('id',id).maybeSingle();
 if(error)throw error;if(!data)return null;
 const rant=data as Rant;
 const [commentsResult,totalsResult]=await Promise.all([
  client.from('rant_comments').select('id,body,created_at').eq('rant_id',id).order('created_at',{ascending:false}).limit(100),
  client.rpc('rant_vote_totals',{p_rant_id:id})
 ]);
 if(commentsResult.error||totalsResult.error)throw commentsResult.error??totalsResult.error;
 let myVote:1|-1|null=null;
 if(userId){const {data:vote,error:voteError}=await client.from('rant_votes').select('value').eq('rant_id',id).eq('user_id',userId).maybeSingle();if(voteError)throw voteError;myVote=vote?.value??null;}
 return {...rant,comments:((commentsResult.data??[]) as RantComment[]).reverse(),totals:totalsResult.data?.[0] as VoteTotals??{upvotes:0,downvotes:0,score:0},myVote,imageUrl:rant.image_path?client.storage.from('rant-photos').getPublicUrl(rant.image_path).data.publicUrl:null};
}
