// ── Who counts as ALX staff ────────────────────────────────────────────────────
// Single source of truth for the access rule. Used by the proxy, the dashboard
// page, the auth callback and the API routes, so the rule can never drift apart.

export const ALLOWED_EMAIL_DOMAIN = '@alxafrica.com';

// Force a fresh Google sign-in after this long, so a departed employee's old
// browser session cannot linger. Change the number to taste.
export const MAX_SESSION_HOURS = 24;

// Works for both a Supabase User object and the claims inside a verified JWT.
type StaffLike = {
  email?: string | null;
  app_metadata?: { provider?: string } | null;
  user_metadata?: { email_verified?: boolean } | null;
  is_anonymous?: boolean | null;
};

export function isAllowedStaff(u: StaffLike | null | undefined): boolean {
  if (!u) return false;
  if (u.is_anonymous) return false;

  const email = (u.email ?? '').trim().toLowerCase();
  // endsWith('@alxafrica.com') rejects look-alikes such as
  // "x@alxafrica.com.evil.io" and "x@evilalxafrica.com".
  if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) return false;

  // Only accept accounts created through Google sign-in. This blocks anyone who
  // tries to register directly against Supabase with an email/password.
  if (u.app_metadata?.provider !== 'google') return false;

  // Google marks the email as verified; refuse if it is explicitly not.
  if (u.user_metadata?.email_verified === false) return false;

  return true;
}

// Has the user been signed in for longer than MAX_SESSION_HOURS?
export function sessionTooOld(lastSignInAt: string | null | undefined): boolean {
  if (!lastSignInAt) return false;
  const t = Date.parse(lastSignInAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > MAX_SESSION_HOURS * 60 * 60 * 1000;
}

// Only allow redirecting back to a path inside this site (prevents open redirects).
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return '/';
  if (!next.startsWith('/')) return '/';
  if (next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (next.startsWith('/login') || next.startsWith('/auth')) return '/';
  return next;
}
