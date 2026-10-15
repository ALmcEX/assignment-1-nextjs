import { expect, it, vi } from "vitest";
import {
  createMemeDraft,
  type MemeGenerationDependencies,
} from "./generation-service";
const seed = {
  prompt: "  deadline  ",
  templateId: "405658",
  language: "en" as const,
};
function deps(): MemeGenerationDependencies {
  return {
    configured: true,
    reserveUser: vi.fn(async () => "token"),
    releaseUser: vi.fn(async () => {}),
    reserveAttempt: vi.fn(async () => {}),
    generate: vi.fn(async () => ({
      caption: "Nope.",
      model: "gemini-3.1-flash-lite",
      systemPrompt: "system",
    })),
    save: vi.fn(async () => "saved-id"),
  };
}
it("returns the saved candidate with the actual seed and template", async () => {
  const d = deps();
  const result = await createMemeDraft("owner", seed, d);
  expect(result).toMatchObject({
    generationId: "saved-id",
    prompt: "deadline",
    caption: "Nope.",
    templateId: "405658",
    template: { id: "405658" },
  });
});
it.each([
  null,
  { ...seed, templateId: "bad" },
  { ...seed, prompt: "x".repeat(1001) },
  { ...seed, language: "bad" },
])("invalid input cannot reserve or generate", async (input) => {
  const d = deps();
  await expect(createMemeDraft("owner", input, d)).rejects.toThrow(
    "invalidText",
  );
  expect(d.reserveUser).not.toHaveBeenCalled();
});
it("disabled or anonymous requests never reserve", async () => {
  const d = deps();
  d.configured = false;
  await expect(createMemeDraft("owner", seed, d)).rejects.toThrow(
    "aiUnavailable",
  );
  await expect(createMemeDraft(null, seed, d)).rejects.toThrow(
    "signInRequired",
  );
  expect(d.reserveUser).not.toHaveBeenCalled();
});
it.each(["reserveAttempt", "generate", "save"] as const)(
  "releases user reservation on %s failure",
  async (stage) => {
    const d = deps();
    d[stage] = vi.fn().mockRejectedValue(new Error("private provider detail"));
    await expect(createMemeDraft("owner", seed, d)).rejects.toThrow("aiFailed");
    expect(d.releaseUser).toHaveBeenCalledWith("owner", "token");
    if (stage !== "save") expect(d.save).not.toHaveBeenCalled();
  },
);
it("validates output before saving", async () => {
  const d = deps();
  d.generate = vi.fn(async () => ({
    caption: "",
    model: "gemini-3.1-flash-lite",
    systemPrompt: "system",
  }));
  await expect(createMemeDraft("owner", seed, d)).rejects.toThrow("aiFailed");
  expect(d.save).not.toHaveBeenCalled();
});
