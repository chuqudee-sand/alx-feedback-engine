import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PROGRAM_EMAILS: Record<string, string> = {
  'aice@alxafrica.com':           'AiCE',
  'vaprogram@alxafrica.com':      'Virtual Assistant',
  'alxfoundations@alxafrica.com': 'Professional Foundations',
};

const EXCLUDED_MEETING_KEYWORDS = /dry run|check-in|check-out|sync/i;
const COMMUNITY_KEYWORDS        = /fire side chat|karibu|tambali|speaker|ama|ask me anything/i;
const SUPPORT_KEYWORDS          = /project|office hour|assignment|clinic/i;

function mapAnswer(question: string, answer: string): Record<string, any> {
  const q = question.toLowerCase().trim();
  const a = (answer || '').trim();

  if (q.includes("how would you rate today") || q.includes("rate today's session")) {
    const num = parseInt(a[0]);
    if (!isNaN(num) && num >= 1 && num <= 5) return { session_quality_csat: num };
  }
  if (q.includes("understand the learning outcome") || q.includes("did you understand")) {
    return { understood_outcomes: ['yes', 'true', '1'].includes(a.toLowerCase()) };
  }
  if (q.includes("one thing that would") && q.includes("useful")) {
    return { improvement_suggestion_text: a || null };
  }
  if (q.includes("module or topic") || q.includes("most challenging")) {
    return { challenging_topic_text: a || null };
  }
  return {};
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

      // FILTER 1: Exclude by topic keyword (applies to both meetings and webinars)
      if (EXCLUDED_MEETING_KEYWORDS.test(topic)) {
        console.log(`Blocked by keyword: "${topic}"`);
        return NextResponse.json({ message: 'Ignored - Internal Meeting' }, { status: 200 });
      }

      // FILTER 2: Reject if host is not a registered program account.
      // If host doesn't match, fetch participants to check co-hosts before rejecting.
      let programName = PROGRAM_EMAILS[host_email.toLowerCase()];

      if (!programName) {
        const tokenForCheck = await getZoomAccessToken();
        if (!tokenForCheck) throw new Error('Zoom Auth Failed');
        const checkData = await fetchZoomData(`/report/${type}/${meetingId}/participants`, tokenForCheck);
        const coHosts = (checkData?.participants || []).filter((p: any) => p.role === 2);
        for (const coHost of coHosts) {
          const coEmail = (coHost.user_email || '').toLowerCase();
          if (PROGRAM_EMAILS[coEmail]) {
            programName = PROGRAM_EMAILS[coEmail];
            console.log(`Program from co-host: ${coEmail} → ${programName}`);
            break;
          }
        }
        if (!programName) {
          console.log(`Blocked: host "${host_email}" and all co-hosts are unregistered.`);
          return NextResponse.json({ message: 'Ignored - Unrecognised Host' }, { status: 200 });
        }
      }

      // CATEGORIZE: Community vs Support (from topic)
      let eventType = 'Community Event';
      if (COMMUNITY_KEYWORDS.test(topic))    eventType = 'Community Event';
      else if (SUPPORT_KEYWORDS.test(topic)) eventType = 'Program Team';

      // FORMAT date
      const dateObj       = new Date(start_time);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const eventNameDate = `${topic} - ${formattedDate}`;

      console.log(`📨 ${body.event} — "${eventNameDate}" | Program: ${programName}`);

      const token = await getZoomAccessToken();
      if (!token) throw new Error('Zoom Auth Failed');

      // Fetch participants for data collection
      const participantsData = await fetchZoomData(`/report/${type}/${meetingId}/participants`, token);
      const participants: any[] = participantsData?.participants || [];

      if (!participants.length) {
        console.warn(`No participants found for ${meetingId}`);
        return NextResponse.json({ message: 'No participants' }, { status: 200 });
      }

      // 3. Build base rows from participants
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

      // 4. Fetch polls and merge answers
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

      // 5. Fetch survey and merge answers
      const surveyData = await fetchZoomData(`/report/${type}/${meetingId}/survey`, token);
      if (surveyData?.questions) {
        for (const block of surveyData.questions) {
          const email = (block.email || '').trim().toLowerCase();
          if (!email) continue;
          if (!rowMap[email]) {
            rowMap[email] = {
              learner_email: email, program: programName,
              event_type: eventType, event_name_date: eventNameDate,
              attendance_duration_mins: null, session_quality_csat: null,
              understood_outcomes: null, improvement_suggestion_text: null,
              challenging_topic_text: null,
            };
          }
          for (const qa of block.question_details || []) {
            Object.assign(rowMap[email], mapAnswer(qa.question, qa.answer));
          }
        }
      }

      const rows = Object.values(rowMap);
      if (!rows.length) {
        console.warn('No rows to insert');
        return NextResponse.json({ message: 'No rows' }, { status: 200 });
      }

      // 6. Upsert into Supabase
      const { error } = await supabase
        .from('survey_events')
        .upsert(rows, { onConflict: 'learner_email,event_name_date' });

      if (error) {
        console.error(`Supabase upsert error: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`✅ Saved ${rows.length} attendees for ${eventNameDate}`);
    }

    return NextResponse.json({ message: 'Processed' }, { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

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
