import { NextResponse } from 'next/server';
import crypto from 'crypto';

// This handles the incoming POST request from Zoom
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-zm-signature');
    const timestamp = request.headers.get('x-zm-request-timestamp');

    // 1. ZOOM SECURITY VALIDATION CHALLENGE
    // Zoom requires us to encrypt their challenge string using our Secret Token to prove we own the endpoint.
    if (body.event === 'endpoint.url_validation') {
      const plainToken = body.payload.plainToken;
      const secret = process.env.ZOOM_WEBHOOK_SECRET!;
      
      const hashForValidate = crypto.createHmac('sha256', secret).update(plainToken).digest('hex');
      
      console.log("Zoom Validation Successful!");
      return NextResponse.json({
        plainToken: plainToken,
        encryptedToken: hashForValidate
      }, { status: 200 });
    }

    // 2. THE "MEETING ENDED" TRIGGER
    if (body.event === 'meeting.ended' || body.event === 'webinar.ended') {
      const meetingId = body.payload.object.id;
      const meetingType = body.event === 'meeting.ended' ? 'meetings' : 'webinars';
      console.log(`Session Ended! ID: ${meetingId} Type: ${meetingType}`);

      // 3. SECURELY GET OUR SERVER-TO-SERVER OAUTH TOKEN
      const token = await getZoomAccessToken();
      
      if (token) {
        // Next phase: We will use this token to pull the Participants and Survey data!
        console.log("Successfully securely authenticated with Zoom API.");
        // await fetchZoomData(meetingId, meetingType, token);
      }
    }

    // Always return a 200 OK so Zoom knows we received the message
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- HELPER FUNCTION: GET ZOOM API TOKEN ---
async function getZoomAccessToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

  // Zoom requires the Client ID and Secret to be Base64 encoded
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    console.error("Failed to get Zoom Token:", await response.text());
    return null;
  }

  const data = await response.json();
  return data.access_token; // This token expires in 1 hour, so we fetch a fresh one every time a meeting ends!
}