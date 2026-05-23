import { getThemeStyle } from './utils/style';
import { getDate } from './utils/date';
import jobsService from './services/jobs';
import aiSummariesService from './services/ai-summaries';
import eventsService from './services/events';
import csatService from './services/csat';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardSidebar } from './components/dashboard/DashboardSidebar';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { TabNav } from './components/dashboard/TabNav';
import { EventFilterDropdown } from './components/dashboard/EventFilterDropdown';
import { StatsCardsGrid } from './components/dashboard/StatsCardsGrid';
import { PillarMetricsSection } from './components/dashboard/PillarMetricsSection';
import { AISummarySection } from './components/dashboard/AISummarySection';
import { SentimentInsightsSection } from './components/dashboard/SentimentInsightsSection';

export const dynamic = 'force-dynamic';

export default async function Dashboard(props: {
	searchParams: Promise<{
		program?: string;
		tab?: string;
		year?: string;
		quarter?: string;
		month?: string;
		theme?: string;
		event?: string;
	}>;
}) {
	const params = await props.searchParams;
	const program = params.program || 'AiCE';
	const activeTab = params.tab || 'onboarding';
	const year = params.year || '2026';
	const quarter = params.quarter || 'S1';
	const month = params.month || 'All';
	const theme = params.theme || 'light';
	const selectedEvent = params.event || 'All';
	const isDark = theme === 'dark';
	const themeStyle = getThemeStyle(isDark);

	const { fetchEventJobStatus } = jobsService();
	const { fetchAISummaries } = aiSummariesService();
	const { getLatestEvent, getTotalEvents } = eventsService();
	const { getCsatStats } = csatService();

	const { startDate, endDate, reportPeriod } = getDate(year, month, quarter);

	const { latestEvent, uniqueEvents } = await getLatestEvent(
		activeTab,
		program,
		startDate,
		endDate
	);

	const activeEvent =
		selectedEvent === 'All' && latestEvent ? latestEvent : selectedEvent;

	const { total, entries } = await getTotalEvents(
		activeTab,
		activeEvent,
		program,
		startDate,
		endDate
	);

	// ── Fetch AI summaries ──────────────────────────────────────────────────────
	const aiSummaries = await fetchAISummaries(
		activeTab,
		program,
		reportPeriod,
		activeEvent
	);

	// ── Fetch job status for this exact context ─────────────────────────────────
	const { jobError, jobStatus } = await fetchEventJobStatus(
		activeTab,
		program,
		activeEvent,
		reportPeriod
	);

	// ── Payload for the Render trigger (passed to the client component) ──────────
	const summaryPayload = {
		program,
		activeTab,
		startDate,
		endDate,
		activeEvent,
		reportPeriod,
	};

	const csatCol = {
		onboarding: 'sat_next_steps',
		community: 'session_quality_csat',
		support: 'session_quality_csat',
		eop: 'overall_sat',
	}[activeTab];
	// For community/support: divide by respondents who actually answered the CSAT question,
	// not total attendees (many attend without submitting the survey poll).
	// For onboarding/eop: every row IS a survey response so total is correct.
	const { csatVal, avgAttendance } = await getCsatStats(
		activeTab,
		csatCol,
		// TODO: find better name for entries
		entries,
		total
	);

	return (
		<DashboardLayout
			isDark={isDark}
			themeStyle={themeStyle}
			sidebar={
				<DashboardSidebar
					program={program}
					activeTab={activeTab}
					year={year}
					quarter={quarter}
					month={month}
					theme={theme}
					themeStyle={themeStyle}
				/>
			}
		>
			<DashboardHeader
				program={program}
				activeTab={activeTab}
				year={year}
				quarter={quarter}
				month={month}
				theme={theme}
				isDark={isDark}
				activeEvent={activeEvent}
				themeStyle={themeStyle}
			/>

			<TabNav
				program={program}
				activeTab={activeTab}
				year={year}
				quarter={quarter}
				month={month}
				theme={theme}
				themeStyle={themeStyle}
			/>

			<EventFilterDropdown
				activeTab={activeTab}
				program={program}
				year={year}
				quarter={quarter}
				month={month}
				theme={theme}
				activeEvent={activeEvent}
				uniqueEvents={uniqueEvents}
				isDark={isDark}
				themeStyle={themeStyle}
			/>

			<StatsCardsGrid
				activeTab={activeTab}
				total={total}
				avgAttendance={avgAttendance}
				csatVal={csatVal}
				entries={entries}
				isDark={isDark}
				themeStyle={themeStyle}
			/>

			<PillarMetricsSection
				activeTab={activeTab}
				program={program}
				entries={entries}
				isDark={isDark}
				themeStyle={themeStyle}
			/>

			<AISummarySection
				aiSummaries={aiSummaries}
				jobStatus={jobStatus}
				jobError={jobError}
				summaryPayload={summaryPayload}
				program={program}
				activeTab={activeTab}
				year={year}
				quarter={quarter}
				month={month}
				theme={theme}
				activeEvent={activeEvent}
				isDark={isDark}
				themeStyle={themeStyle}
			/>

			<SentimentInsightsSection
				activeTab={activeTab}
				program={program}
				entries={entries}
				isDark={isDark}
				themeStyle={themeStyle}
			/>
		</DashboardLayout>
	);
}
