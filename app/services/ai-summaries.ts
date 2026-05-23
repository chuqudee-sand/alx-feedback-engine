import { supabase } from '../config';

function aiSummariesService() {
	const fetchAISummaries = async (
		activeTab: string,
		program: string,
		reportPeriod: string,
		activeEvent: string
	) => {
		try {
			let summaryQuery = supabase
				.from('ai_thematic_summaries')
				.select('*')
				.eq('program', program)
				.eq('tab_name', activeTab);

			if (activeTab === 'onboarding' || activeTab === 'eop')
				summaryQuery = summaryQuery.eq('report_period', reportPeriod);
			else summaryQuery = summaryQuery.eq('event_name_date', activeEvent);

			const { data: aiSummaries } = await summaryQuery
				.order('created_at', { ascending: false })
				.limit(6);

			return aiSummaries;
		} catch (error: any) {
			console.error('Something went wrong: Fetching AI summaries');
			throw new Error(error);
		}
	};

	return {
		fetchAISummaries,
	};
}

export default aiSummariesService;
