import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from './env';

// Server-side client that reads the signed-in user from cookies.
// NOTE: this is the *session* client. The dashboard's data queries keep using
// the service-role client, which is only ever reached after the staff check.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
