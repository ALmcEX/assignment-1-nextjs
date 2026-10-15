import { expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publishCat } from "./mutations";
const id = "33333333-3333-4333-8333-333333333333";
it("publishes a trusted generation without requiring a location", async () => {
  let args: unknown;
  const c = {
    auth: {
      getUser: async () => ({ data: { user: { id: "owner" } }, error: null }),
    },
    rpc: async (_n: string, a: unknown) => {
      args = a;
      return { data: id, error: null };
    },
  } as unknown as SupabaseClient;
  expect(await publishCat(c, { generationId: id, title: "  Cat  " })).toEqual({
    id,
  });
  expect(args).toEqual({ p_generation_id: id, p_title: "Cat", p_location: "" });
  await expect(
    publishCat(c, { generationId: id, title: "🐈".repeat(121) }),
  ).rejects.toThrow("invalidText");
});
it("rejects logged-out publication before any database write", async () => {
  const c = {
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  } as unknown as SupabaseClient;
  await expect(publishCat(c, { generationId: id })).rejects.toThrow(
    "signInRequired",
  );
});
