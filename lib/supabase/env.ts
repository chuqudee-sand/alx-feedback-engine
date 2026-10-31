// Accepts either name for the public key, so it works whether Supabase's
// dashboard labels it "anon" or "publishable". Both are safe to expose.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_PUBLIC_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
