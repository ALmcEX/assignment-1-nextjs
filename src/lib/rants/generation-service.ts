import type { Language } from '@/src/lib/i18n';
import { RantError, textField } from './validation';
import { catBreeds, catStyles, type CatBreed, type CatStyle } from './cat-options';
export type DraftInput = { prompt: string; location: string; language: Language; breed: CatBreed; style: CatStyle };
export type GeneratedDraft = { image: Uint8Array; mimeType: string; model: string; systemPrompt: string };
export type SavedGeneration = DraftInput & { userId: string; token: string; imagePath: string; mimeType: string; model: string; systemPrompt: string };
export type GenerationDependencies = {
 configured: boolean;
 reserve: (id: string) => Promise<string>;
 release: (id: string, token: string) => Promise<void>;
 generate: (input: DraftInput) => Promise<GeneratedDraft>;
 upload: (id: string, image: Uint8Array, mimeType: string) => Promise<string>;
 remove: (path: string) => Promise<void>;
 preview: (path: string) => Promise<string>;
 save: (data: SavedGeneration) => Promise<string>;
};
export function validateGeneratedImage(image: Uint8Array, mime: string): void {
 if (!(image instanceof Uint8Array) || image.length < 12 || image.length > 5242880) throw new Error('aiFailed');
 const png = [137,80,78,71,13,10,26,10].every((v,i) => image[i] === v);
 const jpeg = image[0] === 255 && image[1] === 216 && image[2] === 255;
 const webp = String.fromCharCode(...image.slice(0,4)) === 'RIFF' && String.fromCharCode(...image.slice(8,12)) === 'WEBP';
 if (!((mime === 'image/png' && png) || (mime === 'image/jpeg' && jpeg) || (mime === 'image/webp' && webp))) throw new Error('aiFailed');
}
export async function createDraft(userId: string | null, input: DraftInput, deps: GenerationDependencies): Promise<{ generationId: string; imageUrl: string }> {
 if (!userId) throw new RantError('signInRequired');
 if (!deps.configured) throw new RantError('aiUnavailable');
 const clean = { prompt: textField(input.prompt,1000), location: textField(input.location,120), language: input.language, breed: input.breed, style: input.style };
 if (!['en','zh-CN'].includes(clean.language) || !catBreeds.includes(clean.breed) || !catStyles.includes(clean.style)) throw new RantError('invalidText');
 const token = await deps.reserve(userId);
 let stage = 'generate';
 let uploaded: string | null = null;
 try {
  const draft = await deps.generate(clean);
  stage = 'validate'; validateGeneratedImage(draft.image,draft.mimeType);
  stage = 'upload'; uploaded = await deps.upload(userId,draft.image,draft.mimeType);
  // Obtain the preview before committing so a signing failure can be cleaned up.
  stage = 'preview'; const imageUrl = await deps.preview(uploaded);
  stage = 'save'; const generationId = await deps.save({ ...clean, userId, token, imagePath: uploaded, mimeType: draft.mimeType, model: draft.model, systemPrompt: draft.systemPrompt });
  return { generationId, imageUrl };
 } catch (cause) {
  const status = cause instanceof Error && /^Gemini HTTP [0-9]{3}$/.test(cause.message) ? cause.message : undefined;
  console.error('AI image failure',{stage,status});
  if (uploaded) await deps.remove(uploaded).catch(() => {});
  await deps.release(userId,token).catch(() => {});
  throw new RantError('aiFailed');
 }
}
