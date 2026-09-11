import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only work (job ingestion, writing the
 * notifications that ingestion produces).
 *
 * This key bypasses row level security entirely, so it must never be imported
 * into a client component and must never be prefixed NEXT_PUBLIC_.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
