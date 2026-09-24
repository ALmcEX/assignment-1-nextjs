import { describe, expect, it } from "vitest";
import { getSupabaseConfig } from "./env";

describe("getSupabaseConfig", () => {
  it("returns trimmed Supabase configuration", () => {
    expect(
      getSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: " https://example.supabase.co ",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: " anon-key ",
      }),
    ).toEqual({ url: "https://example.supabase.co", anonKey: "anon-key" });
  });

  it.each(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])(
    "rejects a missing or blank %s",
    (name) => {
      expect(() =>
        getSupabaseConfig({
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
          [name]: "   ",
        }),
      ).toThrow(`Missing required environment variable: ${name}`);
    },
  );
});
