import { getThemeStyle } from '../../utils/style';

export type ThemeStyle = ReturnType<typeof getThemeStyle>;

export type DashboardParams = {
	program: string;
	tab: string;
	year: string;
	quarter: string;
	month: string;
	theme: string;
	event?: string;
};

export type SummaryPayload = {
	program: string;
	activeTab: string;
	startDate: string;
	endDate: string;
	activeEvent: string;
	reportPeriod: string;
};
