import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
