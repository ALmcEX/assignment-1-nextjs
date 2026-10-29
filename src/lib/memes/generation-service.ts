import type { ObservationRunner } from "../observability/registry";
import { RantError, textField } from "../rants/validation";
import { findMemeTemplate } from "./templates";
import { validateCaption } from "./gemini";
import type { CaptionCandidate, MemeSeed, MemeTemplate } from "./types";
type Generated = { caption: string; model: string; systemPrompt: string };
export type MemeGenerationDependencies = {
  observe?: ObservationRunner;
  configured: boolean;
  reserveUser: (id: string) => Promise<string>;
  releaseUser: (id: string, token: string) => Promise<void>;
  reserveAttempt: () => Promise<void>;
  generate: (seed: MemeSeed, template: MemeTemplate) => Promise<Generated>;
  save: (
    data: {
      userId: string;
      token: string;
      seed: MemeSeed;
      template: MemeTemplate;
    } & Generated,
  ) => Promise<string>;
};
export function validateMemeSeed(input: unknown): MemeSeed {
  if (!input || typeof input !== "object") throw new RantError("invalidText");
  const d = input as Record<string, unknown>;
  if (
    typeof d.templateId !== "string" ||
    !findMemeTemplate(d.templateId) ||
    !["en", "zh-CN"].includes(d.language as string)
  )
    throw new RantError("invalidText");
  return {
    prompt: textField(d.prompt, 1000),
    templateId: d.templateId,
    language: d.language as MemeSeed["language"],
  };
}
export async function createMemeDraft(
  userId: string | null,
  input: unknown,
  deps: MemeGenerationDependencies,
): Promise<CaptionCandidate> {
  if (!userId) throw new RantError("signInRequired");
  if (!deps.configured) throw new RantError("aiUnavailable");
  const seed = validateMemeSeed(input);
  const template = findMemeTemplate(seed.templateId)!;
  const run = async () => {
    const token = await deps.reserveUser(userId);
    try {
      await deps.reserveAttempt();
      const generated = await deps.generate(seed, template);
      const caption = validateCaption(generated.caption);
      const generationId = await deps.save({
        userId,
        token,
        seed,
        template,
        ...generated,
        caption,
      });
      return { ...seed, generationId, caption, template };
    } catch (error) {
      await deps.releaseUser(userId, token).catch(() => {});
      throw error instanceof RantError ? error : new RantError("aiFailed");
    }
  };
  return deps.observe
    ? deps.observe(
        {
          prompt: seed.prompt,
          metadata: {
            language: seed.language,
            template_id: seed.templateId,
            has_photo: false,
          },
        },
        run,
      )
    : run();
}
