import { AsyncLocalStorage } from "node:async_hooks";
import { RantError } from "../rants/validation";
import {
  parseRequest,
  type Chain,
  type GenerationPurpose,
  type ObservationInput,
} from "./registry";
type RpcResult = { data: unknown; error: unknown };
export type TelemetryClient = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<RpcResult>;
};
type Context = { client: TelemetryClient; requestId: string; chain: Chain };
const context = new AsyncLocalStorage<Context>();
function diagnostic() {
  console.error("Generation observability recording incomplete");
}
async function boundedRpc(
  client: TelemetryClient,
  name: string,
  args: Record<string, unknown>,
): Promise<RpcResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(client.rpc(name, args)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("recordingTimeout")), 2500);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function record(c: Context, payload: Record<string, unknown>) {
  try {
    const { error } = await boundedRpc(c.client, "record_llm_response", {
      p_request_id: c.requestId,
      p_response: payload,
    });
    if (error) diagnostic();
  } catch {
    diagnostic();
  }
}
export async function withGenerationTelemetry<
  T extends { generationId: string },
>(
  client: TelemetryClient,
  userId: string,
  purpose: GenerationPurpose,
  input: ObservationInput,
  operation: () => Promise<T>,
): Promise<T> {
  let request: { id: string; chain: Chain };
  try {
    const { data, error } = await boundedRpc(
      client,
      "begin_generation_request",
      {
        p_user_id: userId,
        p_purpose: purpose,
        p_prompt: input.prompt,
        p_metadata: input.metadata,
      },
    );
    if (error) throw new RantError("aiUnavailable");
    request = parseRequest(data, purpose);
  } catch {
    throw new RantError("aiUnavailable");
  }
  const c = { client, requestId: request.id, chain: request.chain };
  return context.run(c, async () => {
    let result: T;
    try {
      result = await operation();
    } catch (error) {
      const code =
        error instanceof RantError &&
        /^[a-zA-Z][a-zA-Z0-9]{0,79}$/.test(error.key)
          ? error.key
          : "aiFailed";
      try {
        const r = await boundedRpc(client, "finish_generation_request", {
          p_request_id: request.id,
          p_generation_id: null,
          p_error_code: code,
        });
        if (r.error) diagnostic();
      } catch {
        diagnostic();
      }
      throw error;
    }
    try {
      const r = await boundedRpc(client, "finish_generation_request", {
        p_request_id: request.id,
        p_generation_id: result.generationId,
        p_error_code: null,
      });
      if (r.error) diagnostic();
    } catch {
      diagnostic();
    }
    return result;
  });
}
const integer = (n: unknown) =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= 100000000
    ? n
    : undefined;
const code = (v: unknown) =>
  typeof v === "string" && /^[a-zA-Z0-9_]{1,80}$/.test(v) ? v : undefined;
type ProviderJson = {
  candidates?: {
    finishReason?: unknown;
    content?: {
      parts?: {
        text?: unknown;
        thought?: boolean;
        inlineData?: { mimeType?: unknown; data?: unknown };
      }[];
    };
  }[];
  usageMetadata?: {
    promptTokenCount?: unknown;
    candidatesTokenCount?: unknown;
  };
  promptFeedback?: { blockReason?: unknown };
};
export function projectResponse(
  value: unknown,
  status: number,
  duration: number,
): Record<string, unknown> {
  const json = value as ProviderJson | null;
  const candidate = json?.candidates?.[0];
  const parts = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts
    : [];
  const text = parts
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
  const output: Record<string, unknown> = {
    http_status: status,
    duration_ms: Math.max(0, Math.min(86400000, Math.round(duration))),
    truncated: text.length > 16000,
  };
  if (status >= 400) {
    output.error_code = "providerHttpError";
    return output;
  }
  if (text) output.output_text = text.slice(0, 16000);
  const finish = code(candidate?.finishReason),
    block = code(json?.promptFeedback?.blockReason);
  if (finish) output.finish_reason = finish;
  if (block) output.error_code = "aiBlocked";
  const input = integer(json?.usageMetadata?.promptTokenCount),
    tokens = integer(json?.usageMetadata?.candidatesTokenCount);
  if (input !== undefined) output.input_tokens = input;
  if (tokens !== undefined) output.output_tokens = tokens;
  const image = parts.find((p) => !p.thought && p.inlineData)?.inlineData;
  if (
    image &&
    ["image/png", "image/jpeg", "image/webp"].includes(
      String(image.mimeType),
    ) &&
    typeof image.data === "string"
  )
    output.output_json = {
      mime_type: image.mimeType,
      byte_length: Math.max(
        0,
        Math.floor((image.data.length * 3) / 4) -
          (image.data.endsWith("==") ? 2 : image.data.endsWith("=") ? 1 : 0),
      ),
    };
  return output;
}
export async function observedFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const c = context.getStore();
  if (!c) return fetch(input, init);
  const url = String(input);
  if (
    url !==
    `https://generativelanguage.googleapis.com/v1beta/models/${c.chain.model}:generateContent`
  )
    throw new RantError("aiUnavailable");
  const start = performance.now();
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    await record(c, {
      error_code:
        error instanceof Error &&
        ["TimeoutError", "AbortError"].includes(error.name)
          ? "aiTimeout"
          : "providerNetworkError",
      duration_ms: Math.round(performance.now() - start),
    });
    throw error;
  }
  try {
    const raw = await response.clone().text();
    let payload: Record<string, unknown>;
    if (raw.length > 8000000)
      payload = {
        http_status: response.status,
        error_code: "responseTooLarge",
        truncated: true,
      };
    else {
      try {
        payload = projectResponse(
          JSON.parse(raw),
          response.status,
          performance.now() - start,
        );
      } catch {
        payload = {
          http_status: response.status,
          error_code: "invalidProviderResponse",
        };
      }
    }
    // The existing system prompt is recorded without request headers or inline image data.
    if (typeof init?.body === "string") {
      const body = JSON.parse(init.body);
      const prompt = body?.systemInstruction?.parts
        ?.filter((p: { text?: unknown }) => typeof p.text === "string")
        .map((p: { text: string }) => p.text)
        .join("\n");
      if (typeof prompt === "string" && prompt) {
        payload.output_json = {
          ...((payload.output_json as object) ?? {}),
          system_prompt: prompt.slice(0, 4000),
        };
        if (prompt.length > 4000) payload.truncated = true;
      }
    }
    await record(c, payload);
  } catch {
    diagnostic();
  }
  return response;
}
