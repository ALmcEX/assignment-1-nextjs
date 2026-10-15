import { catBreeds, catStyles } from "../rants/cat-options";
import type { CatSeed } from "./types";
export type CatFormDraft = CatSeed & { title: string; caption: string; location: string };
function clean(value: unknown): CatFormDraft | null {
  if (!value || typeof value !== "object") return null;
  const v = value as CatFormDraft;
  if (
    typeof v.prompt !== "string" ||
    [...v.prompt].length > 1000 ||
    (v.caption !== undefined && (typeof v.caption !== "string" || [...v.caption].length > 1000)) ||
    typeof v.title !== "string" ||
    [...v.title].length > 120 ||
    typeof v.location !== "string" ||
    [...v.location].length > 120 ||
    !catBreeds.includes(v.breed) ||
    !catStyles.includes(v.style) ||
    !["en", "zh-CN"].includes(v.language)
  )
    return null;
  return {
    prompt: v.prompt,
    caption: v.caption ?? "",
    title: v.title,
    location: v.location,
    breed: v.breed,
    style: v.style,
    language: v.language,
  };
}
const key = (id: string) => `catcanvas:draft:v1:${id}`;
export function readLocalDraft(userId: string): CatFormDraft | null {
  try {
    return clean(
      JSON.parse(window.localStorage.getItem(key(userId)) ?? "null"),
    );
  } catch {
    return null;
  }
}
export function writeLocalDraft(userId: string, draft: CatFormDraft): boolean {
  try {
    const data = clean(draft);
    if (!data) return false;
    window.localStorage.setItem(key(userId), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function clearLocalDraft(userId: string): boolean {
  try {
    window.localStorage.removeItem(key(userId));
    return true;
  } catch {
    return false;
  }
}
