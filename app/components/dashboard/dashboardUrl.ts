import type { DashboardParams } from './types';

export function dashboardUrl(params: Partial<DashboardParams>) {
	const search = new URLSearchParams();
	if (params.program) search.set('program', params.program);
	if (params.tab) search.set('tab', params.tab);
	if (params.year) search.set('year', params.year);
	if (params.quarter) search.set('quarter', params.quarter);
	if (params.month) search.set('month', params.month);
	if (params.theme) search.set('theme', params.theme);
	if (params.event) search.set('event', params.event);
	return `/?${search.toString()}`;
}
