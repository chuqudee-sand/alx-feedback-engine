import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Program host email → program name ─────────────────────────────────────────
const PROGRAM_EMAILS: Record<string, string> = {
  'aice@alxafrica.com':           'AiCE',
  'vaprogram@alxafrica.com':      'Virtual Assistant',
  'alxfoundations@alxafrica.com': 'Professional Foundations',
};

// ── Meeting topic filters ──────────────────────────────────────────────────────
// Meetings matching these keywords are internal and should be ignored
const EXCLUDED_KEYWORDS  = /dry run|check-in|check-out|sync|standup|internal/i;
// Topic keywords to classify event type
const COMMUNITY_KEYWORDS = /fire\s?side|karibu|tambali|speaker|ama|ask me anything|community/i;
const SUPPORT_KEYWORDS   = /project|office hour|assignment|clinic|support session|learner support|webinar/i;

// ── Zoom question text → Supabase column mapping ──────────────────────────────
// These are substrings of your actual Zoom poll/survey question text.
// From your Feedback Collection Framework concept note.
function mapAnswerToColumn(question: string, answer: string): Partial<SurveyEventRow> {
  const q = question.toLowerCase().trim();
  const a = (answer || '').trim();

  // "How would you rate today's session overall?" → 1–5 integer
  if (q.includes('how would you rate today') || q.includes("rate today's session")) {
    const num = parseInt(a[0]);
    if (!isNaN(num) && num >= 1 && num <= 5) return { session_quality_csat: num };
  }

  // "Did you understand the learning outcomes of this session?" → boolean
  if (q.includes('understand the learning outcome') || q.includes('did you understand')) {
    return { understood_outcomes: ['yes', 'true', '1'].includes(a.toLowerCase()) };
  }

  // "What is one thing that would make/have made this session more useful for you?"
  // Covers both support ("would make") and community ("would have made") phrasings
  if (q.includes('one thing that would') && q.includes('useful')) {
    return { improvement_suggestion_text: a || null };
  }

  // "Which module or topic do you find most challenging?"
  if (q.includes('module or topic') || q.includes('most challenging') || q.includes('find most challeng')) {
    return { challenging_topic_text: a || null };
  }

  return {};
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface SurveyEventRow {
  learner_email: string;
  program: string;
  event_type: string;
  event_name_date: string;
  attendance_duration_mins: number | null;
  session_quality_csat: number | null;
  understood_outcomes: boolean | null;
  improvement_suggestion_text: string | null;
  challenging_topic_text: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatEventNameDate(topic: string, startTime: string): string {
  // Matches your existing convention: "VA C15 Grace Week Support Session - May 6, 2026"
  const date = new Date(startTime);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  return `${topic} - ${formatted}`;
}

function detectEventType(topic: string): string {
  if (COMMUNITY_KEYWORDS.test(topic)) return 'Community Event';
  if (SUPPORT_KEYWORDS.test(topic))   return 'Program Team';
  return 'Community Event'; // safe default
}

async function getZoomAccessToken(): Promise<string | null> {
  const authHeader = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID!}:${process.env.ZOOM_CLIENT_SECRET!}`
  ).toString('base64');

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID!}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    console.error('Zoom auth failed:', await res.text());
    return null;
  }
  return (await res.json()).access_token;
}

async function zoomGet(endpoint: string, token: string): Promise<any> {
  const res = await fetch(`https://api.zoom.us/v2${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    console.warn(`Zoom API ${endpoint} returned ${res.status}`);
    return null;
  }
  return res.json();
}

