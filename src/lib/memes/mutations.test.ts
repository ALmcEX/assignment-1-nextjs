import { expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publishMeme } from "./mutations";
const id = "33333333-3333-4333-8333-333333333333";
it("publishes only the trusted generation ID with optional bounded text", async () => {
  let received: unknown;
  const c = {
    auth: {
      getUser: async () => ({ data: { user: { id: "owner" } }, error: null }),
    },
    rpc: async (name: string, args: unknown) => {
      received = { name, args };
      return { data: id, error: null };
    },
  } as unknown as SupabaseClient;
  expect(
    await publishMeme(c, { generationId: id, choiceIndex: 2 }),
  ).toEqual({ id });
  expect(received).toEqual({
    name: "publish_caption_choice",
    args: { p_generation_id: id, p_choice_index: 2, p_location: "" },
  });
  await expect(
    publishMeme(c, { generationId: id, choiceIndex: 4 }),
  ).rejects.toThrow("invalidText");
  await expect(publishMeme(c, { generationId: "bad" })).rejects.toThrow(
    "invalidText",
  );
});
it("rejects guests before write", async () => {
  const c = {
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  } as unknown as SupabaseClient;
  await expect(publishMeme(c, { generationId: id })).rejects.toThrow(
    "signInRequired",
  );
});
