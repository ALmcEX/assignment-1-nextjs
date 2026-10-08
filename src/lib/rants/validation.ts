import type { RantInput } from './types';
export class RantError extends Error { constructor(public key: string) { super(key); } }
export function textField(value: unknown, max: number): string {
 if (typeof value !== 'string' || !value.trim() || [...value.trim()].length > max) throw new RantError('invalidText');
 return value.trim();
}
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function validateRant(input: unknown): RantInput {
 if (!input || typeof input !== 'object') throw new RantError('invalidText');
 const data = input as Record<string, unknown>;
 const generationId = data.generationId ?? null;
 const imagePath = data.imagePath ?? null;
 if (generationId !== null && (typeof generationId !== 'string' || !isUuid(generationId))) throw new RantError('invalidText');
 if (imagePath !== null && (typeof imagePath !== 'string' || imagePath.length > 200)) throw new RantError('invalidPhoto');
 return { title: textField(data.title,120), location: textField(data.location,120), body: textField(data.body,3000), generationId, imagePath };
}
export function validateComment(body: unknown): string { return textField(body,1000); }
export function validateRantPhoto(file: File | null): void {
 if (!file || file.size === 0) return;
 if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5242880) throw new RantError('invalidPhoto');
}
