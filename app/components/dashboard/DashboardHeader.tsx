import Link from 'next/link';
import { colors } from '../../utils/style';
import { date } from '../../utils/constants/date';
import { dashboardUrl } from './dashboardUrl';
import { TAB_DISPLAY_MAP } from './metrics.config';
import type { ThemeStyle } from './types';

type DashboardHeaderProps = {
	program: string;
	activeTab: string;
	year: string;
	quarter: string;
	month: string;
	theme: string;
	isDark: boolean;
	activeEvent: string;
	themeStyle: ThemeStyle;
};

export function DashboardHeader({
	program,
	activeTab,
	year,
	quarter,
	month,
	theme,
	isDark,
	activeEvent,
	themeStyle,
}: DashboardHeaderProps) {
	const { quarterMonths } = date;

	return (
		<header
			className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b pb-6"
			style={{ borderColor: themeStyle.cardBorder }}
		>
			<div className="mb-6 md:mb-0">
				<h2
					className="text-4xl lg:text-5xl font-black mb-2 tracking-tight flex items-center gap-3"
					style={{ color: themeStyle.textMain }}
				>
					<span className="uppercase">{program}</span>{' '}
					<span className="text-zinc-500 font-medium text-3xl">&rarr;</span>{' '}
					<span>{TAB_DISPLAY_MAP[activeTab]}</span>
				</h2>
				<p
					className="text-lg italic font-medium"
					style={{ color: themeStyle.textMuted }}
				>
					Program Feedback Automation & Analysis
				</p>
			</div>

			<div className="flex flex-col items-end gap-3">
				<div className="flex gap-2 items-center">
					<Link
						href={dashboardUrl({
							program,
							tab: activeTab,
							year,
							quarter,
							month,
							theme: isDark ? 'light' : 'dark',
							event: activeEvent,
						})}
						className="px-4 py-2 rounded-lg text-[10px] font-black transition-all shadow-sm border mr-2 flex items-center gap-2"
						style={{
							backgroundColor: isDark
								? 'rgba(255,255,255,0.1)'
								: colors.white,
							color: themeStyle.textMain,
							borderColor: themeStyle.cardBorder,
						}}
					>
						{isDark ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
					</Link>
					<FilterSegment
						options={['2025', '2026']}
						active={year}
						themeStyle={themeStyle}
						getHref={(y) =>
							dashboardUrl({
								program,
								tab: activeTab,
								year: y,
								quarter,
								month: 'All',
								theme,
							})
						}
						isDark={isDark}
					/>
					<FilterSegment
						options={['S1', 'S2', 'S3']}
						active={quarter}
						themeStyle={themeStyle}
						getHref={(q) =>
							dashboardUrl({
								program,
								tab: activeTab,
								year,
								quarter: q,
								month: 'All',
								theme,
							})
						}
						isDark={isDark}
					/>
				</div>
				<div
					className="flex gap-1 p-1 rounded-xl border"
					style={{
						backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.white,
						borderColor: themeStyle.cardBorder,
					}}
				>
					<Link
						href={dashboardUrl({
							program,
							tab: activeTab,
							year,
							quarter,
							month: 'All',
							theme,
						})}
						className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
							month === 'All' ? 'shadow-sm' : 'hover:opacity-70'
						}`}
						style={{
							backgroundColor:
								month === 'All'
									? isDark
										? 'rgba(255,255,255,0.1)'
										: colors.berkeleyBlue
									: 'transparent',
							color: month === 'All' ? colors.white : themeStyle.textMuted,
						}}
					>
						FULL {quarter}
					</Link>
					{quarterMonths[quarter].map((m) => (
						<Link
							key={m.val}
							href={dashboardUrl({
								program,
								tab: activeTab,
								year,
								quarter,
								month: m.val,
								theme,
							})}
							className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
								month === m.val ? 'shadow-sm' : 'hover:opacity-70'
							}`}
							style={{
								backgroundColor:
									month === m.val
										? isDark
											? 'rgba(255,255,255,0.1)'
											: colors.berkeleyBlue
										: 'transparent',
								color: month === m.val ? colors.white : themeStyle.textMuted,
							}}
						>
							{m.name.toUpperCase()}
						</Link>
					))}
				</div>
			</div>
		</header>
	);
}

function FilterSegment({
	options,
	active,
	themeStyle,
	getHref,
	isDark,
}: {
	options: string[];
	active: string;
	themeStyle: ThemeStyle;
	getHref: (option: string) => string;
	isDark: boolean;
}) {
	return (
		<div
			className="flex p-1 rounded-xl shadow-inner backdrop-blur-sm"
			style={{
				backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,43,86,0.05)',
			}}
		>
			{options.map((option) => (
				<Link
					key={option}
					href={getHref(option)}
					className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
						active === option ? 'shadow-sm' : 'hover:opacity-70'
					}`}
					style={{
						backgroundColor:
							active === option ? themeStyle.cardBg : 'transparent',
						color:
							active === option ? themeStyle.textMain : themeStyle.textMuted,
					}}
				>
					{option}
				</Link>
			))}
		</div>
	);
}
