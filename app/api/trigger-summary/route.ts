import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { isAllowedStaff } from '../../../lib/auth';

const RENDER_BACKEND_URL = process.env.RENDER_BACKEND_URL || 'https://feedback-summarizer-kkds.onrender.com';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

const FIELDS = ['program', 'activeTab', 'startDate', 'endDate', 'activeEvent', 'reportPeriod'] as const;

// The host this request was addressed to (Vercel sets x-forwarded-host to the public domain).
function requestHost(req: NextRequest): string | null {
  const h = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  return h ? h.split(',')[0].trim() : null;
}

function hostOf(url: string | null): string | null {
  try {
    return url ? new URL(url).host : null;
  } catch {
    return null;
  }
}

// Only send people back to a page on this site.
function backTo(req: NextRequest): URL {
  const ref = req.headers.get('referer');
  if (ref && hostOf(ref) === requestHost(req)) return new URL(ref);
  return new URL('/', req.url);
}

export async function POST(req: NextRequest) {
  // 1. Staff only (proxy.ts also blocks anonymous callers; this is the second lock).
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!isAllowedStaff(data?.claims)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. The request must come from our own pages, not another website.
  const origin = req.headers.get('origin');
  if (origin && hostOf(origin) !== requestHost(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. The backend only listens to callers that know the shared secret.
  if (!INTERNAL_API_SECRET) {
    console.error('INTERNAL_API_SECRET is not set on Vercel');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const payload: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = form.get(f);
      if (typeof v !== 'string' || v.length === 0 || v.length > 300) {
        return NextResponse.json({ error: `Invalid field: ${f}` }, { status: 400 });
      }
      payload[f] = v;
    }

    const res = await fetch(`${RENDER_BACKEND_URL}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Secret': INTERNAL_API_SECRET },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error('Summary backend returned', res.status);
  } catch (error) {
    console.error('Trigger summary error:', error);
    return NextResponse.json({ error: 'Failed to trigger summary' }, { status: 500 });
  }

  return NextResponse.redirect(backTo(req), { status: 303 });
}
