import GoogleSignInButton from './GoogleSignInButton';
import { safeNextPath } from '../../lib/auth';

export const metadata = {
  title: 'Sign in · ALX Feedback Engine',
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  domain: 'Please sign in with your @alxafrica.com Google account. Other accounts cannot access this dashboard.',
  expired: 'Your session expired. Please sign in again.',
  auth: 'Sign-in did not complete. Please try again.',
};

export default async function LoginPage(props: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await props.searchParams;
  const message = error ? MESSAGES[error] ?? MESSAGES.auth : null;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');`}</style>
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: '#002B56', fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">
          <h1 className="text-xl font-black tracking-tighter mb-3 leading-tight" style={{ color: '#002B56' }}>
            FEEDBACK ANALYSIS
          </h1>
          <div className="h-1 w-12 mb-6" style={{ backgroundColor: '#05F283' }} />
          <p className="text-sm mb-1 font-semibold" style={{ color: '#002B56' }}>ALX staff only</p>
          <p className="text-sm mb-8" style={{ color: '#64748B' }}>
            This dashboard contains learner feedback and is restricted to people with an @alxafrica.com account.
          </p>

          {message && (
            <div
              role="alert"
              className="mb-6 rounded-xl px-4 py-3 text-xs font-semibold"
              style={{ backgroundColor: '#FFF1F0', color: '#B42318', border: '1px solid #FFD6D2' }}
            >
              {message}
            </div>
          )}

          <GoogleSignInButton next={safeNextPath(next)} />
        </div>
      </div>
    </>
  );
}
