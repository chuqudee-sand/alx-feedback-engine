import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const colors = {
  berkeleyBlue: '#002B56', sidebarNavy: '#001428', springGreen: '#05F283',
  iris: '#5648B7', white: '#FFFFFF', electricBlue: '#27DEF2',
  blueNCS: '#028ECA', tomato: '#FF5347', gold: '#FBD437', turquoise: '#41C9B9'
};

// --- SERVER ACTION: THE AI SUMMARIZATION ENGINE ---
async function generateAISummary(formData: FormData) {
  'use server';
  
  const program = formData.get('program') as string;
  const activeTab = formData.get('activeTab') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const activeEvent = formData.get('activeEvent') as string;
  const reportPeriod = formData.get('reportPeriod') as string;

  let rawText = "";
  
  if (activeTab === 'onboarding' || activeTab === 'eop') {
    const table = activeTab === 'onboarding' ? 'survey_onboarding' : 'survey_eop';
    const { data } = await supabase.from(table).select('*').eq('program', program).gte('created_at', startDate).lte('created_at', endDate);
    if (data) {
      data.forEach(row => {
        if (row.unclear_aspects_text) rawText += `Feedback: ${row.unclear_aspects_text}\n`;
        if (row.additional_feedback_text) rawText += `Feedback: ${row.additional_feedback_text}\n`;
        if (row.missing_info_text) rawText += `Feedback: ${row.missing_info_text}\n`;
        if (row.additional_support_resources_text) rawText += `Feedback: ${row.additional_support_resources_text}\n`;
      });
    }
  } else if (activeTab === 'community' || activeTab === 'support') {
    const { data } = await supabase.from('survey_events').select('*').eq('program', program).eq('event_name_date', activeEvent);
    if (data) {
      data.forEach(row => {
        if (row.improvement_suggestion_text) rawText += `Feedback: ${row.improvement_suggestion_text}\n`;
        if (row.challenging_topic_text) rawText += `Feedback: ${row.challenging_topic_text}\n`;
      });
    }
  }

  if (!rawText.trim() || rawText.length < 10) {
    console.log("Not enough text to summarize.");
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const prompt = `
    You are an expert Data Analyst for an educational program. Analyze the following learner feedback.
    Identify the 3 to 4 most prominent themes. 
    Return the result strictly as a JSON array of objects. Do not include markdown formatting like \`\`\`json.
    Each object must have these exactly matching keys:
    - "theme_title": A short 2-4 word title for the theme.
    - "summary_text": A 1-sentence summary of what learners are saying.
    - "response_count": Your estimated number of mentions for this theme (integer).
    - "question_short": A short category like "General Feedback" or "Improvement".

    Feedback to analyze:
    ${rawText}
  `;

  try {
    const result = await model.generateContent(prompt);
    let jsonString = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedThemes = JSON.parse(jsonString);

    const insertRows = parsedThemes.map((theme: any) => ({
      program: program,
      tab_name: activeTab,
      question_short: theme.question_short || 'General',
      theme_title: theme.theme_title,
      response_count: theme.response_count || 1,
      summary_text: theme.summary_text,
      report_period: reportPeriod,
      event_name_date: activeTab === 'community' || activeTab === 'support' ? activeEvent : null
    }));

    await supabase.from('ai_thematic_summaries').insert(insertRows);
    revalidatePath('/');
  } catch (error) {
    console.error("Gemini AI Error:", error);
  }
}

export default async function Dashboard(props: {
  searchParams: Promise<{ program?: string; tab?: string; year?: string; quarter?: string; month?: string; theme?: string; event?: string }>;
}) {
  const params = await props.searchParams;
  
  const program = params.program || 'AiCE'; 
  const activeTab = params.tab || 'onboarding';
  const year = params.year || '2026';
  const quarter = params.quarter || 'Q1';
  const month = params.month || 'All';
  const theme = params.theme || 'light';
  const selectedEvent = params.event || 'All';
  
  const isDark = theme === 'dark';

  const t = {
    bg: isDark ? colors.berkeleyBlue : '#e2e4e7f6',
    sidebar: isDark ? colors.sidebarNavy : colors.berkeleyBlue,
    cardBg: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.white,
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
    textMain: isDark ? colors.white : colors.berkeleyBlue,
    textMuted: isDark ? '#94A3B8' : '#64748B',
  };

  const tabDisplayMap: Record<string, string> = { onboarding: 'Onboarding', community: 'Community Events', support: 'Learner Support Webinars', eop: 'End of Program' };
  const quarterMonths: Record<string, { name: string, val: string }[]> = {
    Q1: [{name: 'Jan', val: '01'}, {name: 'Feb', val: '02'}, {name: 'Mar', val: '03'}, {name: 'Apr', val: '04'}],
    Q2: [{name: 'May', val: '05'}, {name: 'Jun', val: '06'}, {name: 'Jul', val: '07'}, {name: 'Aug', val: '08'}],
    Q3: [{name: 'Sep', val: '09'}, {name: 'Oct', val: '10'}, {name: 'Nov', val: '11'}, {name: 'Dec', val: '12'}],
  };
  const monthEnds: Record<string, string> = { '01': '31', '02': '28', '03': '31', '04': '30', '05': '31', '06': '30', '07': '31', '08': '31', '09': '30', '10': '31', '11': '30', '12': '31' };

  let startDate, endDate, reportPeriod;
  if (month !== 'All') {
    startDate = `${year}-${month}-01T00:00:00Z`; endDate = `${year}-${month}-${monthEnds[month]}T23:59:59Z`;
    reportPeriod = `${year}-${month}`;
  } else {
    const startM = quarterMonths[quarter][0].val; const endM = quarterMonths[quarter][3].val;
    startDate = `${year}-${startM}-01T00:00:00Z`; endDate = `${year}-${endM}-${monthEnds[endM]}T23:59:59Z`;
    reportPeriod = `${year}-${quarter}`;
  }

  const tableMap: Record<string, string> = { onboarding: 'survey_onboarding', community: 'survey_events', support: 'survey_events', eop: 'survey_eop' };

  let uniqueEvents: string[] = [];
  let latestEvent = '';

  if (activeTab === 'community' || activeTab === 'support') {
    const eventTypeStr = activeTab === 'community' ? 'Community Event' : 'Program Team';
    const allEventsQuery = await supabase.from(tableMap[activeTab]).select('event_name_date, created_at').eq('program', program).gte('created_at', startDate).lte('created_at', endDate).eq('event_type', eventTypeStr).order('created_at', { ascending: false });
      
    if (allEventsQuery.data) {
      const seen = new Set();
      for (const item of allEventsQuery.data) {
        if (item.event_name_date && !seen.has(item.event_name_date)) { seen.add(item.event_name_date); uniqueEvents.push(item.event_name_date); }
      }
      if (uniqueEvents.length > 0) latestEvent = uniqueEvents[0];
    }
  }

  const activeEvent = (selectedEvent === 'All' && latestEvent) ? latestEvent : selectedEvent;

  let query = supabase.from(tableMap[activeTab]).select('*').eq('program', program).gte('created_at', startDate).lte('created_at', endDate);
  if (activeTab === 'community') query = query.eq('event_type', 'Community Event');
  if (activeTab === 'support') query = query.eq('event_type', 'Program Team'); 
  if ((activeTab === 'community' || activeTab === 'support') && activeEvent && activeEvent !== 'All') query = query.eq('event_name_date', activeEvent);

  const { data: entries } = await query;
  const total = entries?.length || 0;

  // AI Summaries Query
  let summaryQuery = supabase.from('ai_thematic_summaries').select('*').eq('program', program).eq('tab_name', activeTab);
  if (activeTab === 'onboarding' || activeTab === 'eop') {
    summaryQuery = summaryQuery.eq('report_period', reportPeriod);
  } else {
    summaryQuery = summaryQuery.eq('event_name_date', activeEvent);
  }
  const { data: aiSummaries } = await summaryQuery.order('created_at', { ascending: false }).limit(6);

  const csatCol = { onboarding: 'sat_next_steps', community: 'session_quality_csat', support: 'session_quality_csat', eop: 'overall_sat' }[activeTab];
  const csatVal = total > 0 ? ((entries?.filter(e => e[csatCol!] >= 4).length || 0) / total * 100).toFixed(1) : "0.0";
  const avgAttendance = activeTab === 'community' || activeTab === 'support' ? calc(entries, 'attendance_duration_mins') : "0";

  return (
    <div className="flex min-h-screen transition-colors duration-500 relative" style={{ fontFamily: "'Ubuntu', sans-serif", backgroundColor: t.bg, color: t.textMain }}>
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center" style={{ opacity: isDark ? 0.03 : 0.04 }}>
          <img src={isDark ? "/alx-logo-transparent.png" : "/alx-logo-black.png"} alt="ALX Logo" className="w-[40%] object-contain" style={{ mixBlendMode: isDark ? 'luminosity' : 'multiply' }} />
      </div>
      
      <aside className="w-80 p-8 flex flex-col gap-10 text-white shadow-2xl relative z-20" style={{ backgroundColor: t.sidebar }}>
        <div><h1 className="text-xl font-black tracking-tighter mb-4 leading-tight">FEEDBACK ANALYSIS</h1><div className="h-1 w-12" style={{ backgroundColor: colors.springGreen }} /></div>
        <nav className="flex flex-col gap-2">
          {['AiCE', 'Virtual Assistant', 'Professional Foundations'].map(p => (
            <Link key={p} href={`/?program=${p}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=${month}&theme=${theme}`} className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border-l-4 ${program === p ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`} style={{ borderColor: program === p ? colors.springGreen : 'transparent' }}>{p.toUpperCase()}</Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b pb-6" style={{ borderColor: t.cardBorder }}>
          <div className="mb-6 md:mb-0">
            <h2 className="text-4xl lg:text-5xl font-black mb-2 tracking-tight flex items-center gap-3" style={{ color: t.textMain }}>
              <span className="uppercase">{program}</span> <span className="text-zinc-500 font-medium text-3xl"> &rarr; </span> <span>{tabDisplayMap[activeTab]}</span>
            </h2>
            <p className="text-lg italic font-medium" style={{ color: t.textMuted }}>Program Feedback Automation & Analysis</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2 items-center">
              <Link href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=${month}&theme=${isDark ? 'light' : 'dark'}&event=${encodeURIComponent(activeEvent)}`} className="px-4 py-2 rounded-lg text-[10px] font-black transition-all shadow-sm border mr-2 flex items-center gap-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.white, color: t.textMain, borderColor: t.cardBorder }}>{isDark ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}</Link>
              <div className="flex p-1 rounded-xl shadow-inner backdrop-blur-sm" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,43,86,0.05)' }}>
                {['2025', '2026'].map(y => (
                  <Link key={y} href={`/?program=${program}&tab=${activeTab}&year=${y}&quarter=${quarter}&month=All&theme=${theme}`} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${year === y ? 'shadow-sm' : 'hover:opacity-70'}`} style={{ backgroundColor: year === y ? t.cardBg : 'transparent', color: year === y ? t.textMain : t.textMuted }}>{y}</Link>
                ))}
              </div>
              <div className="flex p-1 rounded-xl shadow-inner backdrop-blur-sm" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,43,86,0.05)' }}>
                {['Q1', 'Q2', 'Q3'].map(q => (
                  <Link key={q} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${q}&month=All&theme=${theme}`} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${quarter === q ? 'shadow-sm' : 'hover:opacity-70'}`} style={{ backgroundColor: quarter === q ? t.cardBg : 'transparent', color: quarter === q ? t.textMain : t.textMuted }}>{q}</Link>
                ))}
              </div>
            </div>
            
            <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.white, borderColor: t.cardBorder }}>
              <Link href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=All&theme=${theme}`} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${month === 'All' ? 'shadow-sm' : 'hover:opacity-70'}`} style={{ backgroundColor: month === 'All' ? (isDark ? 'rgba(255,255,255,0.1)' : colors.berkeleyBlue) : 'transparent', color: month === 'All' ? colors.white : t.textMuted }}>FULL {quarter}</Link>
              {quarterMonths[quarter].map(m => (
                <Link key={m.val} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=${m.val}&theme=${theme}`} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${month === m.val ? 'shadow-sm' : 'hover:opacity-70'}`} style={{ backgroundColor: month === m.val ? (isDark ? 'rgba(255,255,255,0.1)' : colors.berkeleyBlue) : 'transparent', color: month === m.val ? colors.white : t.textMuted }}>{m.name.toUpperCase()}</Link>
              ))}
            </div>
          </div>
        </header>

        <div className="flex gap-10 mb-8 overflow-x-auto">
          {[{ id: 'onboarding', label: 'ONBOARDING' }, { id: 'community', label: 'COMMUNITY EVENTS' }, { id: 'support', label: 'LEARNER SUPPORT WEBINARS' }, { id: 'eop', label: 'END OF PROGRAM' }].map(tab => (
            <Link key={tab.id} href={`/?program=${program}&tab=${tab.id}&year=${year}&quarter=${quarter}&month=${month}&theme=${theme}`} className={`pb-3 text-sm font-black tracking-widest transition-all border-b-4 whitespace-nowrap ${activeTab === tab.id ? 'border-springGreen' : 'border-transparent hover:opacity-70'}`} style={{ color: activeTab === tab.id ? t.textMain : t.textMuted, borderColor: activeTab === tab.id ? colors.springGreen : 'transparent' }}>{tab.label}</Link>
          ))}
        </div>

        {(activeTab === 'community' || activeTab === 'support') && uniqueEvents.length > 0 && (
          <div className="mb-4 relative z-40 flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: t.textMuted }}>Filter by Event:</span>
            <div className="relative inline-block">
              <input type="checkbox" id="event-dropdown" className="peer hidden" />
              <label htmlFor="event-dropdown" className="list-none outline-none text-[10px] font-bold px-4 py-2 rounded-lg border cursor-pointer shadow-sm flex items-center transition-all hover:scale-[1.02]" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.white, color: t.textMain, borderColor: t.cardBorder }}>
                {activeEvent.length > 40 ? activeEvent.substring(0, 40) + '...' : activeEvent}
                <span className="text-[8px] opacity-50 ml-3">▼</span>
              </label>
              <label htmlFor="event-dropdown" className="fixed inset-0 z-40 hidden peer-checked:block bg-transparent cursor-default"></label>
              <div className="absolute top-full left-0 mt-2 hidden peer-checked:flex flex-col border rounded-xl shadow-2xl max-h-64 overflow-y-auto whitespace-nowrap min-w-[280px] z-50" style={{ backgroundColor: isDark ? colors.sidebarNavy : colors.white, borderColor: t.cardBorder }}>
                {uniqueEvents.map(ev => (
                  <Link key={ev} href={`/?program=${program}&tab=${activeTab}&year=${year}&quarter=${quarter}&month=${month}&theme=${theme}&event=${encodeURIComponent(ev)}`} className="px-4 py-3 text-[10px] font-bold border-b last:border-0 transition-colors hover:bg-zinc-100/10" style={{ color: activeEvent === ev ? colors.springGreen : t.textMuted, borderColor: t.cardBorder }}>{ev}</Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label={(activeTab === 'community' || activeTab === 'support') ? "TOTAL ATTENDEES" : "TOTAL RESPONDENTS"} value={total} accent={colors.iris} isDark={isDark} t={t} />
          {(activeTab === 'community' || activeTab === 'support') && <StatCard label="AVG ATTENDANCE (MINS)" value={avgAttendance} accent={colors.turquoise} isDark={isDark} t={t} />}
          <StatCard label="CSAT % (4-5 RATINGS)" value={`${csatVal}%`} accent={colors.springGreen} isDark={isDark} t={t} />
          {activeTab === 'support' && <StatCard label="OUTCOME UNDERSTOOD %" value={`${calcOutcome(entries)}%`} accent={colors.blueNCS} isDark={isDark} t={t} />}
          {activeTab === 'eop' && (
            <>
              <StatCard label="OVERALL NPS" value={calcNPS(entries).score} accent={colors.electricBlue} isDark={isDark} t={t} />
              <div className="p-6 rounded-2xl shadow-lg border-t-4 flex flex-col justify-center hover:scale-105 transition-all duration-300" style={{ backgroundColor: t.cardBg, borderColor: colors.blueNCS }}>
                <div className="flex flex-col gap-1.5 text-[10px] font-black uppercase mb-4">
                  <span style={{ color: colors.springGreen }}>PROMOTERS: {calcNPS(entries).p}%</span>
                  <span style={{ color: t.textMuted }}>PASSIVES: {calcNPS(entries).ps}%</span>
                  <span style={{ color: colors.tomato }}>DETRACTORS: {calcNPS(entries).d}%</span>
                </div>
                <div className="flex h-5 rounded-full overflow-hidden shadow-inner p-0.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }}>
                  <div style={{ width: `${calcNPS(entries).p}%`, backgroundColor: colors.springGreen }} className="rounded-l-full" /><div style={{ width: `${calcNPS(entries).ps}%`, backgroundColor: isDark ? '#475569' : '#CBD5E1' }} /><div style={{ width: `${calcNPS(entries).d}%`, backgroundColor: colors.tomato }} className="rounded-r-full" />
                </div>
              </div>
            </>
          )}
        </div>

        <section className="p-8 rounded-3xl shadow-xl border mb-10" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <h3 className="text-xl font-black mb-8 border-b pb-4 uppercase tracking-tight flex items-end gap-2" style={{ color: t.textMain, borderColor: t.cardBorder }}>PILLAR METRICS <span className="text-[10px] normal-case tracking-normal mb-1 opacity-70">(average scale)</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            {activeTab === 'onboarding' && (
              <>
                {/* Original Onboarding Logistics */}
                <Metric label="ONBOARDING SATISFACTION" val={calc(entries, 'sat_next_steps')} type="sat" isDark={isDark} t={t} />
                <Metric label="PROGRAM EXPECTATION CLARITY" val={calc(entries, 'clear_expectations')} type="agree" isDark={isDark} t={t} />
                <Metric label="ACCESS TO PROGRAM TEAM" val={calc(entries, 'access_tech_mentors')} type="agree" isDark={isDark} t={t} />
                <Metric label="CONNECT WITH PEERS" val={calc(entries, 'connect_peers')} type="agree" isDark={isDark} t={t} />
                <Metric label="PLATFORM BUG AWARENESS" val={calc(entries, 'help_platform_bugs')} type="agree" isDark={isDark} t={t} />
                <Metric label="SUPPORT TOOL CLARITY" val={calc(entries, 'access_support_tools')} type="agree" isDark={isDark} t={t} />
                <Metric label="PAUSE/WITHDRAW CLARITY" val={calc(entries, 'know_pause_withdraw')} type="agree" isDark={isDark} t={t} />
                <Metric label="COMMS CLARITY & USEFULNESS" val={calc(entries, 'comms_useful')} type="help" isDark={isDark} t={t} />
                
                {/* New Skills Assessment Data */}
                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t" style={{ borderColor: t.cardBorder }}>
                   <h4 className="text-xs font-black uppercase tracking-[0.1em] mb-4" style={{ color: t.textMuted }}>SKILLS ASSESSMENT BASELINE</h4>
                </div>
                <Metric label="CAN EXPLAIN AI CONCEPTS" val={calc(entries, 'skill_explain_ai')} type="agree" isDark={isDark} t={t} />
                <Metric label="CAN WRITE CLEAR PROMPTS" val={calc(entries, 'skill_write_prompts')} type="agree" isDark={isDark} t={t} />
                <Metric label="CAN EVALUATE AI ETHICS" val={calc(entries, 'skill_evaluate_ethics')} type="agree" isDark={isDark} t={t} />
                <Metric label="CAN CREATE AI CONTENT" val={calc(entries, 'skill_create_content')} type="agree" isDark={isDark} t={t} />
                <Metric label="CAN IDENTIFY DATA PATTERNS" val={calc(entries, 'skill_identify_patterns')} type="agree" isDark={isDark} t={t} />
                <Metric label="CAN BUILD AI PORTFOLIO" val={calc(entries, 'skill_build_portfolio')} type="agree" isDark={isDark} t={t} />
              </>
            )}
            {activeTab === 'eop' && (
              <><Metric label="OVERALL EXPERIENCE" val={calc(entries, 'overall_sat')} type="sat" isDark={isDark} t={t} /><Metric label="CAREER IMPACT" val={calc(entries, 'career_impact')} type="help" isDark={isDark} t={t} /><Metric label="COMMUNITY EVENTS" val={calc(entries, 'supp_events')} type="agree" isDark={isDark} t={t} /><Metric label="PEER SUPPORT" val={calc(entries, 'supp_peers')} type="agree" isDark={isDark} t={t} /><Metric label="PROGRAM TEAM SUPPORT" val={calc(entries, 'supp_mentors')} type="agree" isDark={isDark} t={t} /><Metric label="LEA (AI ASSISTANT)" val={calc(entries, 'supp_lea')} type="agree" isDark={isDark} t={t} /><Metric label="CHIDI (AI ASSISTANT)" val={calc(entries, 'supp_chidi')} type="agree" isDark={isDark} t={t} /><Metric label="PROGRAM TEAM COMMS" val={calc(entries, 'supp_prog_team')} type="agree" isDark={isDark} t={t} /><Metric label="PEERFINDER APP" val={calc(entries, 'supp_peerfinder')} type="agree" isDark={isDark} t={t} /><Metric label="RESOURCES HUB" val={calc(entries, 'supp_hub')} type="agree" isDark={isDark} t={t} /></>
            )}
            {(activeTab === 'community' || activeTab === 'support') && <Metric label="SESSION QUALITY RATING" val={calc(entries, 'session_quality_csat')} type="quality" isDark={isDark} t={t} />}
          </div>
          
          {/* Added Demographics to Onboarding for Primary Goal */}
          {activeTab === 'onboarding' && (
            <div className="mt-12 pt-8 border-t" style={{ borderColor: t.cardBorder }}>
              <h3 className="text-xs font-black uppercase tracking-[0.1em] mb-6" style={{ color: t.textMuted }}>DEMOGRAPHICS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <DemographicChart data={entries} column="primary_goal" title="PRIMARY LEARNING GOAL" colorsArr={[colors.iris, colors.springGreen, colors.electricBlue, colors.gold]} isDark={isDark} t={t} />
              </div>
            </div>
          )}

          {activeTab === 'eop' && (
            <div className="mt-12 pt-8 border-t" style={{ borderColor: t.cardBorder }}>
              <h3 className="text-xs font-black uppercase tracking-[0.1em] mb-6" style={{ color: t.textMuted }}>DEMOGRAPHICS COMPARISON</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <DemographicChart data={entries} column="employment_status" title="EMPLOYMENT STATUS" colorsArr={[colors.berkeleyBlue, colors.blueNCS, colors.electricBlue, colors.turquoise]} isDark={isDark} t={t} />
                 <DemographicChart data={entries} column="city_residence" title="CITY OF RESIDENCE" colorsArr={[colors.iris, colors.springGreen, colors.gold, colors.tomato]} isDark={isDark} t={t} />
              </div>
            </div>
          )}
        </section>

        <section className="p-10 rounded-3xl shadow-xl border-t-8 hover:scale-[1.01] transition-transform duration-300 w-full mb-10" style={{ backgroundColor: t.cardBg, borderColor: colors.iris }}>
          <div className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: t.cardBorder }}>
            <h3 className="text-lg font-black uppercase tracking-widest flex items-end gap-2" style={{ color: t.textMain }}>
              LEARNER FEEDBACK SUMMARY <span className="text-[10px] normal-case tracking-normal mb-1 opacity-70">(AI generated)</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aiSummaries && aiSummaries.length > 0 ? (
              aiSummaries.map((summary) => (
                <div key={summary.id} className="border-l-4 pl-6 py-2 rounded-r-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: colors.electricBlue }}>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h4 className="text-base font-black uppercase tracking-tight leading-tight" style={{ color: t.textMain }}>{summary.theme_title}</h4>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', color: t.textMain }}>{summary.response_count} Mentions</span>
                  </div>
                  <p className="text-sm leading-relaxed italic" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>"{summary.summary_text}"</p>
                </div>
              ))
            ) : (
              <div className="text-center p-8 rounded-2xl border md:col-span-2 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: t.cardBorder }}>
                <p className="text-sm font-bold italic" style={{ color: t.textMuted }}>No AI summaries generated for this context yet.</p>
                
                <form action={generateAISummary}>
                  <input type="hidden" name="program" value={program} />
                  <input type="hidden" name="activeTab" value={activeTab} />
                  <input type="hidden" name="startDate" value={startDate} />
                  <input type="hidden" name="endDate" value={endDate} />
                  <input type="hidden" name="activeEvent" value={activeEvent} />
                  <input type="hidden" name="reportPeriod" value={reportPeriod} />
                  
                  <button type="submit" className="px-6 py-3 rounded-xl text-xs font-black tracking-widest text-white transition-all hover:scale-105 shadow-md flex items-center gap-2" style={{ backgroundColor: colors.iris }}>
                    ✨ SUMMARIZE FEEDBACK FOR {(activeTab === 'community' || activeTab === 'support') ? activeEvent.toUpperCase() : (month === 'All' ? `FULL ${quarter}` : month.toUpperCase())}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {(activeTab === 'onboarding' || activeTab === 'eop') && (
          <section className="p-10 rounded-3xl shadow-2xl border-t-8 mt-4" style={{ backgroundColor: t.cardBg, borderColor: colors.turquoise }}>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight flex items-end gap-3" style={{ color: t.textMain }}>KEY SENTIMENT INSIGHTS <span className="text-sm normal-case tracking-normal opacity-70 mb-1">(top-box scoring)</span></h3>
            <p className="text-sm italic mb-8" style={{ color: t.textMuted }}>Percentage of respondents scoring 4 or 5. Extracted directly from Pillar Metrics.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === 'onboarding' && (
                <>
                  <InsightRow pct={calcTopBox(entries, 'sat_next_steps')} text="are highly satisfied with their onboarding experience and confidently know their next steps." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'clear_expectations')} text="completely understand the program's expectations and graduation requirements." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'access_tech_mentors')} text="know exactly how to access the Program Team for expert guidance when needed." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'connect_peers')} text="know exactly how to connect with peers and Community Ambassadors for support." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'help_platform_bugs')} text="know where to go to get help with platform issues and technical bugs." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'access_support_tools')} text="are clear on how to access key support tools like LEA, Chidi, and PeerFinder." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'know_pause_withdraw')} text="know exactly what to do if they need to pause or withdraw from the program." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'comms_useful')} text="found emails and community communications clear and highly useful for getting started." isDark={isDark} t={t} />
                  
                  {/* Skills Assessment Insights */}
                  <InsightRow pct={calcTopBox(entries, 'skill_explain_ai')} text="feel highly confident explaining artificial intelligence and how AI systems work." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'skill_write_prompts')} text="are confident in writing goal-oriented prompts to guide AI tools for quality results." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'skill_evaluate_ethics')} text="feel highly capable of evaluating an AI tool against core ethical principles." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'skill_create_content')} text="are confident using generative AI to create professional text and multimedia content." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'skill_identify_patterns')} text="are highly confident using AI tools to identify data patterns and visual findings." isDark={isDark} t={t} />
                  <InsightRow pct={calcTopBox(entries, 'skill_build_portfolio')} text="feel fully ready to build and publish an AI-powered professional portfolio." isDark={isDark} t={t} />
                </>
              )}
              {activeTab === 'eop' && (
                <><InsightRow pct={calcTopBox(entries, 'overall_sat')} text="are highly satisfied with their overall program experience." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'career_impact')} text="feel the program was highly effective in enhancing their skills and advancing their careers." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_events')} text="say community events kept them motivated, engaged, and on track to complete the program." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_peers')} text="felt well-supported and motivated by their peers throughout their learning journey." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_mentors')} text="state that Program Team support contributed meaningfully to their learning." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_lea')} text="found the LEA AI Assistant easily accessible and highly useful when facing challenges." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_chidi')} text="relied on Chidi AI to successfully navigate and overcome learning content challenges." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_prog_team')} text="received timely and helpful guidance from the Program Team communications." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_peerfinder')} text="successfully used the PeerFinder tool to connect with peers for collaboration." isDark={isDark} t={t} /><InsightRow pct={calcTopBox(entries, 'supp_hub')} text="found the Program Guides and Resources Hub essential for supporting their journey." isDark={isDark} t={t} /></>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// 6. ARCHITECTURAL HELPER FUNCTIONS
function StatCard({ label, value, accent, isDark, t }: any) { return ( <div className="p-6 rounded-2xl shadow-lg border-t-4 hover:scale-105 transition-all duration-300 cursor-default" style={{ backgroundColor: t.cardBg, borderColor: accent }}> <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>{label}</p> <h4 className="text-5xl font-black" style={{ color: t.textMain }}>{value}</h4> </div> ); }
function getScaleLabel(val: number, type: string) { if (val >= 4.5) return type === 'agree' ? 'Strongly Agreed' : type === 'help' ? 'Very Helpful' : type === 'quality' ? 'Excellent' : 'Highly Satisfied'; if (val >= 3.9) return type === 'agree' ? 'Agreed' : type === 'help' ? 'Helpful' : type === 'quality' ? 'Very Good' : 'Satisfied'; if (val >= 3.3) return type === 'agree' ? 'Neither' : type === 'help' ? 'Moderate' : type === 'quality' ? 'Good' : 'Neutral'; if (val >= 2.0) return type === 'agree' ? 'Disagreed' : type === 'help' ? 'Unhelpful' : type === 'quality' ? 'Fair' : 'Dissatisfied'; return type === 'agree' ? 'Strongly Disagreed' : type === 'help' ? 'Very Unhelpful' : type === 'quality' ? 'Poor' : 'Very Dissatisfied'; }
function Metric({ label, val, type = 'sat', isDark, t }: any) { const numVal = Number(val); const width = (numVal / 5) * 100; let finalColor = colors.tomato; if (numVal >= 4.5) finalColor = colors.springGreen; else if (numVal >= 3.9) finalColor = colors.blueNCS; else if (numVal >= 3.3) finalColor = colors.gold; const scaleText = getScaleLabel(numVal, type); return ( <div className="group p-3 rounded-xl hover:scale-[1.02] transition-all duration-300 cursor-default border border-transparent" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'transparent' }}> <div className="flex justify-between items-end mb-2"> <span className="text-[11px] font-black tracking-tight uppercase" style={{ color: t.textMuted }}>{label}</span> <div className="flex items-center gap-3"> <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: finalColor }}>{scaleText}</span> <span className="text-sm font-black" style={{ color: t.textMain }}>{val} / 5.0</span> </div> </div> <div className="h-6 rounded-full overflow-hidden shadow-inner p-0.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}> <div style={{ width: `${width}%`, backgroundColor: finalColor }} className="h-full rounded-full transition-all duration-700 shadow-sm" /> </div> </div> ); }
function InsightRow({ pct, text, isDark, t }: any) { let pctColor = colors.tomato; if (pct >= 80) pctColor = colors.springGreen; else if (pct >= 60) pctColor = colors.blueNCS; return ( <div className="flex items-center gap-4 p-4 rounded-2xl hover:scale-[1.02] transition-transform duration-300 border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: t.cardBorder }}> <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: `${pctColor}20` }}> <span className="text-xl font-black" style={{ color: pctColor }}>{pct}%</span> </div> <p className="text-sm font-medium leading-snug" style={{ color: isDark ? '#E2E8F0' : '#334155' }}> <strong style={{ color: t.textMain }}>{pct}% of respondents</strong> {text} </p> </div> ); }
function DemographicChart({ data, column, title, colorsArr, isDark, t }: any) { if (!data?.length) return null; const counts: Record<string, number> = {}; data.forEach((d: any) => { const val = d[column] || 'Unknown/Other'; counts[val] = (counts[val] || 0) + 1; }); const total = data.length; const segments = Object.entries(counts).map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) })).sort((a, b) => b.pct - a.pct).slice(0, 4); return ( <div className="space-y-4 group hover:scale-[1.02] transition-transform duration-300"> <h4 className="text-[10px] font-black tracking-widest uppercase" style={{ color: t.textMuted }}>{title}</h4> <div className="flex h-6 rounded-full overflow-hidden shadow-inner p-0.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }}> {segments.map((seg, i) => ( <div key={seg.label} style={{ width: `${seg.pct}%`, backgroundColor: colorsArr[i % colorsArr.length] }} className="h-full first:rounded-l-full last:rounded-r-full" title={`${seg.label}: ${seg.pct}%`} /> ))} </div> <div className="grid grid-cols-2 gap-2 mt-3"> {segments.map((seg, i) => ( <div key={seg.label} className="flex items-center gap-2"> <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colorsArr[i % colorsArr.length] }} /> <span className="text-[10px] font-bold truncate" style={{ color: t.textMain }}>{seg.label} <span style={{ color: t.textMuted }}>({seg.pct}%)</span></span> </div> ))} </div> </div> ); }
function calc(data: any[] | null, col: string) { if (!data?.length) return 0; const valid = data.filter(d => d[col] !== null); return valid.length ? (valid.reduce((a, c) => a + (c[col] || 0), 0) / valid.length).toFixed(1) : "0"; }
function calcTopBox(data: any[] | null, col: string) { if (!data?.length) return 0; const valid = data.filter(d => d[col] !== null); if (valid.length === 0) return 0; const topBoxCount = valid.filter(d => d[col] >= 4).length; return Math.round((topBoxCount / valid.length) * 100); }
function calcOutcome(data: any[] | null) { if(!data?.length) return 0; const valid = data.filter(d => d.understood_outcomes !== null); return valid.length ? ((valid.filter(d => d.understood_outcomes === true).length / valid.length) * 100).toFixed(0) : "0"; }
function calcNPS(data: any[] | null) { if (!data?.length) return { score: 0, p: 0, ps: 0, d: 0 }; const p = data.filter(e => e.nps_score >= 9).length; const ps = data.filter(e => e.nps_score === 7 || e.nps_score === 8).length; const d = data.filter(e => e.nps_score <= 6).length; const total = data.length; return { score: (((p / total) * 100) - ((d / total) * 100)).toFixed(0), p: ((p / total) * 100).toFixed(0), ps: ((ps / total) * 100).toFixed(0), d: ((d / total) * 100).toFixed(0) }; }