// ── Main data collection function (runs after 3-min delay) ────────────────────
async function collectZoomData(
  meetingId: string,
  topic: string,
  hostEmail: string,
  startTime: string,
  type: 'meetings' | 'webinars'
) {
  console.log(`⏳ Waiting 3 minutes for Zoom API to finalise data for ${type} ${meetingId}...`);
  await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));
  console.log(`🚀 Starting data collection for ${type} ${meetingId}`);

  const token = await getZoomAccessToken();
  if (!token) {
    console.error('❌ Could not get Zoom access token. Aborting.');
    return;
  }

  // ── 1. Detect program from host email, with co-host fallback ──────────────
  let program = PROGRAM_EMAILS[hostEmail.toLowerCase()];

  // ── 2. Fetch participants (attendance duration + co-host detection) ─────────
  // Zoom participant roles: 1 = host, 2 = co-host, 0 = attendee
  const participantsResp = await zoomGet(`/report/${type}/${meetingId}/participants`, token);
  const participants: any[] = participantsResp?.participants || [];

  if (!program) {
    // Try co-host emails as fallback
    const coHosts = participants.filter(p => p.role === 2).map(p => p.user_email?.toLowerCase());
    for (const email of coHosts) {
      if (email && PROGRAM_EMAILS[email]) {
        program = PROGRAM_EMAILS[email];
        console.log(`📧 Program detected from co-host email: ${email} → ${program}`);
        break;
      }
    }
  }

  if (!program) {
    console.warn(`⚠️ Could not detect program from host '${hostEmail}' or co-hosts. Defaulting to AiCE.`);
    program = 'AiCE';
  }

  const eventType     = detectEventType(topic);
  const eventNameDate = formatEventNameDate(topic, startTime);

  console.log(`📡 Event: ${eventNameDate} | Program: ${program} | Type: ${eventType}`);

  if (!participants.length) {
    console.warn(`⚠️ No participants found for ${meetingId}. Skipping.`);
    return;
  }

  // Build base rows keyed by email
  const rowMap: Record<string, SurveyEventRow> = {};
  for (const p of participants) {
    const email = p.user_email?.trim().toLowerCase();
    if (!email) continue;
    rowMap[email] = {
      learner_email:               email,
      program,
      event_type:                  eventType,
      event_name_date:             eventNameDate,
      attendance_duration_mins:    p.duration ? Math.round(p.duration / 60) : null,
      session_quality_csat:        null,
      understood_outcomes:         null,
      improvement_suggestion_text: null,
      challenging_topic_text:      null,
    };
  }

  // ── 3. Fetch poll results and merge into rows ──────────────────────────────
  const pollsResp = await zoomGet(`/report/${type}/${meetingId}/polls`, token);
  if (pollsResp?.questions) {
    for (const block of pollsResp.questions) {
      const email = block.email?.trim().toLowerCase();
      if (!email || !rowMap[email]) continue;
      for (const qa of block.question_details || []) {
        const mapped = mapAnswerToColumn(qa.question, qa.answer);
        Object.assign(rowMap[email], mapped);
      }
    }
  }

  // ── 4. Fetch survey results and merge into rows ────────────────────────────
  const surveyResp = await zoomGet(`/report/${type}/${meetingId}/survey`, token);
  if (surveyResp?.questions) {
    for (const block of surveyResp.questions) {
      const email = block.email?.trim().toLowerCase();
      // Survey respondents may not have attended (edge case) — add them if missing
      if (!email) continue;
      if (!rowMap[email]) {
        rowMap[email] = {
          learner_email:               email,
          program,
          event_type:                  eventType,
          event_name_date:             eventNameDate,
          attendance_duration_mins:    null,
          session_quality_csat:        null,
          understood_outcomes:         null,
          improvement_suggestion_text: null,
          challenging_topic_text:      null,
        };
      }
      for (const qa of block.question_details || []) {
        const mapped = mapAnswerToColumn(qa.question, qa.answer);
        Object.assign(rowMap[email], mapped);
      }
    }
  }

  const rows = Object.values(rowMap);

  if (!rows.length) {
    console.warn(`⚠️ No rows to insert for ${eventNameDate}`);
    return;
  }

  // ── 5. Upsert into Supabase ────────────────────────────────────────────────
  // on_conflict: learner_email + event_name_date prevents duplicates if
  // the webhook fires twice, AND allows a learner attending two different
  // sessions on the same day to have separate rows (different event_name_date).
  const { error } = await supabase
    .from('survey_events')
    .upsert(rows, { onConflict: 'learner_email,event_name_date' });

  if (error) {
    console.error(`❌ Supabase upsert error for ${eventNameDate}:`, error.message);
  } else {
    console.log(`✅ Saved ${rows.length} attendee rows for: ${eventNameDate}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTE HANDLER
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = body.event;

    // ── Zoom URL validation challenge ────────────────────────────────────────
    // Zoom sends this when you first save/validate the webhook URL.
    // Must respond synchronously with the encrypted token.
    if (event === 'endpoint.url_validation') {
      const hash = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET!)
        .update(body.payload.plainToken)
        .digest('hex');
      console.log('✅ Zoom URL validation challenge answered.');
      return NextResponse.json(
        { plainToken: body.payload.plainToken, encryptedToken: hash },
        { status: 200 }
      );
    }

    // ── meeting.ended or webinar.ended ───────────────────────────────────────
    if (event === 'meeting.ended' || event === 'webinar.ended') {
      const { id: meetingId, topic, host_email, start_time } = body.payload.object;
      const type: 'meetings' | 'webinars' = event === 'webinar.ended' ? 'webinars' : 'meetings';

      // Filter 1: Unrecognised host + no co-host check possible yet → let
      // collectZoomData handle the co-host fallback after fetching participants.
      // We only hard-block if it's clearly an internal meeting by topic.
      if (type === 'meetings' && EXCLUDED_KEYWORDS.test(topic)) {
        console.log(`🚫 Ignored internal meeting: "${topic}"`);
        return NextResponse.json({ message: 'Ignored - Internal Meeting' }, { status: 200 });
      }

      console.log(`📨 ${event} received — Topic: "${topic}" | Host: ${host_email}`);

      // Use waitUntil so Vercel keeps the function alive after returning 200.
      // This replaces the 3-min sleep approach from the Render backend —
      // Vercel's waitUntil runs the async work without blocking the response.
      const ctx = (request as any)[Symbol.for('NextRequest.waitUntil')];
      const work = collectZoomData(meetingId, topic, host_email, start_time, type);

      if (ctx) {
        ctx(work); // Vercel edge runtime
      } else {
        work.catch(console.error); // fallback: fire and forget
      }

      return NextResponse.json({ message: 'Received — processing in background' }, { status: 200 });
    }

    // Any other Zoom event — acknowledge and ignore
    return NextResponse.json({ message: 'Event type not handled' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Error:', error?.message || error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
