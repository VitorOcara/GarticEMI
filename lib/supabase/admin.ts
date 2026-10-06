import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  assertSupabaseProjectUrl,
  normalizeSupabaseProjectUrl,
} from "@/lib/supabase/env";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = normalizeSupabaseProjectUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !serviceKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local"
    );
  }
  assertSupabaseProjectUrl(url);
  admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
