import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

const missingSupabaseEnv = !supabaseUrl || !supabaseAnonKey;

if (missingSupabaseEnv) {
  if (import.meta.env.PROD) {
    console.error(
      "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
        "Add both in Vercel environment variables before deploying."
    );
  } else {
    console.warn(
      "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. " +
        "The app will run in offline/localStorage-only mode."
    );
  }
}

export const hasSupabase = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co"
);

const fallbackUrl = "https://placeholder.supabase.co";
const fallbackAnonKey = "placeholder";

export const supabase = createClient(
  hasSupabase ? supabaseUrl : fallbackUrl,
  hasSupabase ? supabaseAnonKey : fallbackAnonKey,
  {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  }
);
