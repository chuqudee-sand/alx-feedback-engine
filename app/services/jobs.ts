import { supabase } from '../config';

function jobsService() {
	const fetchEventJobStatus = async (
		activeTab: string,
		program: string,
		activeEvent: string,
		reportPeriod: string
	) => {
		try {
			const jobKey =
				activeTab === 'community' || activeTab === 'support'
					? `${program}|${activeTab}|${activeEvent}`
					: `${program}|${activeTab}|${reportPeriod}`;

			const { data: jobRow } = await supabase
				.from('ai_summary_jobs')
				.select('status, error_message')
				.eq('job_key', jobKey)
				.maybeSingle();

			const jobStatus = jobRow?.status as 'busy' | 'done' | 'failed' | null;
			const jobError = jobRow?.error_message as string | null;

			return {
				jobError,
				jobStatus,
				jobKey,
			};
		} catch (error: any) {
			console.error('Something went wrong: Fetching event job status');
			throw new Error(error);
		}
	};

	return {
		fetchEventJobStatus,
	};
}

export default jobsService;
