import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Configuration Dictionaries
const PROGRAM_EMAILS: Record<string, string> = {
  'aice@alxafrica.com': 'AiCE',
  'vaprogram@alxafrica.com': 'Virtual Assistant',
  'alxfoundations@alxafrica.com': 'Professional Foundations'
};

const EXCLUDED_MEETING_KEYWORDS = /dry run|check-in|check-out|sync/i;
const COMMUNITY_KEYWORDS = /fire side chat|karibu|tambali|ama|ask me anything/i;
const SUPPORT_KEYWORDS = /project|office hour|assignment|clinic/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.event === 'endpoint.url_validation') {
      const hashForValidate = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET!).update(body.payload.plainToken).digest('hex');
      return NextResponse.json({ plainToken: body.payload.plainToken, encryptedToken: hashForValidate }, { status: 200 });
    }

    if (body.event === 'meeting.ended' || body.event === 'webinar.ended') {
      const { id: meetingId, topic, host_email, start_time } = body.payload.object;
      const type = body.event === 'meeting.ended' ? 'meetings' : 'webinars';
      
      // 1. FILTER: Is the host recognized?
      const programName = PROGRAM_EMAILS[host_email.toLowerCase()];
      if (!programName) {
        console.log(`Blocked: Host email ${host_email} is not a registered program account.`);
        return NextResponse.json({ message: 'Ignored - Unrecognized Host' }, { status: 200 });
      }

      // 2. FILTER: Exclude internal meetings based on title
      if (type === 'meetings' && EXCLUDED_MEETING_KEYWORDS.test(topic)) {
        console.log(`Blocked: Meeting "${topic}" contains excluded internal keywords.`);
        return NextResponse.json({ message: 'Ignored - Internal Meeting' }, { status: 200 });
      }

      // 3. CATEGORIZE: Community vs Support
      let eventType = 'Community Event'; // Default fallback
      if (COMMUNITY_KEYWORDS.test(topic)) eventType = 'Community Event';
      else if (SUPPORT_KEYWORDS.test(topic)) eventType = 'Program Team'; // Replaced Technical Mentorship

      // 4. FORMAT DATE: "VA clinic session - April 19 2026"
      const dateObj = new Date(start_time);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const eventNameDate = `${topic} - ${formattedDate}`;

      console.log(`📡 Processing: [${programName}] ${eventNameDate} (${eventType})`);

      const token = await getZoomAccessToken();
      if (!token) throw new Error("Zoom Auth Failed");

      const participants = await fetchZoomData(`/report/${type}/${meetingId}/participants`, token);
      
      if (participants?.participants?.length) {
        const surveyRows = participants.participants.map((p: any) => ({
          learner_email: p.user_email || `${p.name.replace(/\s+/g, '').toLowerCase()}@alx.dummy.com`,
          program: programName,
          event_type: eventType,
          attendance_duration_mins: Math.round(p.duration / 60),
          event_name_date: eventNameDate,
          session_quality_csat: 5, // Placeholder until poll logic is active
          understood_outcomes: true 
        }));

        await supabase.from('survey_events').insert(surveyRows);
        console.log(`✅ Saved ${surveyRows.length} attendees for ${eventNameDate}`);
      }
    }
    return NextResponse.json({ message: 'Processed' }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

async function getZoomAccessToken() {
  const authHeader = Buffer.from(`${process.env.ZOOM_CLIENT_ID!}:${process.env.ZOOM_CLIENT_SECRET!}`).toString('base64');
  const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID!}`, {
    method: 'POST', headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' }, cache: 'no-store'
  });
  return response.ok ? (await response.json()).access_token : null;
}

async function fetchZoomData(endpoint: string, token: string) {
  const response = await fetch(`https://api.zoom.us/v2${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
  return response.ok ? await response.json() : null;
}