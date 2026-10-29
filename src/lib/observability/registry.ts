import { isUuid, RantError } from "../rants/validation";
export const chainRegistry = {
  caption_choices: {
    code: "caption-choices-v1",
    model: "gemini-3.1-flash-lite",
  },
  meme_caption: { code: "meme-caption-v1", model: "gemini-3.1-flash-lite" },
  cat_image: { code: "cat-image-v1", model: "gemini-3.1-flash-lite-image" },
} as const;
export type GenerationPurpose = keyof typeof chainRegistry;
export type Chain = {
  id: string;
  code: string;
  version: number;
  step_id: string;
  model_id: string;
  model: string;
  provider: string;
};
export function parseRequest(
  value: unknown,
  purpose: GenerationPurpose,
): { id: string; chain: Chain } {
  const r = value as { id?: unknown; chain?: Partial<Chain> } | null;
  const c = r?.chain;
  const expected = chainRegistry[purpose];
  if (
    typeof r?.id !== "string" ||
    !isUuid(r.id) ||
    !c ||
    c.code !== expected.code ||
    c.model !== expected.model ||
    c.version !== 1 ||
    c.provider !== "gemini" ||
    ![c.id, c.step_id, c.model_id].every(
      (v) => typeof v === "string" && isUuid(v),
    )
  )
    throw new RantError("aiUnavailable");
  return { id: r.id, chain: c as Chain };
}
export type ObservationInput = {
  prompt: string;
  metadata: Record<string, unknown>;
};
export type ObservationRunner = <T extends { generationId: string }>(
  input: ObservationInput,
  operation: () => Promise<T>,
) => Promise<T>;
