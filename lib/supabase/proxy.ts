import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAllowedStaff, sessionTooOld } from '../auth';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from './env';

// Paths reachable without signing in.
//  /login, /auth/*       the sign-in flow itself
//  /api/webhooks/zoom    Zoom must reach this; the route verifies Zoom's signature
const isPublic = (p: string) =>
  p === '/login' || p.startsWith('/auth/') || p.startsWith('/api/webhooks/zoom');

function tag(res: NextResponse) {
  res.headers.set('X-Robots-Tag', 'noindex, nofollow'); // keep search engines out
  return res;
}

function redirectWithCookies(request: NextRequest, path: string, search: string, from: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = search;
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c)); // keep any refreshed session cookies
  return tag(res);
}

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Zoom's servers cannot sign in; skip session handling entirely.
  if (pathname.startsWith('/api/webhooks/zoom')) return tag(NextResponse.next({ request }));

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // getUser() asks Supabase's auth server on every request, so a deleted or banned
  // account loses access immediately instead of when its token expires.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const expired = !!user && isAllowedStaff(user) && sessionTooOld(user.last_sign_in_at);
  const allowed = isAllowedStaff(user) && !expired;

  // A session that exists but is not allowed (wrong domain / too old): clear it.
  let reason = '';
  if (user && !allowed) {
    reason = expired ? 'expired' : 'domain';
    await supabase.auth.signOut();
  }

  if (isPublic(pathname)) {
    if (allowed && pathname === '/login') return redirectWithCookies(request, '/', '', supabaseResponse);
    return tag(supabaseResponse);
  }

  if (!allowed) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
      return tag(res);
    }
    const qs = new URLSearchParams();
    qs.set('next', pathname + search);
    if (reason) qs.set('error', reason);
    return redirectWithCookies(request, '/login', `?${qs.toString()}`, supabaseResponse);
  }

  return tag(supabaseResponse);
}
