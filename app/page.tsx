import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// 1. ARCHITECTURAL SETTINGS
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 2. BRAND DESIGN TOKENS
const colors = {
  berkeleyBlue: '#002B56',
  springGreen: '#05F283',
  iris: '#5648B7',
  white: '#FFFFFF',
  electricBlue: '#27DEF2',
  blueNCS: '#028ECA',
  tomato: '#FF5347',
  gold: '#FBD437',
  turquoise: '#41C9B9'
};

export default async function Dashboard(props: {
  searchParams: Promise<{ program?: string; tab?: string; year?: string; quarter?: string; }>;
}) {
  const params = await props.searchParams;
  
  // FIXED: Maintain exact case for database query, use uppercase only for display
  const program = params.program || 'AiCE'; 
  const activeTab = params.tab || 'onboarding';
  const year = params.year || '2026';
  const quarter = params.quarter || 'Q1';

  // 3. TIME-SERIES LOGIC
  const quarterMap: Record<string, { start: string; end: string }> = {
    Q1: { start: '01-01', end: '04-30' },
    Q2: { start: '05-01', end: '08-31' },
    Q3: { start: '09-01', end: '12-31' },
  };
  const startDate = `${year}-${quarterMap[quarter].start}T00:00:00Z`;
  const endDate = `${year}-${quarterMap[quarter].end}T23:59:59Z`;

  // 4. DATA PIPELINE SELECTOR [cite: 195, 198]
  const tableMap: Record<string, string> = {
    onboarding: 'survey_onboarding',
    community: 'survey_events',
    support: 'survey_events',
    eop: 'survey_eop',
  };

  let query = supabase.from(tableMap[activeTab]).select('*').eq('program', program).gte('created_at', startDate).lte('created_at', endDate);
  
  // Filtering specific event types within the shared events table [cite: 119, 135]
  if (activeTab === 'community') query = query.eq('event_type', 'Community Event');
  if (activeTab === 'support') query = query.eq('event_type', 'Technical Mentorship');

  const { data: entries, error } = await query;
  const total = entries?.length || 0;

  // 5. CSAT AGGREGATION LOGIC [cite: 128, 140, 292-297]
  const csatCol = { 
    onboarding: 'sat_next_steps', 
    community: 'session_quality_csat', 
    support: 'session_quality_csat', 
    eop: 'overall_sat' 
  }[activeTab];
  
  const csatVal = total > 0 ? ((entries?.filter(e => e[csatCol!] >= 4).length || 0) / total * 100).toFixed(1) : "0.0";

  return (
    <div className="flex min-h-screen text-zinc-900" style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#F1F5F9' }}>
      
      {/* SIDEBAR: BRAND PRIMARY */}
      <aside className="w-72 p-10 flex flex-col gap-10 text-white shadow-xl" style={{ backgroundColor: colors.berkeleyBlue }}>
        <div>
          <h1 className="text-xl font-black tracking-tighter mb-4 leading-tight">FEEDBACK ANALYSIS</h1>
          <div className="h-1 w-12" style={{ backgroundColor: colors.springGreen }} />
        </div>
        
        <nav className="flex flex-col gap-3">
          {['AiCE', 'VA', 'SE', 'Data Analytics', 'Cyber Security'].map(p => (
            <Link key={p} href={`/?program=${p}&tab=${activeTab}&year=${year}&quarter=${quarter}`} 
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border-l-4 ${program === p ? 'bg-white/10' : 'text-zinc-400 hover:text-white'}`}
              style={{ borderColor: program === p ? colors.springGreen : 'transparent' }}>
              {p.toUpperCase()}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-end mb-12 border-b-2 pb-8 border-zinc-200">
          <div>
            <h2 className="text-4xl font-black mb-2 uppercase" style={{ color: colors.berkeleyBlue }}>{program} / {activeTab.replace(/_/g, ' ')}</h2>
            <p className="text-zinc-500 text-base italic font-medium">Continuous Listening Engine [cite: 173-175]</p>
          </div>
          
          <div className="flex gap-2 p-1.5 rounded-xl bg-zinc-200 shadow-inner">
            {['Q1', 'Q2', 'Q3'].map(q => (
              <Link key={q} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${q}`}
                className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${quarter === q ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}`}>
                {q}
              </Link>
            ))}
          </div>
        </header>

        {/* MILESTONE NAVIGATION [cite: 197-198] */}
        <div className="flex gap-10 mb-12">
          {[
            { id: 'onboarding', label: 'ONBOARDING' },
            { id: 'community', label: 'COMMUNITY EVENTS' },
            { id: 'support', label: 'LEARNER SUPPORT WEBINARS' },
            { id: 'eop', label: 'END OF PROGRAM' }
          ].map(t => (
            <Link key={t.id} href={`/?program=${program}&tab=${t.id}&year=${year}&quarter=${quarter}`}
              className={`pb-4 text-xs font-black tracking-widest transition-all border-b-4 ${activeTab === t.id ? '' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}
              style={{ color: activeTab === t.id ? colors.iris : '', borderColor: activeTab === t.id ? colors.iris : '' }}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* EXECUTIVE SCORECARDS [cite: 196, 202] */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <StatCard label="TOTAL RESPONDENTS" value={total} />
          <StatCard label="CSAT % (4-5)" value={`${csatVal}%`} accent={colors.springGreen} />
          {activeTab === 'eop' && (
            <>
              <StatCard label="NPS SCORE" value={calcNPS(entries).score} accent={colors.electricBlue} />
              <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4 flex flex-col justify-center" style={{ borderColor: colors.iris }}>
                <div className="flex flex-col gap-1.5 text-[10px] font-black uppercase mb-4">
                  <span style={{ color: colors.springGreen }}>Promoters: {calcNPS(entries).p}%</span>
                  <span className="text-zinc-400">Passives: {calcNPS(entries).ps}%</span>
                  <span style={{ color: colors.tomato }}>Detractors: {calcNPS(entries).d}%</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-zinc-100">
                  <div style={{ width: `${calcNPS(entries).p}%`, backgroundColor: colors.springGreen }} />
                  <div style={{ width: `${calcNPS(entries).ps}%`, backgroundColor: '#CBD5E1' }} />
                  <div style={{ width: `${calcNPS(entries).d}%`, backgroundColor: colors.tomato }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* PILLAR METRICS SECTION [cite: 196, 224] */}
          <section className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-black mb-10 border-b pb-4 uppercase tracking-tight" style={{ color: colors.berkeleyBlue }}>PILLAR METRICS ANALYSIS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {activeTab === 'onboarding' && (
                <>
                  <Metric label="ONBOARDING SATISFACTION" val={calc(entries, 'sat_next_steps')} />
                  <Metric label="PLATFORM BUG AWARENESS" val={calc(entries, 'help_platform_bugs')} />
                  <Metric label="SUPPORT TOOL CLARITY" val={calc(entries, 'access_support_tools')} />
                  <Metric label="TECH MENTOR ACCESS" val={calc(entries, 'access_tech_mentors')} />
                  <Metric label="EXPECTATION CLARITY" val={calc(entries, 'clear_expectations')} />
                </>
              )}
              {activeTab === 'eop' && (
                <>
                  <Metric label="EXPERIENCE (SECTION 1)" val={calc(entries, 'overall_sat')} />
                  <Metric label="SUPPORT (SECTION 2)" val={avg(entries, ['supp_lea', 'supp_chidi', 'supp_mentors'])} />
                  <Metric label="COMMUNITY (SECTION 3)" val={calc(entries, 'supp_events')} />
                  <Metric label="COMMS (SECTION 4)" val={avg(entries, ['comm_email_clarity', 'comm_frequency'])} />
                  <Metric label="IMPACT (SECTION 5)" val={calc(entries, 'career_impact')} />
                </>
              )}
            </div>

            {/* DEMOGRAPHICS [cite: 93-118] */}
            {activeTab === 'eop' && (
              <div className="mt-16 pt-10 border-t-2 border-zinc-50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">SECTION 6: DEMOGRAPHICS</h3>
                <div className="grid grid-cols-2 gap-12">
                   <DemoBar label="EMPLOYED FULL-TIME" pct={pct(entries, 'employment_status', 'Employed full-time')} />
                   <DemoBar label="IDENTIFY AS WOMAN" pct={pct(entries, 'gender', 'Woman')} />
                   <DemoBar label="AGE GROUP: 18-24" pct={pct(entries, 'age_group', '18-24')} />
                   <DemoBar label="RESIDENT: NAIROBI" pct={pct(entries, 'city_residence', 'Nairobi')} />
                </div>
              </div>
            )}
          </section>

          {/* THEMATIC WORD CLOUD [cite: 191, 202] */}
          <aside className="bg-white p-10 rounded-3xl shadow-sm border border-zinc-100 h-fit text-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-10">THEMATIC WORD CLOUD</h3>
            <div className="flex flex-wrap gap-4 items-center justify-center italic opacity-80 leading-relaxed">
               <span className="text-4xl font-black" style={{ color: colors.berkeleyBlue }}>SAVANNA</span>
               <span className="text-xl text-zinc-400">Navigation</span>
               <span className="text-5xl font-black" style={{ color: colors.iris }}>SUPPORT</span>
               <span className="text-2xl font-bold" style={{ color: colors.tomato }}>GHOSTING</span>
               <span className="text-3xl font-black" style={{ color: colors.electricBlue }}>IMPACT</span>
               <span className="text-xl font-bold" style={{ color: colors.gold }}>CIRCLE</span>
               <span className="text-2xl font-black text-zinc-800">MENTORS</span>
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
    <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4" style={{ borderColor: accent }}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">{label}</p>
      <h4 className="text-3xl font-black" style={{ color: colors.berkeleyBlue }}>{value}</h4>
    </div>
  );
}

function Metric({ label, val }: any) {
  const width = (val / 5) * 100;
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[11px] font-black text-zinc-500 tracking-tight">{label}</span>
        <span className="text-xs font-black" style={{ color: colors.berkeleyBlue }}>{val} / 5.0</span>
      </div>
      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden shadow-inner">
        <div style={{ width: `${width}%`, backgroundColor: val < 3.5 ? colors.tomato : colors.iris }} className="h-full rounded-full transition-all duration-700" />
      </div>
    </div>
  );
}

function DemoBar({ label, pct }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
        <span className="text-zinc-500">{label}</span>
        <span style={{ color: colors.blueNCS }}>{pct}%</span>
      </div>
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, backgroundColor: colors.blueNCS }} className="h-full rounded-full" />
      </div>
    </div>
  );
}

