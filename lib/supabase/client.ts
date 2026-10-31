import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from './env';

// Browser-side client. Only ever used for the "Sign in with Google" click.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
}
