import { date } from './constants/date';

export const getDate = (year: string, month: string, quarter: string) => {
	const { quarterMonths, monthEnds } = date;
	let startDate, endDate, reportPeriod;

	if (month !== 'All') {
		startDate = `${year}-${month}-01T00:00:00Z`;
		endDate = `${year}-${month}-${monthEnds[month]}T23:59:59Z`;
		reportPeriod = `${year}-${month}`;
	} else {
		const startM = quarterMonths[quarter][0].val;
		const endM = quarterMonths[quarter][3].val;
		startDate = `${year}-${startM}-01T00:00:00Z`;
		endDate = `${year}-${endM}-${monthEnds[endM]}T23:59:59Z`;
		reportPeriod = `${year}-${quarter}`;
	}

	return { startDate, endDate, reportPeriod };
};
