import { afterEach, expect, it, vi } from "vitest";
import { generateMemeCaption } from "./gemini";
import { findMemeTemplate } from "./templates";
const seed = {
  prompt: "Deadline tomorrow",
  templateId: "405658",
  language: "en" as const,
};
const template = findMemeTemplate("405658")!;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function reply(text: string, finishReason = "STOP") {
  return {
    ok: true,
    json: async () => ({
      candidates: [{ finishReason, content: { parts: [{ text }] } }],
    }),
  };
}
it.each(["A cat said no.", "😾".repeat(300), "<script>alert(1)</script>"])(
  "returns bounded plain text, without executing markup",
  async (caption) => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    const fetcher = vi.fn().mockResolvedValue(reply(caption));
    vi.stubGlobal("fetch", fetcher);
    expect((await generateMemeCaption(seed, template)).caption).toBe(caption);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toContain("/gemini-3.1-flash-lite:generateContent");
    const body = JSON.parse(options.body);
    expect(body.tools).toBeUndefined();
    expect(body.generationConfig.maxOutputTokens).toBe(256);
    expect(options.headers["x-goog-api-key"]).toBe("test");
  },
);
it.each(["", "😾".repeat(301)])(
  "rejects empty or oversized caption",
  async (text) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(text)));
    await expect(generateMemeCaption(seed, template)).rejects.toThrow(
      "aiFailed",
    );
  },
);
it.each(["SAFETY", "MAX_TOKENS"])(
  "rejects %s incomplete output",
  async (reason) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply("partial", reason)));
    await expect(generateMemeCaption(seed, template)).rejects.toThrow(
      "aiBlocked",
    );
  },
);
it("maps rate limit without retrying", async () => {
  const f = vi.fn().mockResolvedValue({ ok: false, status: 429 });
  vi.stubGlobal("fetch", f);
  await expect(generateMemeCaption(seed, template)).rejects.toThrow(
    "quotaExceeded",
  );
  expect(f).toHaveBeenCalledTimes(1);
});
it.each([{}, null])("rejects malformed provider response", async (value) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => value }),
  );
  await expect(generateMemeCaption(seed, template)).rejects.toThrow("aiFailed");
});
it("aborts to a controlled timeout", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new DOMException("late", "TimeoutError")),
  );
  await expect(generateMemeCaption(seed, template)).rejects.toThrow(
    "aiTimeout",
  );
});
