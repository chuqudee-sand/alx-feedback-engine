import type { ThemeStyle } from './dashboard/types';

type DemographicChartProps = {
	data: Record<string, unknown>[] | null;
	column: string;
	title: string;
	colorsArr: string[];
	isDark: boolean;
	t: ThemeStyle;
};

export function DemographicChart({
	data,
	column,
	title,
	colorsArr,
	isDark,
	t,
}: DemographicChartProps) {
	if (!data?.length) return null;

	const counts: Record<string, number> = {};
	data.forEach((d) => {
		const val = (d[column] as string) || 'Unknown/Other';
		counts[val] = (counts[val] || 0) + 1;
	});

	const total = data.length;
	const segments = Object.entries(counts)
		.map(([label, count]) => ({
			label,
			pct: Math.round((count / total) * 100),
		}))
		.sort((a, b) => b.pct - a.pct)
		.slice(0, 4);

	return (
		<div className="space-y-4 group hover:scale-[1.02] transition-transform duration-300">
			<h4
				className="text-[10px] font-black tracking-widest uppercase"
				style={{ color: t.textMuted }}
			>
				{title}
			</h4>
			<div
				className="flex h-6 rounded-full overflow-hidden shadow-inner p-0.5"
				style={{
					backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
				}}
			>
				{segments.map((seg, i) => (
					<div
						key={seg.label}
						style={{
							width: `${seg.pct}%`,
							backgroundColor: colorsArr[i % colorsArr.length],
						}}
						className="h-full first:rounded-l-full last:rounded-r-full"
						title={`${seg.label}: ${seg.pct}%`}
					/>
				))}
			</div>
			<div className="grid grid-cols-2 gap-2 mt-3">
				{segments.map((seg, i) => (
					<div key={seg.label} className="flex items-center gap-2">
						<div
							className="w-3 h-3 rounded-full shadow-sm"
							style={{ backgroundColor: colorsArr[i % colorsArr.length] }}
						/>
						<span
							className="text-[10px] font-bold truncate"
							style={{ color: t.textMain }}
						>
							{seg.label}{' '}
							<span style={{ color: t.textMuted }}>({seg.pct}%)</span>
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
