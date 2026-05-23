import { calc } from '../utils/helpers';

function csatService() {
	const getCsatStats = async (
		activeTab: string,
		csatCol: string | undefined,
		entries: any[] | null,
		total: number
	) => {
		if (!csatCol) throw new Error('missing csatCol');
		if (!entries) throw new Error('missing entries');

		try {
			const csatRespondents =
				activeTab === 'community' || activeTab === 'support'
					? entries?.filter(
							(e) => e[csatCol!] !== null && e[csatCol!] !== undefined
					  ).length || 0
					: total;
			const csatVal =
				csatRespondents > 0
					? (
							((entries?.filter((e) => e[csatCol!] >= 4).length || 0) /
								csatRespondents) *
							100
					  ).toFixed(1)
					: '0.0';
			const avgAttendance =
				activeTab === 'community' || activeTab === 'support'
					? calc(entries, 'attendance_duration_mins')
					: '0';

			return { csatRespondents, csatVal, avgAttendance };
		} catch (error: any) {
			console.error('Something went wrong: Error fetching csat stats');
			throw new Error(error);
		}
	};

	return {
		getCsatStats,
	};
}

export default csatService;
