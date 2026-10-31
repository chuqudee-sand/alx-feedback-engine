import crypto from 'crypto';

// Zoom signs every event it sends: HMAC-SHA256 of "v0:<timestamp>:<raw body>"
// using the webhook secret token. Without this check, anyone who finds the URL
// could post fake meeting events.
export function verifyZoomSignature(rawBody: string, headers: Headers, secret: string | undefined): boolean {
  if (!secret) return false;
  const ts = headers.get('x-zm-request-timestamp');
  const sig = headers.get('x-zm-signature');
  if (!ts || !sig) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false; // reject replays

  const expected = 'v0=' + crypto.createHmac('sha256', secret).update(`v0:${ts}:${rawBody}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
