import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMemePhoto } from "./photo-url";
import { findMemeTemplate } from "./templates";
it("signs uploaded photos and leaves preset sources unchanged", async () => {
  const sign = vi.fn(async () => ({ data: { signedUrl: "https://storage.example/signed" }, error: null }));
  const c = { storage: { from: () => ({ createSignedUrl: sign }) } } as unknown as SupabaseClient;
  const preset = findMemeTemplate("405658")!;
  expect(await resolveMemePhoto(c, preset)).toEqual(preset); expect(sign).not.toHaveBeenCalled();
  const upload = { ...preset, id: "uploaded", imageUrl: "", storagePath: "owner/photo.png", sourceUrl: "" };
  expect((await resolveMemePhoto(c, upload)).imageUrl).toBe("https://storage.example/signed");
  expect(sign).toHaveBeenCalledWith("owner/photo.png", 3600);
});
it("keeps caption rendering possible when signing fails", async () => {
  const c = { storage: { from: () => ({ createSignedUrl: async () => { throw new Error("offline"); } }) } } as unknown as SupabaseClient;
  expect(await resolveMemePhoto(c, { ...findMemeTemplate("405658")!, id: "uploaded", storagePath: "owner/missing.png" })).toMatchObject({ imageError: true, imageUrl: "" });
});