function calc(data: any[] | null, col: string) {
  if (!data?.length) return 0;
  const valid = data.filter(d => d[col] !== null);
  return (valid.reduce((a, c) => a + (c[col] || 0), 0) / (valid.length || 1)).toFixed(1);
}

function avg(data: any[] | null, cols: string[]) {
  if (!data?.length) return 0;
  let sum = 0;
  cols.forEach(c => {
    const valid = data.filter(d => d[c] !== null);
    sum += (valid.reduce((a, curr) => a + (curr[c] || 0), 0) / (valid.length || 1));
  });
  return (sum / cols.length).toFixed(1);
}

function pct(data: any[] | null, col: string, val: string) {
  if (!data?.length) return 0;
  return ((data.filter(d => d[col] === val).length / data.length) * 100).toFixed(0);
}

function calcNPS(data: any[] | null) {
  if (!data?.length) return { score: 0, p: 0, ps: 0, d: 0 };
  const p = data.filter(e => e.nps_score >= 9).length;
  const ps = data.filter(e => e.nps_score === 7 || e.nps_score === 8).length;
  const d = data.filter(e => e.nps_score <= 6).length;
  const total = data.length;
  return { 
    score: (((p / total) * 100) - ((d / total) * 100)).toFixed(0),
    p: ((p / total) * 100).toFixed(0),
    ps: ((ps / total) * 100).toFixed(0),
    d: ((d / total) * 100).toFixed(0)
  };
}