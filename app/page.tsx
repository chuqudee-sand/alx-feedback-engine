import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Dashboard(props: {
  searchParams: Promise<{ 
    program?: string; 
    tab?: string; 
    year?: string; 
    quarter?: string; 
  }>;
}) {
  const params = await props.searchParams;
  const program = params.program || 'AiCE';
  const activeTab = params.tab || 'onboarding';
  const year = params.year || '2026';
  const quarter = params.quarter || 'Q1';

  // 1. Time Filtering Logic
  const quarterMap: Record<string, { start: string; end: string }> = {
    Q1: { start: '01-01', end: '04-30' },
    Q2: { start: '05-01', end: '08-31' },
    Q3: { start: '09-01', end: '12-31' },
  };
  const startDate = `${year}-${quarterMap[quarter].start}T00:00:00Z`;
  const endDate = `${year}-${quarterMap[quarter].end}T23:59:59Z`;

  // 2. Dynamic Table Selection based on Tab
  const tableMap: Record<string, string> = {
    onboarding: 'survey_onboarding',
    eop: 'survey_eop',
    events: 'survey_events',
    peerfinder: 'survey_peerfinder',
  };

  const { data: entries, error } = await supabase
    .from(tableMap[activeTab])
    .select('*')
    .eq('program', program)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  // 3. Metric Calculations
  const total = entries?.length || 0;
  
  // CSAT Calculation logic per touchpoint
  const getCsat = () => {
    if (!entries || total === 0) return 0;
    const col = {
      onboarding: 'sat_next_steps',
      eop: 'overall_sat',
      events: 'session_quality_csat',
      peerfinder: 'experience_rating'
    }[activeTab];
    const highScores = entries.filter(e => e[col!] >= 4).length;
    return ((highScores / total) * 100).toFixed(1);
  };

  // NPS Logic (EOP Only)
  const nps = (() => {
    if (activeTab !== 'eop' || !entries || total === 0) return null;
    const promoters = entries.filter(e => e.nps_score >= 9).length;
    const detractors = entries.filter(e => e.nps_score <= 6).length;
    const pPct = (promoters / total) * 100;
    const dPct = (detractors / total) * 100;
    return { 
      score: (pPct - dPct).toFixed(0),
      promoters: pPct.toFixed(0),
      passives: ((entries.filter(e => e.nps_score === 7 || e.nps_score === 8).length / total) * 100).toFixed(0),
      detractors: dPct.toFixed(0)
    };
  })();

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-100">
      {/* SIDEBAR - PROGRAM SELECTION */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-8 bg-zinc-950">
        <div className="flex items-center gap-2 px-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          <h1 className="font-black tracking-tighter text-xl">LISTENER v2.0</h1>
        </div>
        
        <nav className="flex flex-col gap-1">
          {['AiCE', 'VA', 'SE', 'Data Analytics'].map(p => (
            <Link key={p} href={`/?program=${p}&tab=${activeTab}&year=${year}&quarter=${quarter}`} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${program === p ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
              {p}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {/* TOP BAR - FILTERS */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-black tracking-tight">{program} <span className="text-zinc-700">/</span> {activeTab.toUpperCase()}</h2>
            <p className="text-zinc-500 mt-1">Self-paced Feedback Collection Framework [cite: 173-175]</p>
          </div>
          
          <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {['Q1', 'Q2', 'Q3'].map(q => (
              <Link key={q} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${q}`}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${quarter === q ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>
                {q}
              </Link>
            ))}
          </div>
        </header>

        {/* TOUCHPOINT TABS */}
        <div className="flex gap-4 border-b border-zinc-800 mb-10">
          {[
            { id: 'onboarding', label: 'Start: Onboarding' },
            { id: 'events', label: 'During: Support Events' },
            { id: 'peerfinder', label: 'During: PeerFinder' },
            { id: 'eop', label: 'End: Program Exit' }
          ].map(t => (
            <Link key={t.id} href={`/?program=${program}&tab=${t.id}&year=${year}&quarter=${quarter}`}
              className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === t.id ? 'border-blue-600 text-blue-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* SCORE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Respondents</p>
            <h4 className="text-3xl font-black">{total}</h4>
          </div>
          
          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">CSAT %</p>
            <h4 className={`text-3xl font-black ${Number(getCsat()) < 70 ? 'text-orange-500' : 'text-green-500'}`}>{getCsat()}%</h4>
          </div>

          {activeTab === 'eop' && nps && (
            <>
              <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Net Promoter Score</p>
                <h4 className="text-3xl font-black text-blue-500">{nps.score}</h4>
              </div>
              <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-green-500">P: {nps.promoters}%</span>
                  <span className="text-zinc-500">P: {nps.passives}%</span>
                  <span className="text-red-500">D: {nps.detractors}%</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden mt-2">
                  <div style={{ width: `${nps.promoters}%` }} className="bg-green-500" />
                  <div style={{ width: `${nps.passives}%` }} className="bg-zinc-700" />
                  <div style={{ width: `${nps.detractors}%` }} className="bg-red-500" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* INTELLIGENCE & VISUALS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-6">
              <h3 className="font-bold mb-6 text-zinc-400 uppercase text-xs">Qualitative Feed</h3>
              <div className="space-y-4">
                {entries?.map(entry => (
                  <div key={entry.id} className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-mono text-zinc-600">{entry.learner_email}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold">{entry.created_at.split('T')[0]}</span>
                    </div>
                    <p className="text-sm italic text-zinc-300">"{entry.unclear_aspects_text || entry.additional_support_resources_text || entry.improvement_suggestion_text || entry.raw_text || 'No comment provided.'}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT COL: INTELLIGENCE */}
          <aside className="space-y-6">
            <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="text-blue-500 font-bold text-xs uppercase mb-4">Pillar Health (Matrix)</h3>
              {activeTab === 'onboarding' ? (
                <div className="space-y-4">
                  <Pillar label="Platform Readiness" score={calculateAvg(entries, 'access_support_tools')} />
                  <Pillar label="Comms Clarity" score={calculateAvg(entries, 'comms_useful')} />
                  <Pillar label="Mentor Access" score={calculateAvg(entries, 'access_tech_mentors')} />
                </div>
              ) : activeTab === 'eop' ? (
                <div className="space-y-4">
                  <Pillar label="LEA Support" score={calculateAvg(entries, 'supp_lea')} />
                  <Pillar label="PeerFinder" score={calculateAvg(entries, 'supp_peerfinder')} />
                  <Pillar label="Career Impact" score={calculateAvg(entries, 'career_impact')} />
                </div>
              ) : (
                <p className="text-zinc-600 text-sm italic">Detailed pillar metrics only available for Onboarding and EOP touchpoints.</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// HELPER COMPONENTS & LOGIC
function calculateAvg(data: any[] | null, col: string) {
  if (!data || data.length === 0) return 0;
  const valid = data.filter(d => d[col] !== null);
  if (valid.length === 0) return 0;
  return (valid.reduce((acc, curr) => acc + curr[col], 0) / valid.length).toFixed(1);
}

function Pillar({ label, score }: { label: string, score: any }) {
  const pct = (Number(score) / 5) * 100;
  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className={Number(score) < 3.5 ? 'text-orange-500' : 'text-green-500'}>{score} / 5</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%` }} className={`h-full ${Number(score) < 3.5 ? 'bg-orange-500' : 'bg-green-500'}`} />
      </div>
    </div>
  );
}
