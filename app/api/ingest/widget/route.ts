import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the Service Role key for backend writes
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, program, tag, rating, comment } = body;

    const { data, error } = await supabase
      .from('feedback_entries')
      .insert([
        {
          learner_email: email,
          program: program,
          tag: tag,
          rating_score: rating,
          raw_response_1: comment,
          source: 'Widget', // Hardcoded so we know where it came from
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}