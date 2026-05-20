const quarterMonths: Record<string, { name: string; val: string }[]> = {
	S1: [
		{ name: 'Jan', val: '01' },
		{ name: 'Feb', val: '02' },
		{ name: 'Mar', val: '03' },
		{ name: 'Apr', val: '04' },
	],
	S2: [
		{ name: 'May', val: '05' },
		{ name: 'Jun', val: '06' },
		{ name: 'Jul', val: '07' },
		{ name: 'Aug', val: '08' },
	],
	S3: [
		{ name: 'Sep', val: '09' },
		{ name: 'Oct', val: '10' },
		{ name: 'Nov', val: '11' },
		{ name: 'Dec', val: '12' },
	],
};
const monthEnds: Record<string, string> = {
	'01': '31',
	'02': '28',
	'03': '31',
	'04': '30',
	'05': '31',
	'06': '30',
	'07': '31',
	'08': '31',
	'09': '30',
	'10': '31',
	'11': '30',
	'12': '31',
};

export const date = { quarterMonths, monthEnds };
