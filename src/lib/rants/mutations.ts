import type { SupabaseClient } from '@supabase/supabase-js';
import type { RantInput } from './types';
import { RantError,isUuid,validateRant,validateComment,validateRantPhoto } from './validation';
async function requireUser(client:SupabaseClient){const {data:{user},error}=await client.auth.getUser();if(error||!user)throw new RantError('signInRequired');return user;}
export async function publishRant(client:SupabaseClient,input:RantInput,photo:File|null):Promise<{id:string}> {
 const user=await requireUser(client);const rant=validateRant(input);validateRantPhoto(photo);let uploadedPath:string|null=null;
 if(photo&&photo.size>0){const ext:{[key:string]:string}={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};uploadedPath=`${user.id}/${crypto.randomUUID()}.${ext[photo.type]}`;const {error}=await client.storage.from('rant-photos').upload(uploadedPath,photo,{contentType:photo.type,upsert:false});if(error)throw new RantError('uploadFailed');}
 const {data,error}=await client.from('rants').insert({user_id:user.id,title:rant.title,location:rant.location,body:rant.body,image_path:uploadedPath,generation_id:rant.generationId}).select('id').single();
 if(error||!data){if(uploadedPath)await client.storage.from('rant-photos').remove([uploadedPath]);throw new RantError('mutationFailed');}
 return {id:data.id};
}
export async function setVote(client:SupabaseClient,id:string,value:1|-1):Promise<void>{await requireUser(client);if(!isUuid(id)||(value!==1&&value!==-1))throw new RantError('invalidText');const {error}=await client.rpc('toggle_rant_vote',{p_rant_id:id,p_value:value});if(error)throw new RantError('mutationFailed');}
export async function addComment(client:SupabaseClient,id:string,body:string):Promise<void>{const user=await requireUser(client);if(!isUuid(id))throw new RantError('invalidText');const text=validateComment(body);const {error}=await client.from('rant_comments').insert({rant_id:id,user_id:user.id,body:text});if(error)throw new RantError('mutationFailed');}
