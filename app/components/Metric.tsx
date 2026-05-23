import { colors } from '../utils/style';
import type { ThemeStyle } from './dashboard/types';
import type { MetricType } from './dashboard/metrics.config';

function getScaleLabel(val: number, type: MetricType) {
	if (val >= 4.5)
		return type === 'agree'
			? 'Strongly Agreed'
			: type === 'help'
				? 'Very Helpful'
				: type === 'quality'
					? 'Excellent'
					: 'Highly Satisfied';
	if (val >= 3.9)
		return type === 'agree'
			? 'Agreed'
			: type === 'help'
				? 'Helpful'
				: type === 'quality'
					? 'Very Good'
					: 'Satisfied';
	if (val >= 3.3)
		return type === 'agree'
			? 'Neither'
			: type === 'help'
				? 'Moderate'
				: type === 'quality'
					? 'Good'
					: 'Neutral';
	if (val >= 2.0)
		return type === 'agree'
			? 'Disagreed'
			: type === 'help'
				? 'Unhelpful'
				: type === 'quality'
					? 'Fair'
					: 'Dissatisfied';
	return type === 'agree'
		? 'Strongly Disagreed'
		: type === 'help'
			? 'Very Unhelpful'
			: type === 'quality'
				? 'Poor'
				: 'Very Dissatisfied';
}

type MetricProps = {
	label: string;
	val: string | number;
	type?: MetricType;
	isDark: boolean;
	t: ThemeStyle;
};

export function Metric({
	label,
	val,
	type = 'sat',
	isDark,
	t,
}: MetricProps) {
	const numVal = Number(val);
	const width = (numVal / 5) * 100;
	let finalColor = colors.tomato;
	if (numVal >= 4.5) finalColor = colors.springGreen;
	else if (numVal >= 3.9) finalColor = colors.blueNCS;
	else if (numVal >= 3.3) finalColor = colors.gold;
	const scaleText = getScaleLabel(numVal, type);

	return (
		<div
			className="group p-3 rounded-xl hover:scale-[1.02] transition-all duration-300 cursor-default border border-transparent"
			style={{
				backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'transparent',
			}}
		>
			<div className="flex justify-between items-end mb-2">
				<span
					className="text-[11px] font-black tracking-tight uppercase"
					style={{ color: t.textMuted }}
				>
					{label}
				</span>
				<div className="flex items-center gap-3">
					<span
						className="text-[10px] font-bold uppercase tracking-wider"
						style={{ color: finalColor }}
					>
						{scaleText}
					</span>
					<span className="text-sm font-black" style={{ color: t.textMain }}>
						{val} / 5.0
					</span>
				</div>
			</div>
			<div
				className="h-6 rounded-full overflow-hidden shadow-inner p-0.5"
				style={{
					backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
				}}
			>
				<div
					style={{ width: `${width}%`, backgroundColor: finalColor }}
					className="h-full rounded-full transition-all duration-700 shadow-sm"
				/>
			</div>
		</div>
	);
}
