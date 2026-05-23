import type { ThemeStyle } from './dashboard/types';

type StatCardProps = {
	label: string;
	value: string | number;
	accent: string;
	isDark: boolean;
	t: ThemeStyle;
};

export function StatCard({ label, value, accent, t }: StatCardProps) {
	return (
		<div
			className="p-6 rounded-2xl shadow-lg border-t-4 hover:scale-105 transition-all duration-300 cursor-default"
			style={{ backgroundColor: t.cardBg, borderColor: accent }}
		>
			<p
				className="text-[10px] font-black uppercase tracking-widest mb-2"
				style={{ color: t.textMuted }}
			>
				{label}
			</p>
			<h4 className="text-5xl font-black" style={{ color: t.textMain }}>
				{value}
			</h4>
		</div>
	);
}
