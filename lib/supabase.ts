import { createClient } from "@supabase/supabase-js";

function requireValue(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Add it to .env.local and restart the dev server.`);
  }
  return value;
}

export function createBrowserClient() {
  const supabaseUrl = requireValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  if (typeof window === "undefined") {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  const globalWithSupabase = window as typeof window & {
    __healthflowSupabaseClient?: ReturnType<typeof createClient>;
  };

  if (!globalWithSupabase.__healthflowSupabaseClient) {
    globalWithSupabase.__healthflowSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return globalWithSupabase.__healthflowSupabaseClient;
}

export function createServiceClient() {
  const supabaseUrl = requireValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireValue(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
