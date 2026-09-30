import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "../env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig(process.env);

  return createBrowserClient(url, anonKey);
}
