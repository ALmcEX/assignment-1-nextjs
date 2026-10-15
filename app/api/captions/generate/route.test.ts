import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ user: null as { id: string } | null, generation: null as unknown, create: vi.fn(), download: vi.fn() }));
vi.mock("@/src/lib/supabase/server", () => ({ createServerSupabaseClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
  from: () => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: state.generation, error: null }) }; return q; },
}) }));
vi.mock("@/src/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => ({
  storage: { from: () => ({ download: state.download }) },
}) }));
vi.mock("@/src/lib/memes/choice-service", () => ({ createCaptionChoices: state.create }));
import { POST } from "./route";
afterEach(() => { state.user = null; state.generation = null; vi.clearAllMocks(); vi.unstubAllEnvs(); });
function configured() {
  state.user = { id: "91919191-9191-4191-8191-919191919191" };
  vi.stubEnv("GEMINI_TEXT_ENABLED", "true"); vi.stubEnv("GEMINI_API_KEY", "test"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test");
}
function request(body: FormData = new FormData(), origin = "https://app.example") {
  return new Request("https://app.example/api/captions/generate", { method: "POST", headers: { origin }, body });
}
it("blocks guests and foreign origins before generation", async () => {
  expect((await POST(request(undefined, "https://evil.example"))).status).toBe(403);
  expect((await POST(request())).status).toBe(401);
  expect(state.create).not.toHaveBeenCalled();
});
it("fails closed while text generation is disabled", async () => {
  state.user = { id: "owner" };
  expect((await POST(request())).status).toBe(503);
});
it("denies another user's photo reference before downloading or generating", async () => {
  configured();
  const b = new FormData(); b.set("templateId", "uploaded"); b.set("reuseGenerationId", "93939393-9393-4393-8393-939393939393");
  expect((await POST(request(b))).status).toBe(400);
  expect(state.download).not.toHaveBeenCalled(); expect(state.create).not.toHaveBeenCalled();
});
it("sends preset input to the four-choice service without a photo", async () => {
  configured(); state.create.mockResolvedValue({ generationId: "saved", captions: ["a","b","c","d"] });
  const b = new FormData(); b.set("templateId", "405658"); b.set("prompt", "Finals"); b.set("language", "en");
  expect((await POST(request(b))).status).toBe(200);
  expect(state.create).toHaveBeenCalledWith(state.user!.id, expect.objectContaining({ prompt: "Finals", templateId: "405658", photo: undefined }), expect.anything());
});
