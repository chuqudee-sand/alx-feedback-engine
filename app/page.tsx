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

  // 1. Time Filtering Logic (Framework Milestone Alignment)
  const quarterMap: Record<string, { start: string; end: string }> = {
    Q1: { start: '01-01', end: '04-30' },
    Q2: { start: '05-01', end: '08-31' },
    Q3: { start: '09-01', end: '12-31' },
  };
  const startDate = `${year}-${quarterMap[quarter].start}T00:00:00Z`;
  const endDate = `${year}-${quarterMap[quarter].end}T23:59:59Z`;

  // 2. Data Fetching Strategy (Table & Event Type Filtering)
  const tableMap: Record<string, string> = {
    onboarding: 'survey_onboarding',
    community: 'survey_events',
    support: 'survey_events',
    eop: 'survey_eop',
  };

  let query = supabase
    .from(tableMap[activeTab])
    .select('*')
    .eq('program', program)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Separate Community from Support Webinars [cite: 119, 135]
  if (activeTab === 'community') query = query.eq('event_type', 'Community Event');
  if (activeTab === 'support') query = query.eq('event_type', 'Technical Mentorship');

  const { data: entries, error } = await query.order('created_at', { ascending: false });

  // 3. Metric Calculations
  const total = entries?.length || 0;
  
  const getCsat = () => {
    if (!entries || total === 0) return 0;
    const col = {
      onboarding: 'sat_next_steps',
      community: 'session_quality_csat',
      support: 'session_quality_csat',
      eop: 'overall_sat'
    }[activeTab];
    const highScores = entries.filter(e => e[col!] >= 4).length;
    return ((highScores / total) * 100).toFixed(1);
  };

  const nps = (() => {
    if (activeTab !== 'eop' || !entries || total === 0) return null;
    const promoters = entries.filter(e => e.nps_score >= 9).length;
    const detractors = entries.filter(e => e.nps_score <= 6).length;
    const pPct = (promoters / total) * 100;
    const dPct = (detractors / total) * 100;
    return { 
      score: (pPct - dPct).toFixed(0),
      p: pPct.toFixed(0),
      ps: ((entries.filter(e => e.nps_score === 7 || e.nps_score === 8).length / total) * 100).toFixed(0),
      d: dPct.toFixed(0)
    };
  })();

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-100 font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-900 p-8 flex flex-col gap-10 bg-black">
        <div className="space-y-1">
          <h1 className="font-black text-xl tracking-tighter text-white">FEEDBACK ANALYSIS</h1>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Architectural View</p>
        </div>
        
        <nav className="flex flex-col gap-2">
          {['AiCE', 'VA', 'SE', 'Data Analytics', 'Cyber Security'].map(p => (
            <Link key={p} href={`/?program=${p}&tab=${activeTab}&year=${year}&quarter=${quarter}`} 
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${program === p ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
              {p}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black text-white">{program} <span className="text-zinc-800 mx-2">/</span> {activeTab.replace(/([A-Z])/g, ' $1')}</h2>
            <p className="text-zinc-500 text-sm mt-1">Milestone Analysis: {quarter} {year}</p>
          </div>
          
          <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            {['Q1', 'Q2', 'Q3'].map(q => (
              <Link key={q} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${q}`}
                className={`px-5 py-2 rounded-lg text-[10px] font-black transition-all ${quarter === q ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {q}
              </Link>
            ))}
          </div>
        </header>

        {/* TABS */}
        <div className="flex gap-8 border-b border-zinc-900 mb-12">
          {[
            { id: 'onboarding', label: 'Onboarding' },
            { id: 'community', label: 'Community Events' },
            { id: 'support', label: 'Learner Support Webinars' },
            { id: 'eop', label: 'End of Program' }
          ].map(t => (
            <Link key={t.id} href={`/?program=${program}&tab=${t.id}&year=${year}&quarter=${quarter}`}
              className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === t.id ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card label="Total Respondents" value={total} />
          <Card label="CSAT %" value={`${getCsat()}%`} color={Number(getCsat()) < 75 ? 'text-orange-500' : 'text-green-500'} />
          
          {activeTab === 'eop' && nps && (
            <>
              <Card label="NPS Score" value={nps.score} color="text-blue-500" />
              <div className="bg-zinc-900/20 p-6 rounded-3xl border border-zinc-900 flex flex-col justify-center">
                <div className="flex justify-between text-[9px] font-black uppercase mb-2">
                  <span className="text-green-500">P: {nps.p}%</span>
                  <span className="text-zinc-600">PAS: {nps.ps}%</span>
                  <span className="text-red-500">D: {nps.d}%</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-800">
                  <div style={{ width: `${nps.p}%` }} className="bg-green-500" />
                  <div style={{ width: `${nps.ps}%` }} className="bg-zinc-700" />
                  <div style={{ width: `${nps.d}%` }} className="bg-red-500" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ANALYSIS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <section className="lg:col-span-2 bg-zinc-900/10 border border-zinc-900 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Qualitative Themes (Word Cloud)</h3>
              <span className="text-[10px] bg-zinc-900 px-3 py-1 rounded-full text-zinc-500">AI-Powered Analysis</span>
            </div>
            
            {/* WORD CLOUD PLACEHOLDER */}
            <div className="relative h-64 w-full bg-zinc-950/50 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-900/50">
              <div className="flex flex-wrap gap-4 p-10 justify-center items-center opacity-80">
                <span className="text-4xl font-black text-white">LMS</span>
                <span className="text-2xl font-bold text-zinc-600">Navigation</span>
                <span className="text-5xl font-black text-blue-500">Support</span>
                <span className="text-xl font-medium text-zinc-500">Chidi AI</span>
                <span className="text-3xl font-black text-zinc-100">Mentors</span>
                <span className="text-lg font-bold text-orange-500">Ghosting</span>
                <span className="text-2xl font-black text-green-500">Engagement</span>
                <span className="text-sm font-bold text-zinc-700">Webhooks</span>
                <span className="text-4xl font-black text-zinc-400">Content</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          </section>

          {/* INTELLIGENCE SIDEBAR */}
          <aside className="space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-8">Pillar Intelligence</h3>
              <div className="space-y-6">
                {activeTab === 'onboarding' ? (
                  <>
                    <Pillar label="Platform Readiness" score={calc(entries, 'access_support_tools')} />
                    <Pillar label="Comms Clarity" score={calc(entries, 'comms_useful')} />
                    <Pillar label="Mentor Awareness" score={calc(entries, 'access_tech_mentors')} />
                  </>
                ) : activeTab === 'eop' ? (
                  <>
                    <Pillar label="LEA Utility" score={calc(entries, 'supp_lea')} />
                    <Pillar label="Community Value" score={calc(entries, 'supp_events')} />
                    <Pillar label="Career Growth" score={calc(entries, 'career_impact')} />
                  </>
                ) : (
                  <p className="text-zinc-600 text-[10px] italic font-bold">Metrics based on {activeTab} CSAT inputs.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// HELPERS
function Card({ label, value, color = "text-white" }: { label: string, value: any, color?: string }) {
  return (
    <div className="bg-zinc-900/20 p-8 rounded-3xl border border-zinc-900">
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">{label}</p>
      <h4 className={`text-4xl font-black ${color}`}>{value}</h4>
    </div>
  );
}

function Pillar({ label, score }: { label: string, score: any }) {
  const pct = (Number(score) / 5) * 100;
  return (
    <div>
      <div className="flex justify-between text-[9px] uppercase font-black mb-2">
        <span className="text-zinc-500">{label}</span>
        <span className={Number(score) < 3.5 ? 'text-orange-500' : 'text-zinc-100'}>{score} / 5</span>
      </div>
      <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%` }} className={`h-full ${Number(score) < 3.5 ? 'bg-orange-500' : 'bg-blue-600'}`} />
      </div>
    </div>
  );
}

function calc(data: any[] | null, col: string) {
  if (!data || data.length === 0) return 0;
  const valid = data.filter(d => d[col] !== null);
  return (valid.reduce((acc, curr) => acc + curr[col], 0) / (valid.length || 1)).toFixed(1);
}