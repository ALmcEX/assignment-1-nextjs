import { expect, it, vi } from "vitest";
import { createCaptionChoices, type ChoiceDependencies } from "./choice-service";
const input = { prompt: "Lunch", templateId: "405658", language: "en" };
const captions = ["One", "Two", "Three", "Four"];
const deps = (): ChoiceDependencies => ({
  reserve: vi.fn(async () => "token"), release: vi.fn(async () => {}),
  reserveAttempt: vi.fn(async () => {}), generate: vi.fn(async () => ({ captions, model: "gemini-3.1-flash-lite", systemPrompt: "system" })),
  upload: vi.fn(async () => "owner/photo.png"), remove: vi.fn(async () => {}),
  sign: vi.fn(async () => "https://storage.example/photo.png"), save: vi.fn(async () => "saved"),
});
it("saves all four choices once and keeps image generation out of the flow", async () => {
  const d = deps();
  const result = await createCaptionChoices("owner", input, d);
  expect(result.captions).toEqual(captions);
  expect(d.generate).toHaveBeenCalledTimes(1);
  expect(d.save).toHaveBeenCalledWith(expect.objectContaining({ captions, userId: "owner", token: "token" }));
});
it("validates identity and uploads before any API admission", async () => {
  const d = deps();
  await expect(createCaptionChoices(null, input, d)).rejects.toThrow("signInRequired");
  await expect(createCaptionChoices("owner", { ...input, templateId: "uploaded", photo: { bytes: new Uint8Array([1,2]), mimeType: "image/png" } }, d)).rejects.toThrow("invalidPhoto");
  expect(d.reserve).not.toHaveBeenCalled();
});
it("removes an unpublished upload and releases quota on provider failure", async () => {
  const d = deps();
  d.generate = vi.fn().mockRejectedValue(new Error("provider private info"));
  const bytes = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
  await expect(createCaptionChoices("owner", { ...input, templateId: "uploaded", photo: { bytes, mimeType: "image/png" } }, d)).rejects.toThrow("aiFailed");
  expect(d.remove).toHaveBeenCalledWith("owner/photo.png");
  expect(d.release).toHaveBeenCalledWith("owner", "token");
  expect(d.save).not.toHaveBeenCalled();
});
