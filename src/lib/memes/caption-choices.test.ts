import { afterEach, expect, it, vi } from "vitest";
import { generateCaptionChoices, validateCaptionChoices } from "./caption-choices";
import { findMemeTemplate } from "./templates";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const seed = { prompt: "Finals week", language: "en" as const, templateId: "405658" };
const choices = ["One more nap.", "Deadline? Declined.", "Studying the ceiling.", "Office hours are over."];
it("uses one request for four distinct captions and sends uploaded pixels with the text key", async () => {
  vi.stubEnv("GEMINI_API_KEY", "text-test");
  vi.stubEnv("GEMINI_IMAGE_API_KEY", "must-not-use");
  const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ captions: choices }) }] } }],
  }) });
  vi.stubGlobal("fetch", f);
  const r = await generateCaptionChoices(seed, findMemeTemplate("405658")!, { bytes: new Uint8Array([1,2,3]), mimeType: "image/png" });
  expect(r.captions).toEqual(choices);
  expect(f).toHaveBeenCalledTimes(1);
  const options = f.mock.calls[0][1];
  expect(options.headers["x-goog-api-key"]).toBe("text-test");
  const body = JSON.parse(options.body);
  expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: "image/png", data: "AQID" });
  expect(body.generationConfig.responseMimeType).toBe("application/json");
  expect(body.tools).toBeUndefined();
});
it.each([[], ["one"], ["a","b","c","c"], ["a","b","c",""], ["a","b","c","x".repeat(301)]].map(value => ({ value })))("rejects invalid four-choice output", ({ value }) => {
  expect(() => validateCaptionChoices(value)).toThrow("aiFailed");
});
it("does not retry rate-limited requests", async () => {
  const f = vi.fn().mockResolvedValue({ ok: false, status: 429 });
  vi.stubGlobal("fetch", f);
  await expect(generateCaptionChoices(seed, findMemeTemplate("405658")!)).rejects.toThrow("quotaExceeded");
  expect(f).toHaveBeenCalledTimes(1);
});
