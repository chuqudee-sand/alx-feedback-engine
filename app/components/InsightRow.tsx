import { colors } from '../utils/style';
import type { ThemeStyle } from './dashboard/types';

type InsightRowProps = {
	pct: number;
	text: string;
	isDark: boolean;
	t: ThemeStyle;
};

export function InsightRow({ pct, text, isDark, t }: InsightRowProps) {
	let pctColor = colors.tomato;
	if (pct >= 80) pctColor = colors.springGreen;
	else if (pct >= 60) pctColor = colors.blueNCS;

	return (
		<div
			className="flex items-center gap-4 p-4 rounded-2xl hover:scale-[1.02] transition-transform duration-300 border"
			style={{
				backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
				borderColor: t.cardBorder,
			}}
		>
			<div
				className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-inner"
				style={{ backgroundColor: `${pctColor}20` }}
			>
				<span className="text-xl font-black" style={{ color: pctColor }}>
					{pct}%
				</span>
			</div>
			<p
				className="text-sm font-medium leading-snug"
				style={{ color: isDark ? '#E2E8F0' : '#334155' }}
			>
				<strong style={{ color: t.textMain }}>{pct}% of respondents</strong>{' '}
				{text}
			</p>
		</div>
	);
}
