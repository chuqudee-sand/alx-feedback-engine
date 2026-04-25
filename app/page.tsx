import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// 1. Initialize Supabase (Backend Master Key)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { program?: string };
}) {
  const selectedProgram = searchParams.program || 'All';

  // 2. Fetch Data with Filtering Logic
  let query = supabase
    .from('feedback_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (selectedProgram !== 'All') {
    query = query.eq('program', selectedProgram);
  }

  const { data: entries, error } = await query;

  if (error) return <div className="p-10 text-red-500">Error: {error.message}</div>;

  // 3. Strategic Stats Calculations
  const totalEntries = entries?.length || 0;
  const avgCsat = totalEntries > 0 
    ? (entries!.reduce((acc, curr) => acc + (curr.csat_score || 0), 0) / totalEntries).toFixed(1) 
    : "0.0";
  const redFlags = entries?.filter(e => e.csat_score < 3).length || 0;

  // 4. Sidebar Links Definition
  const programs = ['All', 'AiCE', 'VA', 'SE', 'Data Analytics'];

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-8">
        <div>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
            Listener Engine
          </h2>
          <nav className="flex flex-col gap-2">
            {programs.map((p) => (
              <Link
                key={p}
                href={p === 'All' ? '/' : `/?program=${p}`}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedProgram === p 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {p}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto pt-6 border-t border-zinc-800">
           <Link href="/feedback" className="text-xs text-blue-400 hover:underline">
             + Open Internal Widget
           </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-y-auto">
        
        {/* HEADER */}
        <header className="mb-10">
          <h1 className="text-4xl font-black mb-2">
            {selectedProgram === 'All' ? 'Global Overview' : `${selectedProgram} Dashboard`}
          </h1>
          <p className="text-zinc-500 italic">Showing data from {totalEntries} learner submissions</p>
        </header>

        {/* STATS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-1 uppercase">Volume</p>
            <h3 className="text-3xl font-bold">{totalEntries}</h3>
          </div>
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-1 uppercase">Avg Satisfaction</p>
            <h3 className={`text-3xl font-bold ${Number(avgCsat) < 3.5 ? 'text-orange-500' : 'text-green-500'}`}>
              {avgCsat} <span className="text-sm font-normal text-zinc-600">/ 5</span>
            </h3>
          </div>
          <div className={`p-6 rounded-2xl border transition-all ${redFlags > 0 ? 'bg-red-950/20 border-red-900' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <p className="text-zinc-500 text-sm mb-1 uppercase">Red Flags</p>
            <h3 className={`text-3xl font-bold ${redFlags > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
              {redFlags}
            </h3>
          </div>
        </section>

        {/* DATA TABLE */}
        <section className="bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Timestamp</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Learner</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Tag</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-center">CSAT</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Comment</th>
              </tr>
            </thead>
            <tbody>
              {entries?.map((entry) => (
                <tr key={entry.id} className="border-t border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 text-sm text-zinc-600">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm font-medium">{entry.learner_email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] font-bold uppercase">
                      {entry.tag}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      entry.csat_score < 3 ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600/20 text-green-400'
                    }`}>
                      {entry.csat_score}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-400 italic">
                    "{entry.raw_text}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
