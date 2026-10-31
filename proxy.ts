import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/proxy';

// Next.js 16 calls this file "proxy" (it was "middleware" in earlier versions).
// It runs before every page and API route and sends anyone who is not signed-in
// ALX staff to /login.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next's static assets and image files (so the logo shows on /login).
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
