import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log the incoming body to Vercel Console
    console.log("Incoming Payload:", body);

    const { data, error } = await supabase
      .from('feedback_entries')
      .insert([
        {
          learner_email: body.email,
          program: body.program,
          tag: body.tag,
          rating_score: body.rating,
          raw_response_1: body.comment, // Verify this matches your DB column!
          source: 'Widget',
        }
      ])
      .select();

    if (error) {
      // THIS IS THE KEY: Log the specific Supabase error message
      console.error("Supabase Error Details:", error.message, error.details, error.hint);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Server Crash:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}