import type { Language } from '@/src/lib/i18n';
import { RantError,textField,validateRant } from './validation';
export type DraftInput={prompt:string;location:string;language:Language};
export type GeneratedDraft={title:string;body:string;model:string;systemPrompt:string};
export type SavedGeneration=DraftInput & GeneratedDraft & {userId:string;token:string};
export type GenerationDependencies={configured:boolean;reserve:(id:string)=>Promise<string>;release:(id:string,token:string)=>Promise<void>;generate:(input:DraftInput)=>Promise<GeneratedDraft>;save:(data:SavedGeneration)=>Promise<string>};
export async function createDraft(userId:string|null,input:DraftInput,deps:GenerationDependencies):Promise<{generationId:string;title:string;body:string}> {
 if(!userId)throw new RantError('signInRequired');
 if(!deps.configured)throw new RantError('aiUnavailable');
 const clean={prompt:textField(input.prompt,3000),location:textField(input.location,120),language:input.language};
 if(!['en','zh-CN'].includes(clean.language))throw new RantError('invalidText');
 const token=await deps.reserve(userId);
 try {
  const draft=await deps.generate(clean);const valid=validateRant({title:draft.title,body:draft.body,location:clean.location});
  const generationId=await deps.save({...clean,...draft,title:valid.title,body:valid.body,userId,token});
  return {generationId,title:valid.title,body:valid.body};
 } catch {
  await deps.release(userId,token).catch(()=>{});
  throw new RantError('aiFailed');
 }
}
