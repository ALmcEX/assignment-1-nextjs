import { findMemeTemplate } from "./templates";
import type { MemeSeed } from "./types";
export type MemeFormDraft = MemeSeed & { title: string; location: string };
function clean(value: unknown): MemeFormDraft | null {
  if (!value || typeof value !== "object") return null;
  const v = value as MemeFormDraft;
  if (
    typeof v.prompt !== "string" ||
    [...v.prompt].length > 1000 ||
    typeof v.title !== "string" ||
    [...v.title].length > 120 ||
    typeof v.location !== "string" ||
    [...v.location].length > 120 ||
    !findMemeTemplate(v.templateId) ||
    !["en", "zh-CN"].includes(v.language)
  )
    return null;
  return {
    prompt: v.prompt,
    title: v.title,
    location: v.location,
    templateId: v.templateId,
    language: v.language,
  };
}
const key = (id: string) => `catcanvas:meme:v1:${id}`;
export function readMemeDraft(userId: string): MemeFormDraft | null {
  try {
    return clean(
      JSON.parse(window.localStorage.getItem(key(userId)) ?? "null"),
    );
  } catch {
    return null;
  }
}
export function writeMemeDraft(userId: string, draft: MemeFormDraft): boolean {
  try {
    const data = clean(draft);
    if (!data) return false;
    window.localStorage.setItem(key(userId), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function clearMemeDraft(userId: string): boolean {
  try {
    window.localStorage.removeItem(key(userId));
    return true;
  } catch {
    return false;
  }
}
