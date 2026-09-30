import { afterEach, describe, expect, it, vi } from "vitest";
import { getBrowserSupabaseConfig, getSupabaseConfig } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

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

describe("getBrowserSupabaseConfig", () => {
  it("reads the public variables through statically analyzable property access", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", " https://example.supabase.co ");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", " browser-anon-key ");

    expect(getBrowserSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "browser-anon-key",
    });
  });
});
