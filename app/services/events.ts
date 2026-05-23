import { supabase } from '../config';

function eventsService() {
	const tableMap: Record<string, string> = {
		onboarding: 'survey_onboarding',
		community: 'survey_events',
		support: 'survey_events',
		eop: 'survey_eop',
	};

	const getLatestEvent = async (
		activeTab: string,
		program: string,
		startDate: string,
		endDate: string
	) => {
		if (!startDate) {
			throw new Error('Cannot get latest event without startDate');
		}
		if (!endDate) {
			throw new Error('Cannot get latest event without endDate');
		}

		try {
			let uniqueEvents: string[] = [];
			let latestEvent = '';

			if (activeTab === 'community' || activeTab === 'support') {
				const eventTypeStr =
					activeTab === 'community' ? 'Community Event' : 'Program Team';

				const allEventsQuery = await supabase
					.from(tableMap[activeTab])
					.select('event_name_date, created_at')
					.eq('program', program)
					.gte('created_at', startDate)
					.lte('created_at', endDate)
					.eq('event_type', eventTypeStr)
					.order('created_at', { ascending: false })
					.limit(10000);

				if (allEventsQuery.data) {
					const seen = new Set();
					for (const item of allEventsQuery.data) {
						if (item.event_name_date && !seen.has(item.event_name_date)) {
							seen.add(item.event_name_date);
							uniqueEvents.push(item.event_name_date);
						}
					}

					if (uniqueEvents.length > 0) latestEvent = uniqueEvents[0];
				}
			}
			return { latestEvent, uniqueEvents };
		} catch (error: any) {
			console.error('Something went wrong: Fetching latest event');
			throw new Error(error);
		}
	};

	// TODO: Maybe rename better
	const getTotalEvents = async (
		activeTab: string,
		activeEvent: string,
		program: string,
		startDate: string,
		endDate: string
	) => {
		try {
			let query = supabase
				.from(tableMap[activeTab])
				.select('*')
				.eq('program', program)
				.gte('created_at', startDate)
				.lte('created_at', endDate)
				.limit(10000);
			if (activeTab === 'community')
				query = query.eq('event_type', 'Community Event');
			if (activeTab === 'support')
				query = query.eq('event_type', 'Program Team');
			if (
				(activeTab === 'community' || activeTab === 'support') &&
				activeEvent &&
				activeEvent !== 'All'
			)
				query = query.eq('event_name_date', activeEvent);

			const { data: entries } = await query;
			const total = entries?.length || 0;

			return { total, entries };
		} catch (error: any) {
			console.error('Something went wrong: Getting total events');
			throw new Error(error);
		}
	};

	return {
		getLatestEvent,
		getTotalEvents,
	};
}

export default eventsService;
