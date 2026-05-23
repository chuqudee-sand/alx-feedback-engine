import Link from 'next/link';
import { colors } from '../../utils/style';
import { dashboardUrl } from './dashboardUrl';
import type { ThemeStyle } from './types';

type EventFilterDropdownProps = {
	activeTab: string;
	program: string;
	year: string;
	quarter: string;
	month: string;
	theme: string;
	activeEvent: string;
	uniqueEvents: string[];
	isDark: boolean;
	themeStyle: ThemeStyle;
};

export function EventFilterDropdown({
	activeTab,
	program,
	year,
	quarter,
	month,
	theme,
	activeEvent,
	uniqueEvents,
	isDark,
	themeStyle,
}: EventFilterDropdownProps) {
	if (
		(activeTab !== 'community' && activeTab !== 'support') ||
		uniqueEvents.length === 0
	) {
		return null;
	}

	return (
		<div className="mb-4 relative z-40 flex items-center gap-3">
			<span
				className="text-[10px] font-black uppercase tracking-widest"
				style={{ color: themeStyle.textMuted }}
			>
				Filter by Event:
			</span>
			<div className="relative inline-block">
				<input type="checkbox" id="event-dropdown" className="peer hidden" />
				<label
					htmlFor="event-dropdown"
					className="list-none outline-none text-[10px] font-bold px-4 py-2 rounded-lg border cursor-pointer shadow-sm flex items-center transition-all hover:scale-[1.02]"
					style={{
						backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.white,
						color: themeStyle.textMain,
						borderColor: themeStyle.cardBorder,
					}}
				>
					{activeEvent.length > 40
						? activeEvent.substring(0, 40) + '...'
						: activeEvent}
					<span className="text-[8px] opacity-50 ml-3">▼</span>
				</label>
				<label
					htmlFor="event-dropdown"
					className="fixed inset-0 z-40 hidden peer-checked:block bg-transparent cursor-default"
				/>
				<div
					className="absolute top-full left-0 mt-2 hidden peer-checked:flex flex-col border rounded-xl shadow-2xl max-h-64 overflow-y-auto whitespace-nowrap min-w-[280px] z-50"
					style={{
						backgroundColor: isDark ? colors.sidebarNavy : colors.white,
						borderColor: themeStyle.cardBorder,
					}}
				>
					{uniqueEvents.map((ev) => (
						<Link
							key={ev}
							href={dashboardUrl({
								program,
								tab: activeTab,
								year,
								quarter,
								month,
								theme,
								event: ev,
							})}
							className="px-4 py-3 text-[10px] font-bold border-b last:border-0 transition-colors hover:bg-zinc-100/10"
							style={{
								color:
									activeEvent === ev
										? colors.springGreen
										: themeStyle.textMuted,
								borderColor: themeStyle.cardBorder,
							}}
						>
							{ev}
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
