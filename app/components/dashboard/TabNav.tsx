import Link from 'next/link';
import { colors } from '../../utils/style';
import { dashboardUrl } from './dashboardUrl';
import { TABS } from './metrics.config';
import type { ThemeStyle } from './types';

type TabNavProps = {
	program: string;
	activeTab: string;
	year: string;
	quarter: string;
	month: string;
	theme: string;
	themeStyle: ThemeStyle;
};

export function TabNav({
	program,
	activeTab,
	year,
	quarter,
	month,
	theme,
	themeStyle,
}: TabNavProps) {
	return (
		<div className="flex gap-10 mb-8 overflow-x-auto">
			{TABS.map((tab) => (
				<Link
					key={tab.id}
					href={dashboardUrl({
						program,
						tab: tab.id,
						year,
						quarter,
						month,
						theme,
					})}
					className={`pb-3 text-sm font-black tracking-widest transition-all border-b-4 whitespace-nowrap ${
						activeTab === tab.id
							? 'border-springGreen'
							: 'border-transparent hover:opacity-70'
					}`}
					style={{
						color:
							activeTab === tab.id
								? themeStyle.textMain
								: themeStyle.textMuted,
						borderColor:
							activeTab === tab.id ? colors.springGreen : 'transparent',
					}}
				>
					{tab.label}
				</Link>
			))}
		</div>
	);
}
