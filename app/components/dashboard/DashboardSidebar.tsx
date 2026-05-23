import Link from 'next/link';
import { colors } from '../../utils/style';
import { dashboardUrl } from './dashboardUrl';
import { PROGRAMS } from './metrics.config';
import type { ThemeStyle } from './types';

type DashboardSidebarProps = {
	program: string;
	activeTab: string;
	year: string;
	quarter: string;
	month: string;
	theme: string;
	themeStyle: ThemeStyle;
};

export function DashboardSidebar({
	program,
	activeTab,
	year,
	quarter,
	month,
	theme,
	themeStyle,
}: DashboardSidebarProps) {
	return (
		<aside
			className="w-80 p-8 flex flex-col gap-10 text-white shadow-2xl relative z-20"
			style={{ backgroundColor: themeStyle.sidebar }}
		>
			<div>
				<h1 className="text-xl font-black tracking-tighter mb-4 leading-tight">
					FEEDBACK ANALYSIS
				</h1>
				<div
					className="h-1 w-12"
					style={{ backgroundColor: colors.springGreen }}
				/>
			</div>
			<nav className="flex flex-col gap-2">
				{PROGRAMS.map((p) => (
					<Link
						key={p}
						href={dashboardUrl({
							program: p,
							tab: activeTab,
							year,
							quarter,
							month,
							theme,
						})}
						className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border-l-4 ${
							program === p
								? 'bg-white/10 text-white'
								: 'text-zinc-400 hover:text-white'
						}`}
						style={{
							borderColor: program === p ? colors.springGreen : 'transparent',
						}}
					>
						{p.toUpperCase()}
					</Link>
				))}
			</nav>
		</aside>
	);
}
