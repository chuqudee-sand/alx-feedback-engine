import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const colors = {
  berkeleyBlue: '#002B56',
  sidebarNavy: '#001428',
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
  searchParams: Promise<{ program?: string; tab?: string; year?: string; quarter?: string; month?: string }>;
}) {
  const params = await props.searchParams;
  
  const program = params.program || 'AiCE'; 
  const activeTab = params.tab || 'onboarding';
  const year = params.year || '2026';
  const quarter = params.quarter || 'Q1';
  const month = params.month || 'All';

  const quarterMonths: Record<string, { name: string, val: string }[]> = {
    Q1: [{name: 'Jan', val: '01'}, {name: 'Feb', val: '02'}, {name: 'Mar', val: '03'}, {name: 'Apr', val: '04'}],
    Q2: [{name: 'May', val: '05'}, {name: 'Jun', val: '06'}, {name: 'Jul', val: '07'}, {name: 'Aug', val: '08'}],
    Q3: [{name: 'Sep', val: '09'}, {name: 'Oct', val: '10'}, {name: 'Nov', val: '11'}, {name: 'Dec', val: '12'}],
  };

  const monthEnds: Record<string, string> = {
    '01': '31', '02': '28', '03': '31', '04': '30',
    '05': '31', '06': '30', '07': '31', '08': '31',
    '09': '30', '10': '31', '11': '30', '12': '31'
  };

  let startDate, endDate;
  if (month !== 'All') {
    startDate = `${year}-${month}-01T00:00:00Z`;
    endDate = `${year}-${month}-${monthEnds[month]}T23:59:59Z`;
  } else {
    const startMonth = quarterMonths[quarter][0].val;
    const endMonth = quarterMonths[quarter][3].val;
    startDate = `${year}-${startMonth}-01T00:00:00Z`;
    endDate = `${year}-${endMonth}-${monthEnds[endMonth]}T23:59:59Z`;
  }

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

  const { data: aiSummaries } = await supabase
    .from('ai_thematic_summaries')
    .select('*')
    .eq('program', program)
    .eq('tab_name', activeTab)
    .order('created_at', { ascending: false })
    .limit(5);

  const csatCol = { onboarding: 'sat_next_steps', community: 'session_quality_csat', support: 'session_quality_csat', eop: 'overall_sat' }[activeTab];
  const csatVal = total > 0 ? ((entries?.filter(e => e[csatCol!] >= 4).length || 0) / total * 100).toFixed(1) : "0.0";

  return (
    // BRANDING BACKGROUND UPDATE: The background image logic is injected here.
    <div className="flex min-h-screen text-zinc-900 bg-fixed bg-center bg-no-repeat bg-cover" 
         style={{ 
           fontFamily: "'Poppins', sans-serif", 
           backgroundColor: colors.berkeleyBlue,
           backgroundImage: "url('/alx-logo-transparent.png')",
           backgroundSize: "40%", // Keeps the logo centered and visible
           backgroundBlendMode: "overlay" // Blends it softly with the Berkeley Blue
         }}>
      
      {/* SIDEBAR */}
      <aside className="w-72 p-8 flex flex-col gap-10 text-white shadow-2xl relative z-10" style={{ backgroundColor: colors.sidebarNavy }}>
        <div>
          <h1 className="text-xl font-black tracking-tighter mb-4 leading-tight">FEEDBACK ANALYSIS</h1>
          <div className="h-1 w-12" style={{ backgroundColor: colors.springGreen }} />
        </div>
        
        <nav className="flex flex-col gap-2">
          {['AiCE', 'VA', 'SE', 'Data Analytics', 'Cyber Security'].map(p => (
            <Link key={p} href={`/?program=${p}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=${month}`} 
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border-l-4 ${program === p ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
              style={{ borderColor: program === p ? colors.springGreen : 'transparent' }}>
              {p.toUpperCase()}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-y-auto bg-white/95 backdrop-blur-sm">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-zinc-200 pb-6">
          <div className="mb-6 md:mb-0">
            <h2 className="text-5xl font-black mb-2 uppercase tracking-tight" style={{ color: colors.berkeleyBlue }}>{program} / {activeTab.replace(/_/g, ' ')}</h2>
            <p className="text-zinc-500 text-lg italic font-medium">Strategic Feedback Collection Dashboard</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <div className="flex bg-zinc-100 p-1 rounded-xl shadow-inner border border-zinc-200">
                {['2025', '2026'].map(y => (
                  <Link key={y} href={`/?program=${program}&tab=${activeTab}&year=${y}&quarter=${quarter}&month=All`}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${year === y ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}>
                    {y}
                  </Link>
                ))}
              </div>
              <div className="flex bg-zinc-100 p-1 rounded-xl shadow-inner border border-zinc-200">
                {['Q1', 'Q2', 'Q3'].map(q => (
                  <Link key={q} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${q}&month=All`}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${quarter === q ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}>
                    {q}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200">
              <Link href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=All`}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${month === 'All' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-800'}`}>
                FULL {quarter}
              </Link>
              {quarterMonths[quarter].map(m => (
                <Link key={m.val} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=${m.val}`}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${month === m.val ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-800'}`}>
                  {m.name.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* TABS */}
        <div className="flex gap-10 mb-10">
          {[
            { id: 'onboarding', label: 'ONBOARDING' },
            { id: 'community', label: 'COMMUNITY EVENTS' },
            { id: 'support', label: 'LEARNER SUPPORT WEBINARS' },
            { id: 'eop', label: 'END OF PROGRAM' }
          ].map(t => (
            <Link key={t.id} href={`/?program=${program}&tab=${t.id}&year=${year}&quarter=${quarter}&month=${month}`}
              className={`pb-3 text-sm font-black tracking-widest transition-all border-b-4 ${activeTab === t.id ? 'border-springGreen' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}
              style={{ color: activeTab === t.id ? colors.berkeleyBlue : '', borderColor: activeTab === t.id ? colors.springGreen : 'transparent' }}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* SCORECARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="TOTAL RESPONDENTS" value={total} accent={colors.iris} />
          <StatCard label="CSAT % (4-5 RATINGS)" value={`${csatVal}%`} accent={colors.springGreen} />
          
          {/* Support Tab Specific Scorecard */}
          {activeTab === 'support' && (
             <StatCard label="OUTCOME UNDERSTOOD %" value={`${calcOutcome(entries)}%`} accent={colors.blueNCS} />
          )}

          {activeTab === 'eop' && (
            <>
              <StatCard label="OVERALL NPS" value={calcNPS(entries).score} accent={colors.electricBlue} />
              <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 flex flex-col justify-center hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-default" style={{ borderColor: colors.blueNCS }}>
                <div className="flex flex-col gap-1.5 text-[10px] font-black uppercase mb-4">
                  <span style={{ color: colors.springGreen }}>PROMOTERS: {calcNPS(entries).p}%</span>
                  <span className="text-zinc-400">PASSIVES: {calcNPS(entries).ps}%</span>
                  <span style={{ color: colors.tomato }}>DETRACTORS: {calcNPS(entries).d}%</span>
                </div>
                <div className="flex h-5 rounded-full overflow-hidden bg-zinc-100 shadow-inner p-0.5">
                  <div style={{ width: `${calcNPS(entries).p}%`, backgroundColor: colors.springGreen }} className="rounded-l-full" />
                  <div style={{ width: `${calcNPS(entries).ps}%`, backgroundColor: '#CBD5E1' }} />
                  <div style={{ width: `${calcNPS(entries).d}%`, backgroundColor: colors.tomato }} className="rounded-r-full" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* PILLAR METRICS (FULL WIDTH NOW) */}
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100 mb-10">
          <h3 className="text-xl font-black mb-8 border-b pb-4 uppercase tracking-tight" style={{ color: colors.berkeleyBlue }}>PILLAR METRICS (AVERAGES)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            {activeTab === 'onboarding' && (
              <>
                <Metric label="ONBOARDING SATISFACTION" val={calc(entries, 'sat_next_steps')} type="sat" />
                <Metric label="PROGRAM EXPECTATION CLARITY" val={calc(entries, 'clear_expectations')} type="agree" />
                <Metric label="ACCESS TO TECHNICAL MENTOR" val={calc(entries, 'access_tech_mentors')} type="agree" />
                <Metric label="PLATFORM BUG AWARENESS" val={calc(entries, 'help_platform_bugs')} type="agree" />
                <Metric label="SUPPORT TOOL CLARITY" val={calc(entries, 'access_support_tools')} type="agree" />
                <Metric label="COMMS CLARITY & USEFULNESS" val={calc(entries, 'comms_useful')} type="help" />
              </>
            )}
            {activeTab === 'eop' && (
              <>
                <Metric label="OVERALL EXPERIENCE" val={calc(entries, 'overall_sat')} type="sat" />
                <Metric label="CAREER IMPACT" val={calc(entries, 'career_impact')} type="help" />
                <Metric label="COMMUNITY EVENTS" val={calc(entries, 'supp_events')} type="agree" />
                <Metric label="PEER SUPPORT" val={calc(entries, 'supp_peers')} type="agree" />
                <Metric label="TECH MENTOR SUPPORT" val={calc(entries, 'supp_mentors')} type="agree" />
                <Metric label="LEA (AI ASSISTANT)" val={calc(entries, 'supp_lea')} type="agree" />
                <Metric label="CHIDI (AI ASSISTANT)" val={calc(entries, 'supp_chidi')} type="agree" />
                <Metric label="PROGRAM TEAM COMMS" val={calc(entries, 'supp_prog_team')} type="agree" />
                <Metric label="PEERFINDER APP" val={calc(entries, 'supp_peerfinder')} type="agree" />
                <Metric label="RESOURCES HUB" val={calc(entries, 'supp_hub')} type="agree" />
              </>
            )}
            {(activeTab === 'community' || activeTab === 'support') && (
              <Metric label="SESSION QUALITY RATING" val={calc(entries, 'session_quality_csat')} type="quality" />
            )}
          </div>

          {activeTab === 'eop' && (
            <div className="mt-12 pt-8 border-t border-zinc-200">
              <h3 className="text-xs font-black uppercase tracking-[0.1em] text-zinc-500 mb-6">DEMOGRAPHICS COMPARISON</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <DemographicChart data={entries} column="employment_status" title="EMPLOYMENT STATUS" colorsArr={[colors.berkeleyBlue, colors.blueNCS, colors.electricBlue, colors.turquoise]} />
                 <DemographicChart data={entries} column="city_residence" title="CITY OF RESIDENCE" colorsArr={[colors.iris, colors.springGreen, colors.gold, colors.tomato]} />
              </div>
            </div>
          )}
        </section>

        {/* FULL WIDTH AI THEMATIC FEED */}
        <section className="bg-white p-10 rounded-3xl shadow-xl border-t-8 h-fit hover:scale-[1.01] transition-transform duration-300 w-full mb-10" style={{ borderColor: colors.iris }}>
          <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-4">
            <h3 className="text-lg font-black uppercase tracking-widest" style={{ color: colors.berkeleyBlue }}>AI THEMATIC SUMMARY</h3>
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md" style={{ color: colors.iris, backgroundColor: `${colors.iris}15` }}>Latest Insights</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aiSummaries && aiSummaries.length > 0 ? (
              aiSummaries.map((summary) => (
                <div key={summary.id} className="border-l-4 pl-6 py-2 bg-zinc-50 rounded-r-xl" style={{ borderColor: colors.electricBlue }}>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h4 className="text-base font-black uppercase tracking-tight leading-tight" style={{ color: colors.berkeleyBlue }}>{summary.theme_title}</h4>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200 px-3 py-1 rounded-full whitespace-nowrap">{summary.response_count} Mentions</span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed italic">
                    "{summary.summary_text}"
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center p-8 bg-zinc-50 rounded-2xl border border-zinc-100 md:col-span-2">
                <p className="text-sm text-zinc-400 font-bold italic">No AI summaries generated for this tab yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* TOP-BOX INTELLIGENCE CONTAINER */}
        {(activeTab === 'onboarding' || activeTab === 'eop') && (
          <section className="bg-white p-10 rounded-3xl shadow-2xl border-t-8 mt-4" style={{ borderColor: colors.turquoise }}>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight" style={{ color: colors.berkeleyBlue }}>ACTIONABLE INTELLIGENCE (TOP-BOX SCORING)</h3>
            <p className="text-zinc-500 text-sm italic mb-8">Percentage of respondents scoring 4 or 5. Extracted directly from Framework metrics.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === 'onboarding' && (
                <>
                  <InsightRow pct={calcTopBox(entries, 'sat_next_steps')} text="are highly satisfied with their onboarding experience and confidently know their next steps." />
                  <InsightRow pct={calcTopBox(entries, 'clear_expectations')} text="completely understand the program's expectations and graduation requirements." />
                  <InsightRow pct={calcTopBox(entries, 'access_tech_mentors')} text="know exactly how to access Technical Mentors for expert guidance when needed." />
                  <InsightRow pct={calcTopBox(entries, 'help_platform_bugs')} text="know where to go to get help with platform issues and technical bugs." />
                  <InsightRow pct={calcTopBox(entries, 'access_support_tools')} text="are clear on how to access key support tools like LEA, Chidi, and PeerFinder." />
                  <InsightRow pct={calcTopBox(entries, 'comms_useful')} text="found emails and community communications clear and highly useful for getting started." />
                </>
              )}
              {activeTab === 'eop' && (
                <>
                  <InsightRow pct={calcTopBox(entries, 'overall_sat')} text="are highly satisfied with their overall program experience." />
                  <InsightRow pct={calcTopBox(entries, 'career_impact')} text="feel the program was highly effective in enhancing their skills and advancing their careers." />
                  <InsightRow pct={calcTopBox(entries, 'supp_events')} text="say community events kept them motivated, engaged, and on track to complete the program." />
                  <InsightRow pct={calcTopBox(entries, 'supp_peers')} text="felt well-supported and motivated by their peers throughout their learning journey." />
                  <InsightRow pct={calcTopBox(entries, 'supp_mentors')} text="state that Technical Mentor support contributed meaningfully to their learning." />
                  <InsightRow pct={calcTopBox(entries, 'supp_lea')} text="found the LEA AI Assistant easily accessible and highly useful when facing challenges." />
                  <InsightRow pct={calcTopBox(entries, 'supp_chidi')} text="relied on Chidi AI to successfully navigate and overcome learning content challenges." />
                  <InsightRow pct={calcTopBox(entries, 'supp_prog_team')} text="received timely and helpful guidance from the Program Team communications." />
                  <InsightRow pct={calcTopBox(entries, 'supp_peerfinder')} text="successfully used the PeerFinder tool to connect with peers for collaboration." />
                  <InsightRow pct={calcTopBox(entries, 'supp_hub')} text="found the Program Guides and Resources Hub essential for supporting their journey." />
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// 6. ARCHITECTURAL HELPER FUNCTIONS & COMPONENTS

function StatCard({ label, value, accent = '#E2E8F0' }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-default" style={{ borderColor: accent }}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
      <h4 className="text-5xl font-black" style={{ color: colors.berkeleyBlue }}>{value}</h4>
    </div>
  );
}

// HELPER: Determine label string based on score and question type
function getScaleLabel(val: number, type: string) {
  if (val >= 4.5) return type === 'agree' ? 'Strongly Agreed' : type === 'help' ? 'Very Helpful' : type === 'quality' ? 'Excellent' : 'Highly Satisfied';
  if (val >= 3.9) return type === 'agree' ? 'Agreed' : type === 'help' ? 'Helpful' : type === 'quality' ? 'Very Good' : 'Satisfied';
  if (val >= 3.3) return type === 'agree' ? 'Neither' : type === 'help' ? 'Moderate' : type === 'quality' ? 'Good' : 'Neutral';
  if (val >= 2.0) return type === 'agree' ? 'Disagreed' : type === 'help' ? 'Unhelpful' : type === 'quality' ? 'Fair' : 'Dissatisfied';
  return type === 'agree' ? 'Strongly Disagreed' : type === 'help' ? 'Very Unhelpful' : type === 'quality' ? 'Poor' : 'Very Dissatisfied';
}

function Metric({ label, val, type = 'sat' }: any) {
  const numVal = Number(val);
  const width = (numVal / 5) * 100;
  
  let finalColor = colors.tomato; 
  if (numVal >= 4.5) finalColor = colors.springGreen;
  else if (numVal >= 3.9) finalColor = colors.blueNCS; 
  else if (numVal >= 3.3) finalColor = colors.gold;

  const scaleText = getScaleLabel(numVal, type);
  
  return (
    <div className="group p-3 rounded-xl hover:bg-zinc-50 hover:scale-[1.02] transition-all duration-300 cursor-default border border-transparent hover:border-zinc-200">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[11px] font-black text-zinc-600 tracking-tight uppercase">{label}</span>
        <div className="flex items-center gap-3">
          {/* INSERTED: The dynamic text label between pillar and score */}
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: finalColor }}>{scaleText}</span>
          <span className="text-sm font-black" style={{ color: colors.berkeleyBlue }}>{val} / 5.0</span>
        </div>
      </div>
      <div className="h-6 bg-zinc-200 rounded-full overflow-hidden shadow-inner p-0.5">
        <div style={{ width: `${width}%`, backgroundColor: finalColor }} className="h-full rounded-full transition-all duration-700 shadow-sm" />
      </div>
    </div>
  );
}

function InsightRow({ pct, text }: { pct: number, text: string }) {
  let pctColor = colors.tomato;
  if (pct >= 80) pctColor = colors.springGreen;
  else if (pct >= 60) pctColor = colors.blueNCS;

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 hover:scale-[1.02] transition-transform duration-300 border border-zinc-200">
      <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: `${pctColor}20` }}>
        <span className="text-xl font-black" style={{ color: pctColor }}>{pct}%</span>
      </div>
      <p className="text-sm text-zinc-700 font-medium leading-snug">
        <strong style={{ color: colors.berkeleyBlue }}>{pct}% of respondents</strong> {text}
      </p>
    </div>
  );
}

function DemographicChart({ data, column, title, colorsArr }: any) {
  if (!data?.length) return null;
  
  const counts: Record<string, number> = {};
  data.forEach((d: any) => {
    const val = d[column] || 'Unknown/Other';
    counts[val] = (counts[val] || 0) + 1;
  });
  
  const total = data.length;
  const segments = Object.entries(counts)
    .map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  return (
    <div className="space-y-4 group hover:scale-[1.02] transition-transform duration-300">
      <h4 className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">{title}</h4>
      <div className="flex h-6 rounded-full overflow-hidden shadow-inner p-0.5 bg-zinc-100">
        {segments.map((seg, i) => (
          <div key={seg.label} style={{ width: `${seg.pct}%`, backgroundColor: colorsArr[i % colorsArr.length] }} className="h-full first:rounded-l-full last:rounded-r-full" title={`${seg.label}: ${seg.pct}%`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colorsArr[i % colorsArr.length] }} />
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

function calcTopBox(data: any[] | null, col: string) {
  if (!data?.length) return 0;
  const valid = data.filter(d => d[col] !== null); 
  if (valid.length === 0) return 0;
  const topBoxCount = valid.filter(d => d[col] >= 4).length; 
  return Math.round((topBoxCount / valid.length) * 100);
}

// Calculates percentage of "True" responses
function calcOutcome(data: any[]) {
  if(!data?.length) return 0;
  const valid = data.filter(d => d.understood_outcomes !== null);
  if(!valid.length) return 0;
  const yesCount = valid.filter(d => d.understood_outcomes === true).length;
  return ((yesCount / valid.length) * 100).toFixed(0);
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