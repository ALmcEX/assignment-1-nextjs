// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  withGenerationTelemetry,
  observedFetch,
  projectResponse,
} from "./telemetry";
const id = "aa770000-0000-4000-8000-000000000001";
const chain = {
  id,
  code: "caption-choices-v1",
  version: 1,
  step_id: id,
  model_id: id,
  model: "gemini-3.1-flash-lite",
  provider: "gemini",
};
function fixture() {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const client = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ name, args });
      return {
        data: name === "begin_generation_request" ? { id, chain } : null,
        error: null as { code: string } | null,
      };
    },
  };
  return { client, calls };
}
afterEach(() => vi.unstubAllGlobals());
describe("generation telemetry", () => {
  it("prevents provider work when request initialization fails", async () => {
    const f = fixture();
    f.client.rpc = async () => ({ data: null, error: { code: "broken" } });
    let count = 0;
    await expect(
      withGenerationTelemetry(
        f.client,
        id,
        "caption_choices",
        { prompt: "cat", metadata: {} },
        async () => {
          count++;
          return { generationId: id };
        },
      ),
    ).rejects.toThrow("aiUnavailable");
    expect(count).toBe(0);
  });
  it("rejects incompatible registry definitions before execution", async () => {
    const f = fixture();
    f.client.rpc = async () => ({
      data: { id, chain: { ...chain, model: "unapproved" } },
      error: null,
    });
    let count = 0;
    await expect(
      withGenerationTelemetry(
        f.client,
        id,
        "caption_choices",
        { prompt: "cat", metadata: {} },
        async () => {
          count++;
          return { generationId: id };
        },
      ),
    ).rejects.toThrow("aiUnavailable");
    expect(count).toBe(0);
  });
  it("keeps successful media success when finalization fails without retrying generation", async () => {
    const f = fixture();
    const base = f.client.rpc;
    f.client.rpc = async (name, args) =>
      name === "finish_generation_request"
        ? { data: null, error: { code: "broken" } }
        : base(name, args);
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    let count = 0;
    const result = await withGenerationTelemetry(
      f.client,
      id,
      "caption_choices",
      { prompt: "cat", metadata: {} },
      async () => {
        count++;
        return { generationId: id };
      },
    );
    expect(result.generationId).toBe(id);
    expect(count).toBe(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
  it("records provider success separately from a later save failure", async () => {
    const f = fixture();
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: "STOP",
                content: {
                  parts: [
                    { text: "Good caption" },
                    { text: "secret thought", thought: true },
                  ],
                },
              },
            ],
            usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 6 },
          }),
          { status: 200 },
        ),
    );
    await expect(
      withGenerationTelemetry(
        f.client,
        id,
        "caption_choices",
        { prompt: "cat", metadata: {} },
        async () => {
          await observedFetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
            {
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: "System prompt" }] },
                contents: [
                  { parts: [{ inlineData: { data: "SECRET_BASE64" } }] },
                ],
              }),
              method: "POST",
              headers: { "x-goog-api-key": "SECRET_KEY" },
            },
          );
          throw new Error("SAVE FAILURE SECRET");
        },
      ),
    ).rejects.toThrow("SAVE FAILURE SECRET");
    const record = f.calls.find((c) => c.name === "record_llm_response");
    expect(record?.args.p_response).toMatchObject({
      http_status: 200,
      output_text: "Good caption",
      input_tokens: 12,
      output_tokens: 6,
    });
    expect(JSON.stringify(f.calls)).not.toMatch(
      /secret thought|SECRET_BASE64|SECRET_KEY|SAVE FAILURE SECRET/,
    );
    expect(f.calls.at(-1)?.args).toMatchObject({
      p_error_code: "aiFailed",
      p_generation_id: null,
    });
  });
  it("records a timeout with no invented HTTP status", async () => {
    const f = fixture();
    vi.stubGlobal("fetch", async () => {
      throw new DOMException("hidden", "TimeoutError");
    });
    await expect(
      withGenerationTelemetry(
        f.client,
        id,
        "caption_choices",
        { prompt: "cat", metadata: {} },
        async () => {
          await observedFetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
          );
          return { generationId: id };
        },
      ),
    ).rejects.toThrow();
    expect(
      f.calls.find((c) => c.name === "record_llm_response")?.args.p_response,
    ).toMatchObject({ error_code: "aiTimeout" });
    expect(
      f.calls.find((c) => c.name === "record_llm_response")?.args.p_response,
    ).not.toHaveProperty("http_status");
  });
  it("bounds visible text, excludes image bytes and leaves missing usage absent", () => {
    const projected = projectResponse(
      {
        candidates: [
          {
            content: {
              parts: [
                { text: "x".repeat(17000) },
                { inlineData: { mimeType: "image/png", data: "AAAA==" } },
              ],
            },
          },
        ],
      },
      200,
      100,
    );
    expect(projected.output_text).toHaveLength(16000);
    expect(projected.truncated).toBe(true);
    expect(JSON.stringify(projected)).not.toContain("AAAA");
    expect(projected.input_tokens).toBeUndefined();
    expect(projected.output_json).toMatchObject({ mime_type: "image/png" });
  });
});
