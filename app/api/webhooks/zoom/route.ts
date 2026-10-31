import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifyZoomSignature } from '../../../../lib/verifyZoom';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PROGRAM_EMAILS: Record<string, string> = {
  'aice@alxafrica.com':           'AiCE',
  'vaprogram@alxafrica.com':      'Virtual Assistant',
  'alxfoundations@alxafrica.com': 'Professional Foundations',
};

const EXCLUDED_MEETING_KEYWORDS = /dry run|check-in|check-out|sync/i;
const COMMUNITY_KEYWORDS        = /fire side chat|karibu|tambali|speaker|ama|ask me anything/i;
const SUPPORT_KEYWORDS          = /project|office hour|assignment|clinic/i;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text(); // signature is computed over the exact raw text
    const body = JSON.parse(rawBody);

    // ── Zoom URL validation challenge ────────────────────────────────────────
    if (body.event === 'endpoint.url_validation') {
      const hash = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET!)
        .update(body.payload.plainToken)
        .digest('hex');
      return NextResponse.json(
        { plainToken: body.payload.plainToken, encryptedToken: hash },
        { status: 200 }
      );
    }

    // ── Only accept events that genuinely come from Zoom ──────────────────────
    if (!verifyZoomSignature(rawBody, request.headers, process.env.ZOOM_WEBHOOK_SECRET)) {
      console.warn('Rejected webhook with missing or invalid Zoom signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ── meeting.ended or webinar.ended ───────────────────────────────────────
    if (body.event === 'meeting.ended' || body.event === 'webinar.ended') {
      const { id: meetingId, topic, host_email, start_time } = body.payload.object;
      const meetingType = body.event === 'webinar.ended' ? 'webinars' : 'meetings';

      // FILTER 1: Keyword filter
      if (EXCLUDED_MEETING_KEYWORDS.test(topic)) {
        console.log(`Blocked by keyword: "${topic}"`);
        return NextResponse.json({ message: 'Ignored - Internal Meeting' }, { status: 200 });
      }

      // FILTER 2: Host email must belong to a registered program
      const programName = PROGRAM_EMAILS[host_email?.toLowerCase()];
      if (!programName) {
        // We don't fetch co-hosts here anymore — Render will handle that
        // Just log it and queue anyway if it could be a co-hosted session
        console.log(`Unknown host "${host_email}" — queuing for Render to verify co-hosts`);
      }

      // CATEGORIZE
      let eventType = 'Community Event';
      if (COMMUNITY_KEYWORDS.test(topic))    eventType = 'Community Event';
      else if (SUPPORT_KEYWORDS.test(topic)) eventType = 'Program Team';

      // FORMAT date
      const dateObj       = new Date(start_time);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
      const eventNameDate = `${topic} - ${formattedDate}`;

      // ── Save to zoom_pending_jobs table — Render picks this up in 1 hour ──
      const { error } = await supabase.from('zoom_pending_jobs').insert({
        meeting_id:      String(meetingId),
        meeting_type:    meetingType,
        topic:           topic,
        host_email:      host_email,
        start_time:      start_time,
        event_name_date: eventNameDate,
        event_type:      eventType,
        program:         programName || null,  // null if host unknown — Render resolves via co-host
        status:          'pending',
      });

      if (error) {
        console.error('Failed to queue job:', error.message);
        return NextResponse.json({ error: 'Queue failed' }, { status: 500 });
      }

      console.log(`✅ Queued: "${eventNameDate}" | Host: ${host_email} | Render collects in ~1hr`);
    }

    return NextResponse.json({ message: 'Received' }, { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
