import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ── Program email → program name ───────────────────────────────────────────────
const PROGRAM_EMAILS: Record<string, string> = {
  'aice@alxafrica.com':           'AiCE',
  'vaprogram@alxafrica.com':      'Virtual Assistant',
  'alxfoundations@alxafrica.com': 'Professional Foundations',
};

// ── Meeting topic filters ──────────────────────────────────────────────────────
const EXCLUDED_MEETING_KEYWORDS = /dry run|check-in|check-out|sync/i;
const COMMUNITY_KEYWORDS        = /fire side chat|karibu|tambali|speaker|ama|ask me anything/i;
const SUPPORT_KEYWORDS          = /project|office hour|assignment|clinic/i;

// ── Map Zoom question text → Supabase column value ────────────────────────────
// Question wording taken exactly from your Feedback Collection Framework doc.
function mapAnswer(question: string, answer: string): Record<string, any> {
  const q = question.toLowerCase().trim();
  const a = (answer || '').trim();

  // "How would you rate today's session overall?" → 1–5 integer
  if (q.includes("how would you rate today") || q.includes("rate today's session")) {
    const num = parseInt(a[0]);
    if (!isNaN(num) && num >= 1 && num <= 5) return { session_quality_csat: num };
  }

  // "Did you understand the learning outcomes of this session?" → boolean
  if (q.includes("understand the learning outcome") || q.includes("did you understand")) {
    return { understood_outcomes: ['yes', 'true', '1'].includes(a.toLowerCase()) };
  }

  // "What is one thing that would make/have made this session more useful for you?"
  // Covers both support ("would make") and community ("would have made") phrasings
  if (q.includes("one thing that would") && q.includes("useful")) {
    return { improvement_suggestion_text: a || null };
  }

  // "Which module or topic do you find most challenging?"
  if (q.includes("module or topic") || q.includes("most challenging")) {
    return { challenging_topic_text: a || null };
  }

  return {};
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ── Zoom URL validation challenge ──────────────────────────────────────────
    if (body.event === 'endpoint.url_validation') {
      const hashForValidate = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET!)
        .update(body.payload.plainToken)
        .digest('hex');
      return NextResponse.json(
        { plainToken: body.payload.plainToken, encryptedToken: hashForValidate },
        { status: 200 }
      );
    }

    if (body.event === 'meeting.ended' || body.event === 'webinar.ended') {
      const { id: meetingId, topic, host_email, start_time } = body.payload.object;
      const type = body.event === 'webinar.ended' ? 'webinars' : 'meetings';

      // 1. FILTER: Exclude internal meetings by title
      if (type === 'meetings' && EXCLUDED_MEETING_KEYWORDS.test(topic)) {
        console.log(`Blocked internal meeting: "${topic}"`);
        return NextResponse.json({ message: 'Ignored - Internal Meeting' }, { status: 200 });
      }

      // 2. CATEGORIZE: Community vs Support (from topic)
      let eventType = 'Community Event';
      if (COMMUNITY_KEYWORDS.test(topic))    eventType = 'Community Event';
      else if (SUPPORT_KEYWORDS.test(topic)) eventType = 'Program Team';

      // 3. FORMAT: "Support Clinic - May 10, 2026"
      const dateObj       = new Date(start_time);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const eventNameDate = `${topic} - ${formattedDate}`;

      console.log(`📨 ${body.event} received — "${eventNameDate}" | Host: ${host_email}`);

      // Fire and forget — return 200 to Zoom immediately, process in background
      processZoomData(meetingId, type, host_email, eventType, eventNameDate).catch(console.error);
    }

    return NextResponse.json({ message: 'Received' }, { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// ── Main data collection (runs in background after Zoom fires the webhook) ─────
async function processZoomData(
  meetingId: string,
  type: string,
  hostEmail: string,
  eventType: string,
  eventNameDate: string
) {
  const token = await getZoomAccessToken();
  if (!token) { console.error('Zoom auth failed'); return; }

  // ── 1. Fetch participants ──────────────────────────────────────────────────
  const participantsData = await fetchZoomData(`/report/${type}/${meetingId}/participants`, token);
  const participants: any[] = participantsData?.participants || [];

  // ── 2. Detect program: host email first, then co-host fallback ────────────
  let programName = PROGRAM_EMAILS[hostEmail.toLowerCase()];

  if (!programName) {
    const coHosts = participants.filter((p: any) => p.role === 2);
    for (const coHost of coHosts) {
      const coEmail = (coHost.user_email || '').toLowerCase();
      if (PROGRAM_EMAILS[coEmail]) {
        programName = PROGRAM_EMAILS[coEmail];
        console.log(`Program detected from co-host: ${coEmail} → ${programName}`);
        break;
      }
    }
  }

  if (!programName) {
    console.warn(`Unrecognised host "${hostEmail}" and no matching co-host. Defaulting to AiCE.`);
    programName = 'AiCE';
  }

  console.log(`Processing: [${programName}] ${eventNameDate} (${eventType})`);

  if (!participants.length) {
    console.warn(`No participants found for ${meetingId}`);
    return;
  }

  // ── 3. Build base rows from participant list ───────────────────────────────
  const rowMap: Record<string, any> = {};
  for (const p of participants) {
    const email = (p.user_email || '').trim().toLowerCase();
    if (!email) continue;
    rowMap[email] = {
      learner_email:               email,
      program:                     programName,
      event_type:                  eventType,
      event_name_date:             eventNameDate,
      attendance_duration_mins:    p.duration ? Math.round(p.duration / 60) : null,
      session_quality_csat:        null,
      understood_outcomes:         null,
      improvement_suggestion_text: null,
      challenging_topic_text:      null,
    };
  }

  // ── 4. Fetch poll results and merge answers into rows ──────────────────────
  const pollData = await fetchZoomData(`/report/${type}/${meetingId}/polls`, token);
  if (pollData?.questions) {
    for (const block of pollData.questions) {
      const email = (block.email || '').trim().toLowerCase();
      if (!email || !rowMap[email]) continue;
      for (const qa of block.question_details || []) {
        Object.assign(rowMap[email], mapAnswer(qa.question, qa.answer));
      }
    }
  }

  // ── 5. Fetch survey results and merge answers into rows ────────────────────
  const surveyData = await fetchZoomData(`/report/${type}/${meetingId}/survey`, token);
  if (surveyData?.questions) {
    for (const block of surveyData.questions) {
      const email = (block.email || '').trim().toLowerCase();
      if (!email) continue;
      if (!rowMap[email]) {
        rowMap[email] = {
          learner_email:               email,
          program:                     programName,
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
        Object.assign(rowMap[email], mapAnswer(qa.question, qa.answer));
      }
    }
  }

  const rows = Object.values(rowMap);
  if (!rows.length) { console.warn('No rows to insert'); return; }

  // ── 6. Upsert — prevents duplicates if webhook fires twice ────────────────
  const { error } = await supabase
    .from('survey_events')
    .upsert(rows, { onConflict: 'learner_email,event_name_date' });

  if (error) {
    console.error(`Supabase upsert error for "${eventNameDate}":`, error.message);
  } else {
    console.log(`✅ Saved ${rows.length} attendee rows for: ${eventNameDate}`);
  }
}

// ── Zoom API helpers ───────────────────────────────────────────────────────────
async function getZoomAccessToken(): Promise<string | null> {
  const authHeader = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID!}:${process.env.ZOOM_CLIENT_SECRET!}`
  ).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID!}`,
    { method: 'POST', headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' }, cache: 'no-store' }
  );
  return res.ok ? (await res.json()).access_token : null;
}

async function fetchZoomData(endpoint: string, token: string): Promise<any> {
  const res = await fetch(`https://api.zoom.us/v2${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) { console.warn(`Zoom API ${endpoint} → ${res.status}`); return null; }
  return res.json();
}
