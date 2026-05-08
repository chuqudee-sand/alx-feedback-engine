import { NextRequest, NextResponse } from 'next/server';

const RENDER_BACKEND_URL = process.env.RENDER_BACKEND_URL || 'https://feedback-summarizer-kkds.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const payload = {
      program: formData.get('program') as string,
      activeTab: formData.get('activeTab') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      activeEvent: formData.get('activeEvent') as string,
      reportPeriod: formData.get('reportPeriod') as string,
    };

    // Fire the request to Render — we don't await the result, 
    // Render will respond immediately with 200 and process in background.
    await fetch(`${RENDER_BACKEND_URL}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Redirect back to the same dashboard page so the user sees the "busy" spinner
    const redirectUrl = new URL(req.headers.get('referer') || '/', req.url);
    return NextResponse.redirect(redirectUrl.toString(), { status: 303 });

  } catch (error) {
    console.error('Trigger summary error:', error);
    return NextResponse.json({ error: 'Failed to trigger summary' }, { status: 500 });
  }
}
