import type { ObservationRunner } from "../observability/registry";
import { RantError, textField } from "../rants/validation";
import { validateGeneratedImage } from "../rants/generation-service";
import { findMemeTemplate } from "./templates";
import { validateCaptionChoices, type CaptionPhoto } from "./caption-choices";
import type { MemeSeed, MemeTemplate } from "./types";
type ChoiceInput = {
  prompt?: unknown;
  templateId?: unknown;
  language?: unknown;
  photo?: CaptionPhoto;
  width?: number;
  height?: number;
};
type Generated = { captions: string[]; model: string; systemPrompt: string };
export type ChoiceDependencies = {
  observe?: ObservationRunner;
  reserve: (userId: string) => Promise<string>;
  release: (userId: string, token: string) => Promise<void>;
  reserveAttempt: () => Promise<void>;
  generate: (
    seed: MemeSeed,
    template: MemeTemplate,
    photo?: CaptionPhoto,
  ) => Promise<Generated>;
  upload: (userId: string, photo: CaptionPhoto) => Promise<string>;
  remove: (path: string) => Promise<void>;
  sign: (path: string) => Promise<string>;
  save: (
    value: Generated & {
      userId: string;
      token: string;
      seed: MemeSeed;
      template: MemeTemplate;
    },
  ) => Promise<string>;
};
export async function createCaptionChoices(
  userId: string | null,
  input: ChoiceInput,
  deps: ChoiceDependencies,
) {
  if (!userId) throw new RantError("signInRequired");
  const seed: MemeSeed = {
    prompt: textField(input.prompt, 1000),
    templateId: String(input.templateId ?? ""),
    language: input.language as MemeSeed["language"],
  };
  if (!["en", "zh-CN"].includes(seed.language))
    throw new RantError("invalidText");
  let template = findMemeTemplate(seed.templateId);
  const photo = seed.templateId === "uploaded" ? input.photo : undefined;
  if (seed.templateId === "uploaded") {
    if (!photo || photo.bytes.length > 3 * 1024 * 1024)
      throw new RantError("invalidPhoto");
    try {
      validateGeneratedImage(photo.bytes, photo.mimeType);
    } catch {
      throw new RantError("invalidPhoto");
    }
    const width = input.width ?? 1000,
      height = input.height ?? 1000;
    if (
      ![width, height].every((n) => Number.isInteger(n) && n > 0 && n <= 10000)
    )
      throw new RantError("invalidPhoto");
    template = {
      id: "uploaded",
      name: "Your photo",
      description: "A photo uploaded by the user. Read the actual image.",
      imageUrl: "",
      sourceUrl: "",
      width,
      height,
    };
  } else if (input.photo || !template) throw new RantError("invalidText");
  if (!template) throw new RantError("invalidText");
  const validatedTemplate = template;
  const run = async () => {
    let template = validatedTemplate;
    const token = await deps.reserve(userId);
    let uploaded: string | null = null;
    try {
      if (photo) {
        uploaded = await deps.upload(userId, photo);
        template = { ...template, storagePath: uploaded };
      }
      await deps.reserveAttempt();
      const generated = await deps.generate(seed, template, photo);
      const captions = validateCaptionChoices(generated.captions);
      const imageUrl = uploaded ? await deps.sign(uploaded) : template.imageUrl;
      const generationId = await deps.save({
        ...generated,
        captions,
        seed,
        template,
        userId,
        token,
      });
      return {
        ...seed,
        captions,
        generationId,
        template: { ...template, imageUrl },
      };
    } catch (e) {
      if (uploaded) await deps.remove(uploaded).catch(() => {});
      await deps.release(userId, token).catch(() => {});
      if (e instanceof RantError) throw e;
      throw new RantError("aiFailed");
    }
  };
  return deps.observe
    ? deps.observe(
        {
          prompt: seed.prompt,
          metadata: {
            language: seed.language,
            template_id: seed.templateId,
            has_photo: !!photo,
          },
        },
        run,
      )
    : run();
}
