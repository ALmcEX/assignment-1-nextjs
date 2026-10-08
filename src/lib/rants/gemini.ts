import 'server-only';
import type { DraftInput,GeneratedDraft } from './generation-service';
export async function generateDraft(input:DraftInput):Promise<GeneratedDraft> {
 const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('aiUnavailable');
 const model=process.env.GEMINI_MODEL||'gemini-3.8-flash';
 if(!/^[a-zA-Z0-9.-]+$/.test(model))throw new Error('aiUnavailable');
 const systemPrompt=`You write short, playful first-person rants for Columbia students exploring New York. Write in ${input.language==='zh-CN'?'Simplified Chinese':'English'}. Use only the supplied scene and location. Do not invent factual accusations, private information, names, or real-world events. No hateful or targeted harassment. Title maximum 120 characters; body maximum 3000 characters, preferably 2-4 sentences. Return a JSON object with title and body. Location: ${input.location}`;
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:input.prompt}]}],generationConfig:{responseFormat:{text:{mimeType:'APPLICATION_JSON',schema:{type:'object',properties:{title:{type:'string'},body:{type:'string'}},required:['title','body'],additionalProperties:false}}}}}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error(`Gemini HTTP ${response.status}`);
 const json=await response.json();const candidate=json.candidates?.[0];if(candidate?.finishReason!=='STOP')throw new Error('aiFailed');
 const content=(candidate.content?.parts??[]).filter((part:{thought?:boolean;text?:string})=>!part.thought).map((part:{text?:string})=>part.text??'').join('');
 const draft=JSON.parse(content);return {title:draft.title,body:draft.body,model,systemPrompt};
}
