import type {SupabaseClient} from '@supabase/supabase-js';
import {isUuid} from '../rants/validation';
import type {CatFeedItem,CatFilters,CatSeed} from './types';
export async function getCats(client:SupabaseClient,filters:CatFilters,mine=false):Promise<{items:CatFeedItem[];hasMore:boolean}>{
 const {data,error}=await client.rpc('cat_feed_page',{p_sort:filters.sort,p_window:filters.window,p_offset:(filters.page-1)*8,p_mine:mine});
 if(error)throw error;
 const rows=(data??[]) as CatFeedItem[];const page=rows.slice(0,8);
 if(!page.length)return {items:[],hasMore:false};
 const {data:signed}=await client.storage.from('ai-cat-images').createSignedUrls(page.map(r=>r.ai_image_path),3600);
 const urls=new Map((signed??[]).filter(s=>!s.error&&s.signedUrl).map(s=>[s.path,s.signedUrl]));
 return {items:page.map(row=>({...row,imageUrl:urls.get(row.ai_image_path)??null,imageError:!urls.has(row.ai_image_path)})),hasMore:rows.length>8};
}
export async function getCatSeed(client:SupabaseClient,rantId:string):Promise<CatSeed|null>{
 if(!isUuid(rantId))return null;
 const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)return null;
 const {data:post,error}=await client.from('rants').select('generation_id').eq('id',rantId).maybeSingle();
 if(error)throw error;if(!post?.generation_id)return null;
 const {data:g,error:gError}=await client.from('ai_generations').select('prompt,cat_breed,art_style,language,media_type').eq('id',post.generation_id).eq('user_id',user.id).maybeSingle();
 if(gError)throw gError;if(!g||g.media_type!=='image')return null;
 return {prompt:g.prompt,breed:g.cat_breed,style:g.art_style,language:g.language};
}
