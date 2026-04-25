import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// 1. FORCE DYNAMIC: Prevents Vercel from caching the "All" view
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Dashboard(props: {
  searchParams: Promise<{ program?: string }>;
}) {
  // 2. THE FIX: Next.js 15 requires awaiting searchParams
  const searchParams = await props.searchParams;
  const selectedProgram = searchParams.program || 'All';

  let query = supabase
    .from('feedback_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (selectedProgram !== 'All') {
    query = query.eq('program', selectedProgram);
  }

  const { data: entries, error } = await query;

  const totalEntries = entries?.length || 0;
  const avgCsat = totalEntries > 0 
    ? (entries!.reduce((acc, curr) => acc + (curr.csat_score || 0), 0) / totalEntries).toFixed(1) 
    : "0.0";
  const redFlags = entries?.filter(e => e.csat_score < 3).length || 0;

  const programs = ['All', 'AiCE', 'VA', 'SE', 'Data Analytics'];

  return (
    <div className="flex min-h-screen bg-black text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-8">
        <div>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Programs</h2>
          <nav className="flex flex-col gap-2">
            {programs.map((p) => (
              <Link
                key={p}
                href={p === 'All' ? '/' : `/?program=${p}`}
                // The highlight logic will now work because selectedProgram is resolved
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedProgram === p 
                  ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                  : 'text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                {p}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">
        <header className="mb-10">
          <h1 className="text-4xl font-black">{selectedProgram === 'All' ? 'Global Overview' : selectedProgram}</h1>
          <p className="text-zinc-500">Real-time pulses from the {selectedProgram} cohort</p>
        </header>

        {/* STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-500 text-sm uppercase">Submissions</p>
            <h3 className="text-3xl font-bold">{totalEntries}</h3>
          </div>
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-500 text-sm uppercase">Avg CSAT</p>
            <h3 className={`text-3xl font-bold ${Number(avgCsat) < 3.5 ? 'text-orange-500' : 'text-green-500'}`}>{avgCsat}</h3>
          </div>
          <div className={`p-6 rounded-2xl border ${redFlags > 0 ? 'bg-red-950/20 border-red-900' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <p className="text-zinc-500 text-sm uppercase">Red Flags</p>
            <h3 className="text-3xl font-bold">{redFlags}</h3>
          </div>
        </section>

        {/* TABLE */}
        <section className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-900">
              <tr>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Learner</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Tag</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-center">Score</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Comment</th>
              </tr>
            </thead>
            <tbody>
              {entries?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-zinc-600 italic">
                    No data found for {selectedProgram}. Try submitting feedback via the widget!
                  </td>
                </tr>
              ) : (
                entries?.map((entry) => (
                  <tr key={entry.id} className="border-t border-zinc-800">
                    <td className="p-4 text-sm font-medium">{entry.learner_email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] font-bold uppercase">{entry.tag}</span>
                    </td>
                    <td className="p-4 text-center font-bold">{entry.csat_score}</td>
                    <td className="p-4 text-sm text-zinc-400 italic">"{entry.raw_text}"</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}