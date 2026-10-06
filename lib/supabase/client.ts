import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  assertSupabaseProjectUrl,
  normalizeSupabaseProjectUrl,
} from "@/lib/supabase/env";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;
  const url = normalizeSupabaseProjectUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  );
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local"
    );
  }
  assertSupabaseProjectUrl(url);
  client = createClient(url, key);
  return client;
}
