import type { MemeTemplate } from "./types";
// Original templates verified 2026-10-14; additions verified 2026-11-19
// against Imgflip source pages and the decoded source-image dimensions.
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
  {
    id: "61531",
    name: "Business Cat",
    imageUrl: "https://imgflip.com/s/meme/Business-Cat.jpg",
    sourceUrl: "https://imgflip.com/memetemplate/Business-Cat",
    description: "A black cat wearing a white collar and striped tie against a colorful radial background. Use office jargon, meetings, deadlines, or management humor with a feline twist.",
    width: 500,
    height: 500,
  },
  {
    id: "300762662",
    name: "Crying Cat",
    imageUrl: "https://i.imgflip.com/4z2dye.jpg",
    sourceUrl: "https://imgflip.com/memetemplate/300762662/Crying-cat",
    description: "A close-up of a black-and-white cat with watery, sad-looking eyes. Use gentle disappointment, small setbacks, or trying to stay composed when things go wrong.",
    width: 720,
    height: 633,
  },
  {
    id: "144311615",
    name: "Polite Cat",
    imageUrl: "https://i.imgflip.com/2dx3jz.jpg",
    sourceUrl: "https://imgflip.com/memetemplate/144311615/Polite-Cat",
    description: "A white-and-gray cat looking ahead with a small, polite smile. Use awkward agreement, patient requests, or pretending everything is fine.",
    width: 800,
    height: 450,
  },
  {
    id: "335818505",
    name: "Pop Cat",
    imageUrl: "https://i.imgflip.com/5jxr7t.jpg",
    sourceUrl: "https://imgflip.com/memetemplate/335818505/Pop-Cat",
    description: "Two side-by-side views of a cat: mouth closed on the left and wide open on the right. Contrast quiet anticipation with a sudden shout, surprise, or enthusiastic reaction.",
    width: 300,
    height: 168,
  },
  {
    id: "211890694",
    name: "Confused Loading Cat",
    imageUrl: "https://i.imgflip.com/3i5jwm.png",
    sourceUrl: "https://imgflip.com/memetemplate/211890694/Confused-loading-cat",
    description: "A tabby-and-white cat looking down with loading-spinner symbols over its eyes. Use confusion, mental buffering, or struggling to process an unexpected situation.",
    width: 635,
    height: 521,
  },
  {
    id: "483766152",
    name: "Bongo Cat",
    imageUrl: "https://i.imgflip.com/800sco.png",
    sourceUrl: "https://imgflip.com/memetemplate/483766152/BONGO-CAT",
    description: "A simple black-outline drawing of a white cat leaning over an edge with its paws ready to tap. Use cheerful participation, typing, tapping, or getting absorbed in a small task; no instruments are visible.",
    width: 723,
    height: 422,
  },
  {
    id: "241473660",
    name: "Shocked Cat",
    imageUrl: "https://i.imgflip.com/3zrm9o.jpg",
    sourceUrl: "https://imgflip.com/memetemplate/241473660/Shocked-Cat",
    description: "A close-up of an orange-and-white cat with enormous round eyes and an alert expression. Use sudden realizations, unexpected announcements, or deadline panic.",
    width: 1495,
    height: 1388,
  },
  {
    id: "546334101",
    name: "Smug Cat",
    imageUrl: "https://i.imgflip.com/919u39.jpg",
    sourceUrl: "https://imgflip.com/memetemplate/546334101/Smug-Cat",
    description: "A tabby kitten reclining on a chair with its head tilted back and eyes partly closed, looking comfortably pleased. Use quiet satisfaction, tiny victories, or relaxing after finishing a task.",
    width: 1920,
    height: 1920,
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
