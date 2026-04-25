import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('feedback_entries')
      .insert([
        {
          learner_email: body.email,
          program: body.program,
          tag: body.tag,
          source: 'Widget',
          // ALIGNED COLUMN NAMES BELOW:
          csat_score: body.rating, // Maps form 'rating' to DB 'csat_score'
          raw_text: body.comment,  // Maps form 'comment' to DB 'raw_text'
        }
      ])
      .select();

    if (error) {
      console.error("Supabase Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}