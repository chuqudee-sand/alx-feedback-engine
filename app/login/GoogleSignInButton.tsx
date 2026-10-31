'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function GoogleSignInButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // "hd" only pre-selects ALX accounts on Google's screen (a convenience).
        // The real enforcement is Google's Internal setting plus our server-side check.
        queryParams: { hd: 'alxafrica.com', prompt: 'select_account' },
      },
    });
    if (error) setLoading(false);
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-black tracking-wide text-white transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 shadow-md"
      style={{ backgroundColor: '#5648B7' }}
    >
      {loading ? 'Redirecting to Google…' : 'Sign in with Google'}
    </button>
  );
}
