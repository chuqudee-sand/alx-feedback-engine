import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const colors = {
  berkeleyBlue: '#002B56',
  springGreen: '#05F283',
  iris: '#5648B7',
  electricBlue: '#27DEF2',
  tomato: '#FF5347',
  gold: '#FBD437'
};

export default async function Dashboard(props: {
  searchParams: Promise<{ program?: string; tab?: string; year?: string; quarter?: string; }>;
}) {
  const params = await props.searchParams;
  const program = params.program || 'AiCE';
  const activeTab = params.tab || 'onboarding';
  const year = params.year || '2026';
  const quarter = params.quarter || 'Q1';

  const quarterMap: Record<string, { start: string; end: string }> = {
    Q1: { start: '01-01', end: '04-30' }, Q2: { start: '05-01', end: '08-31' }, Q3: { start: '09-01', end: '12-31' },
  };
  const startDate = `${year}-${quarterMap[quarter].start}T00:00:00Z`;
  const endDate = `${year}-${quarterMap[quarter].end}T23:59:59Z`;

  const tableMap: Record<string, string> = {
    onboarding: 'survey_onboarding',
    community: 'survey_events',
    support: 'survey_events',
    eop: 'survey_eop',
  };

  let query = supabase.from(tableMap[activeTab]).select('*').eq('program', program).gte('created_at', startDate).lte('created_at', endDate);
  if (activeTab === 'community') query = query.eq('event_type', 'Community Event');
  if (activeTab === 'support') query = query.eq('event_type', 'Technical Mentorship');

  const { data: entries, error } = await query;
  const total = entries?.length || 0;

  // CSAT Mapping [cite: 128, 140, 292-297]
  const csatCol = { onboarding: 'sat_next_steps', community: 'session_quality_csat', support: 'session_quality_csat', eop: 'overall_sat' }[activeTab];
  const csatVal = total > 0 ? ((entries?.filter(e => e[csatCol!] >= 4).length || 0) / total * 100).toFixed(1) : "0.0";

  return (
    <div className="flex min-h-screen text-zinc-900" style={{ fontFamily: 'serif', backgroundColor: '#F8FAFC' }}>
      
      {/* SIDEBAR: BERKELEY BLUE */}
      <aside className="w-72 p-10 flex flex-col gap-12 text-white" style={{ backgroundColor: colors.berkeleyBlue }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">STRATEGIC ANALYSIS</h1>
          <div className="h-1 w-12" style={{ backgroundColor: colors.springGreen }} />
        </div>
        
        <nav className="flex flex-col gap-3">
          {['AiCE', 'VA', 'SE', 'Data Analytics', 'Cyber Security'].map(p => (
            <Link key={p} href={`/?program=${p}&tab=${activeTab}&year=${year}&quarter=${quarter}`} 
              className={`px-5 py-3 rounded-lg text-sm font-bold transition-all ${program === p ? 'bg-white/10 border-l-4 border-springGreen' : 'text-zinc-400 hover:text-white'}`}
              style={{ borderColor: program === p ? colors.springGreen : 'transparent' }}>
              {p.toUpperCase()}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-16 overflow-y-auto">
        <header className="flex justify-between items-end mb-16 border-b pb-8 border-zinc-200">
          <div>
            <h2 className="text-5xl font-black mb-2" style={{ color: colors.berkeleyBlue }}>{program.toUpperCase()} / {activeTab.toUpperCase().replace(/_/g, ' ')}</h2>
            <p className="text-zinc-500 text-lg italic">Framework V2.0 Performance Metrics [cite: 173-175]</p>
          </div>
          
          <div className="flex gap-2 p-1 rounded-xl bg-zinc-200">
            {['Q1', 'Q2', 'Q3'].map(q => (
              <Link key={q} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${q}`}
                className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${quarter === q ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
                {q}
              </Link>
            ))}
          </div>
        </header>

        {/* NAVIGATION TABS */}
        <div className="flex gap-12 mb-16">
          {[
            { id: 'onboarding', label: 'ONBOARDING' },
            { id: 'community', label: 'COMMUNITY EVENTS' },
            { id: 'support', label: 'LEARNER SUPPORT WEBINARS' },
            { id: 'eop', label: 'END OF PROGRAM' }
          ].map(t => (
            <Link key={t.id} href={`/?program=${program}&tab=${t.id}&year=${year}&quarter=${quarter}`}
              className={`pb-4 text-sm font-black tracking-widest transition-all border-b-4 ${activeTab === t.id ? 'text-iris border-iris' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}
              style={{ color: activeTab === t.id ? colors.iris : '', borderColor: activeTab === t.id ? colors.iris : '' }}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* PRIMARY SCORE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <StatCard label="Total Respondents" value={total} />
          <StatCard label="CSAT (4-5 Rating)" value={`${csatVal}%`} accent={colors.springGreen} />
          {activeTab === 'eop' && (
            <StatCard label="NPS Score" value={calcNPS(entries).score} accent={colors.electricBlue} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* COLUMN 1 & 2: PILLAR PERFORMANCE [cite: 26, 33, 42, 73, 86] */}
          <section className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-xl font-bold mb-10 border-b pb-4" style={{ color: colors.berkeleyBlue }}>STRATEGIC PILLAR PERFORMANCE</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {activeTab === 'onboarding' && (
                <>
                  <Metric label="Onboarding Satisfaction" val={calc(entries, 'sat_next_steps')} />
                  <Metric label="Platform Bug Awareness" val={calc(entries, 'help_platform_bugs')} />
                  <Metric label="Support Tool Clarity" val={calc(entries, 'access_support_tools')} />
                  <Metric label="Tech Mentor Access" val={calc(entries, 'access_tech_mentors')} />
                  <Metric label="Expectation Clarity" val={calc(entries, 'clear_expectations')} />
                </>
              )}
              {activeTab === 'eop' && (
                <>
                  <Metric label="Experience (Section 1)" val={calc(entries, 'overall_sat')} />
                  <Metric label="Program Support (Section 2)" val={avg(entries, ['supp_lea', 'supp_chidi', 'supp_mentors'])} />
                  <Metric label="Community (Section 3)" val={calc(entries, 'supp_events')} />
                  <Metric label="Comms (Section 4)" val={avg(entries, ['comm_email_clarity', 'comm_frequency'])} />
                  <Metric label="Impact (Section 5)" val={calc(entries, 'career_impact')} />
                </>
              )}
            </div>

            {/* DEMOGRAPHICS SECTION (EOP ONLY)  */}
            {activeTab === 'eop' && (
              <div className="mt-16 pt-10 border-t border-zinc-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-8">Section 6: Demographics Analysis</h3>
                <div className="grid grid-cols-2 gap-12">
                   <DemoBar label="Employed Full-Time" pct={pct(entries, 'employment_status', 'Employed full-time')} />
                   <DemoBar label="Age Group: 18-24" pct={pct(entries, 'age_group', '18-24')} />
                </div>
              </div>
            )}
          </section>

          {/* COLUMN 3: QUALITATIVE WORD CLOUD */}
          <aside className="bg-white p-10 rounded-3xl shadow-sm border border-zinc-100 h-fit">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-8">Thematic Analysis</h3>
            <div className="flex flex-wrap gap-4 items-center justify-center opacity-70 italic text-zinc-800">
               <span className="text-3xl font-bold" style={{ color: colors.berkeleyBlue }}>SAVANNA</span>
               <span className="text-xl">Navigation</span>
               <span className="text-4xl font-black" style={{ color: colors.iris }}>SUPPORT</span>
               <span className="text-2xl" style={{ color: colors.tomato }}>GHOSTING</span>
               <span className="text-3xl font-bold">CAREER</span>
               <span className="text-lg">Circle</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// HELPERS
function StatCard({ label, value, accent = '#E2E8F0' }: any) {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border-t-8" style={{ borderColor: accent }}>
      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">{label}</p>
      <h4 className="text-4xl font-bold" style={{ color: colors.berkeleyBlue }}>{value}</h4>
    </div>
  );
}

function Metric({ label, val }: any) {
  const width = (val / 5) * 100;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-bold text-zinc-600">{label}</span>
        <span className="text-xs font-black">{val} / 5</span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full">
        <div style={{ width: `${width}%`, backgroundColor: val < 3.5 ? colors.tomato : colors.iris }} className="h-full rounded-full transition-all" />
      </div>
    </div>
  );
}

function DemoBar({ label, pct }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase">
        <span>{label}</span>
        <span style={{ color: colors.blueNCS }}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-100 rounded-full">
        <div style={{ width: `${pct}%`, backgroundColor: colors.blueNCS }} className="h-full rounded-full" />
      </div>
    </div>
  );
}

function calc(data: any[] | null, col: string) {
  if (!data?.length) return 0;
  return (data.reduce((a, c) => a + (c[col] || 0), 0) / data.length).toFixed(1);
}

function avg(data: any[] | null, cols: string[]) {
  if (!data?.length) return 0;
  let sum = 0;
  cols.forEach(c => sum += data.reduce((a, curr) => a + (curr[c] || 0), 0));
  return (sum / (data.length * cols.length)).toFixed(1);
}

function pct(data: any[] | null, col: string, val: string) {
  if (!data?.length) return 0;
  return ((data.filter(d => d[col] === val).length / data.length) * 100).toFixed(0);
}

function calcNPS(data: any[] | null) {
  if (!data?.length) return { score: 0 };
  const p = data.filter(e => e.nps_score >= 9).length;
  const d = data.filter(e => e.nps_score <= 6).length;
  return { score: (((p / data.length) * 100) - ((d / data.length) * 100)).toFixed(0) };
}