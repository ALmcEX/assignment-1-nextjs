import { createBrowserClient } from "@supabase/ssr";
import { getBrowserSupabaseConfig } from "../env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getBrowserSupabaseConfig();

  return createBrowserClient(url, anonKey);
}
