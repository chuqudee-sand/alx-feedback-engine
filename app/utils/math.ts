export function calc(data: any[] | null, col: string) {
	if (!data?.length) return 0;
	const valid = data.filter((d) => d[col] !== null);
	return valid.length
		? (valid.reduce((a, c) => a + (c[col] || 0), 0) / valid.length).toFixed(1)
		: '0';
}
export function calcTopBox(data: any[] | null, col: string) {
	if (!data?.length) return 0;
	const valid = data.filter((d) => d[col] !== null);
	if (valid.length === 0) return 0;
	const topBoxCount = valid.filter((d) => d[col] >= 4).length;
	return Math.round((topBoxCount / valid.length) * 100);
}
export function calcOutcome(data: any[] | null) {
	if (!data?.length) return 0;
	const valid = data.filter((d) => d.understood_outcomes !== null);
	return valid.length
		? (
				(valid.filter((d) => d.understood_outcomes === true).length /
					valid.length) *
				100
		  ).toFixed(0)
		: '0';
}
export function calcNPS(data: any[] | null) {
	if (!data?.length) return { score: 0, p: 0, ps: 0, d: 0 };
	const p = data.filter((e) => e.nps_score >= 9).length;
	const ps = data.filter((e) => e.nps_score === 7 || e.nps_score === 8).length;
	const d = data.filter((e) => e.nps_score <= 6).length;
	const total = data.length;
	return {
		score: ((p / total) * 100 - (d / total) * 100).toFixed(0),
		p: ((p / total) * 100).toFixed(0),
		ps: ((ps / total) * 100).toFixed(0),
		d: ((d / total) * 100).toFixed(0),
	};
}
