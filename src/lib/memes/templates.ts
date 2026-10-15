import type { MemeTemplate } from "./types";
// Verified 2026-10-14 against Imgflip's API and each source page.
const catalog: readonly MemeTemplate[] = [
  {
    id: "188390779",
    name: "Woman Yelling At Cat",
    imageUrl: "https://i.imgflip.com/345v97.jpg",
    sourceUrl:
      "https://imgflip.com/memetemplate/188390779/Woman-Yelling-At-Cat",
    description:
      "Two panels: an upset woman points and yells on the left; a white cat sits at a dinner table looking unimpressed on the right. Contrast an accusation with a calm or literal response.",
    width: 680,
    height: 438,
  },
  {
    id: "405658",
    name: "Grumpy Cat",
    imageUrl: "https://imgflip.com/s/meme/Grumpy-Cat.jpg",
    sourceUrl: "https://imgflip.com/memetemplate/Grumpy-Cat",
    description:
      "A close-up of a cream and brown cat with a famously grumpy expression. Use dry, unimpressed or reluctant humor.",
    width: 500,
    height: 617,
  },
];
export function findMemeTemplate(id: string): MemeTemplate | null {
  const t = catalog.find((t) => t.id === id);
  return t ? { ...t } : null;
}
export async function getMemeTemplates(): Promise<MemeTemplate[]> {
  try {
    const response = await fetch("https://api.imgflip.com/get_memes", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (response.ok) {
      const json = await response.json();
      const popular = Array.isArray(json?.data?.memes) ? json.data.memes : [];
      return catalog.map((t) => {
        const match = popular.find(
          (r: { id?: string; url?: string; width?: number; height?: number }) =>
            r.id === t.id &&
            r.url === t.imageUrl &&
            Number.isInteger(r.width) &&
            Number.isInteger(r.height) &&
            r.width! > 0 &&
            r.width! <= 10000 &&
            r.height! > 0 &&
            r.height! <= 10000,
        );
        return match
          ? { ...t, width: match.width, height: match.height }
          : { ...t };
      });
    }
  } catch {
    /* The verified catalog remains available when the popular API is down. */
  }
  return catalog.map((t) => ({ ...t }));
}
