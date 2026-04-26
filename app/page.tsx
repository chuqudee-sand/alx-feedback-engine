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

  // 5. CSAT AGGREGATION LOGIC
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
      <aside className="w-72 p-8 flex flex-col gap-10 text-white shadow-xl" style={{ backgroundColor: colors.berkeleyBlue }}>
        <div>
          <h1 className="text-xl font-black tracking-tighter mb-4 leading-tight">FEEDBACK ANALYSIS</h1>
          <div className="h-1 w-12" style={{ backgroundColor: colors.springGreen }} />
        </div>
        
        <nav className="flex flex-col gap-2">
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
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-end mb-10 border-b-2 pb-6 border-zinc-200">
          <div>
            <h2 className="text-4xl font-black mb-1 uppercase tracking-tight" style={{ color: colors.berkeleyBlue }}>{program} / {activeTab.replace(/_/g, ' ')}</h2>
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

        {/* MILESTONE NAVIGATION TABS */}
        <div className="flex gap-10 mb-10">
          {[
            { id: 'onboarding', label: 'ONBOARDING' },
            { id: 'community', label: 'COMMUNITY EVENTS' },
            { id: 'support', label: 'LEARNER SUPPORT WEBINARS' },
            { id: 'eop', label: 'END OF PROGRAM' }
          ].map(t => (
            <Link key={t.id} href={`/?program=${program}&tab=${t.id}&year=${year}&quarter=${quarter}`}
              className={`pb-3 text-sm font-black tracking-widest transition-all border-b-4 ${activeTab === t.id ? '' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}
              style={{ color: activeTab === t.id ? colors.iris : '', borderColor: activeTab === t.id ? colors.iris : '' }}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* EXECUTIVE SCORECARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="TOTAL RESPONDENTS" value={total} />
          <StatCard label="CSAT % (4-5 RATINGS)" value={`${csatVal}%`} accent={colors.springGreen} />
          {activeTab === 'eop' && (
            <>
              <StatCard label="OVERALL NPS" value={calcNPS(entries).score} accent={colors.electricBlue} />
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 flex flex-col justify-center" style={{ borderColor: colors.iris }}>
                <div className="flex flex-col gap-1.5 text-[10px] font-black uppercase mb-4">
                  <span style={{ color: colors.springGreen }}>PROMOTERS: {calcNPS(entries).p}%</span>
                  <span className="text-zinc-400">PASSIVES: {calcNPS(entries).ps}%</span>
                  <span style={{ color: colors.tomato }}>DETRACTORS: {calcNPS(entries).d}%</span>
                </div>
                {/* Thick Pill-shaped bar for NPS */}
                <div className="flex h-5 rounded-full overflow-hidden bg-zinc-100 shadow-inner p-0.5">
                  <div style={{ width: `${calcNPS(entries).p}%`, backgroundColor: colors.springGreen }} className="rounded-l-full" />
                  <div style={{ width: `${calcNPS(entries).ps}%`, backgroundColor: '#CBD5E1' }} />
                  <div style={{ width: `${calcNPS(entries).d}%`, backgroundColor: colors.tomato }} className="rounded-r-full" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* PILLAR METRICS SECTION */}
          <section className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-black mb-8 border-b pb-4 uppercase tracking-tight" style={{ color: colors.berkeleyBlue }}>PILLAR METRICS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {activeTab === 'onboarding' && (
                <>
                  <Metric label="ONBOARDING SATISFACTION" val={calc(entries, 'sat_next_steps')} color={colors.springGreen} />
                  <Metric label="PROGRAM EXPECTATION CLARITY" val={calc(entries, 'clear_expectations')} color={colors.iris} />
                  <Metric label="ACCESS TO TECHNICAL MENTOR" val={calc(entries, 'access_tech_mentors')} color={colors.electricBlue} />
                  <Metric label="PLATFORM BUG AWARENESS" val={calc(entries, 'help_platform_bugs')} color={colors.turquoise} />
                  <Metric label="SUPPORT TOOL CLARITY" val={calc(entries, 'access_support_tools')} color={colors.blueNCS} />
                  <Metric label="COMMS CLARITY & USEFULNESS" val={calc(entries, 'comms_useful')} color={colors.gold} />
                </>
              )}
              {activeTab === 'eop' && (
                <>
                  <Metric label="OVERALL EXPERIENCE" val={calc(entries, 'overall_sat')} color={colors.springGreen} />
                  <Metric label="CAREER IMPACT" val={calc(entries, 'career_impact')} color={colors.iris} />
                  <Metric label="COMMUNITY EVENTS" val={calc(entries, 'supp_events')} color={colors.electricBlue} />
                  <Metric label="PEER SUPPORT" val={calc(entries, 'supp_peers')} color={colors.turquoise} />
                  <Metric label="TECH MENTOR SUPPORT" val={calc(entries, 'supp_mentors')} color={colors.blueNCS} />
                  <Metric label="LEA (AI ASSISTANT)" val={calc(entries, 'supp_lea')} color={colors.gold} />
                  <Metric label="CHIDI (AI ASSISTANT)" val={calc(entries, 'supp_chidi')} color={colors.springGreen} />
                  <Metric label="PROGRAM TEAM COMMS" val={calc(entries, 'supp_prog_team')} color={colors.iris} />
                  <Metric label="PEERFINDER APP" val={calc(entries, 'supp_peerfinder')} color={colors.tomato} />
                  <Metric label="RESOURCES HUB" val={calc(entries, 'supp_hub')} color={colors.blueNCS} />
                </>
              )}
            </div>

            {/* DEMOGRAPHICS COMPARATIVE VISUALIZER */}
            {activeTab === 'eop' && (
              <div className="mt-12 pt-8 border-t-2 border-zinc-50">
                <h3 className="text-xs font-black uppercase tracking-[0.1em] text-zinc-500 mb-6">DEMOGRAPHICS COMPARISON</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <DemographicChart data={entries} column="employment_status" title="EMPLOYMENT STATUS" colorsArr={[colors.berkeleyBlue, colors.blueNCS, colors.electricBlue, colors.turquoise]} />
                   <DemographicChart data={entries} column="city_residence" title="CITY OF RESIDENCE" colorsArr={[colors.iris, colors.springGreen, colors.gold, colors.tomato]} />
                </div>
              </div>
            )}
          </section>

          {/* THEMATIC WORD CLOUD */}
          <aside className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 h-fit text-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-8">THEMATIC WORD CLOUD</h3>
            <div className="flex flex-wrap gap-4 items-center justify-center italic opacity-90 leading-relaxed">
               <span className="text-4xl font-black" style={{ color: colors.berkeleyBlue }}>SAVANNA</span>
               <span className="text-lg text-zinc-400">Navigation</span>
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

// 6. ARCHITECTURAL HELPER FUNCTIONS & COMPONENTS

function StatCard({ label, value, accent = '#E2E8F0' }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4" style={{ borderColor: accent }}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">{label}</p>
      <h4 className="text-3xl font-black" style={{ color: colors.berkeleyBlue }}>{value}</h4>
    </div>
  );
}

// REDESIGNED: THICK PILL BARS
function Metric({ label, val, color }: any) {
  const width = (val / 5) * 100;
  // If score is critically low, overwrite color with tomato red
  const finalColor = val < 3.5 ? colors.tomato : color; 
  
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black text-zinc-600 tracking-tight uppercase">{label}</span>
        <span className="text-xs font-black" style={{ color: colors.berkeleyBlue }}>{val} / 5.0</span>
      </div>
      {/* Thick pill container with inner shadow */}
      <div className="h-6 bg-zinc-100 rounded-full overflow-hidden shadow-inner p-0.5">
        <div style={{ width: `${width}%`, backgroundColor: finalColor }} className="h-full rounded-full transition-all duration-700 shadow-sm" />
      </div>
    </div>
  );
}

// NEW: COMPARATIVE DEMOGRAPHICS VISUALIZER
function DemographicChart({ data, column, title, colorsArr }: any) {
  if (!data?.length) return null;
  
  // Calculate frequencies
  const counts: Record<string, number> = {};
  data.forEach((d: any) => {
    const val = d[column] || 'Unknown/Other';
    counts[val] = (counts[val] || 0) + 1;
  });
  
  // Convert to array and sort by percentage
  const total = data.length;
  const segments = Object.entries(counts)
    .map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4); // Show top 4 to keep UI clean

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">{title}</h4>
      
      {/* The Stacked Comparative Bar */}
      <div className="flex h-6 rounded-full overflow-hidden shadow-inner p-0.5 bg-zinc-100">
        {segments.map((seg, i) => (
          <div key={seg.label} style={{ width: `${seg.pct}%`, backgroundColor: colorsArr[i % colorsArr.length] }} className="h-full first:rounded-l-full last:rounded-r-full" title={`${seg.label}: ${seg.pct}%`} />
        ))}
      </div>
      
      {/* The Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorsArr[i % colorsArr.length] }} />
            <span className="text-[10px] font-bold text-zinc-600 truncate">{seg.label} <span className="text-zinc-400">({seg.pct}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function calc(data: any[] | null, col: string) {
  if (!data?.length) return 0;
  const valid = data.filter(d => d[col] !== null);
  return (valid.reduce((a, c) => a + (c[col] || 0), 0) / (valid.length || 1)).toFixed(1);
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