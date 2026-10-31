import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { isAllowedStaff, safeNextPath } from '../../../lib/auth';

// Google sends the browser back here with a one-time code. We swap it for a session,
// then check the account really is ALX staff before letting them in.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (isAllowedStaff(data.user)) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      // Signed in with Google but not an ALX account: throw the session away.
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=domain`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
