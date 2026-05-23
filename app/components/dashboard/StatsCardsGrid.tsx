import { calcOutcome, calcNPS } from '../../utils/helpers';
import { colors } from '../../utils/style';
import { StatCard } from '../StatCard';
import type { ThemeStyle } from './types';

type StatsCardsGridProps = {
	activeTab: string;
	total: number;
	avgAttendance: string | number;
	csatVal: string;
	entries: Record<string, unknown>[] | null;
	isDark: boolean;
	themeStyle: ThemeStyle;
};

export function StatsCardsGrid({
	activeTab,
	total,
	avgAttendance,
	csatVal,
	entries,
	isDark,
	themeStyle,
}: StatsCardsGridProps) {
	const isEventTab =
		activeTab === 'community' || activeTab === 'support';
	const nps = activeTab === 'eop' && entries ? calcNPS(entries) : null;

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
			<StatCard
				label={
					isEventTab ? 'TOTAL ATTENDEES' : 'TOTAL RESPONDENTS'
				}
				value={total}
				accent={colors.iris}
				isDark={isDark}
				t={themeStyle}
			/>
			{isEventTab && (
				<StatCard
					label="AVG ATTENDANCE (MINS)"
					value={avgAttendance}
					accent={colors.turquoise}
					isDark={isDark}
					t={themeStyle}
				/>
			)}
			<StatCard
				label="CSAT % (4-5 RATINGS)"
				value={`${csatVal}%`}
				accent={colors.springGreen}
				isDark={isDark}
				t={themeStyle}
			/>
			{activeTab === 'support' && entries && (
				<StatCard
					label="OUTCOME UNDERSTOOD %"
					value={`${calcOutcome(entries)}%`}
					accent={colors.blueNCS}
					isDark={isDark}
					t={themeStyle}
				/>
			)}
			{activeTab === 'eop' && nps && (
				<>
					<StatCard
						label="OVERALL NPS"
						value={nps.score}
						accent={colors.electricBlue}
						isDark={isDark}
						t={themeStyle}
					/>
					<div
						className="p-6 rounded-2xl shadow-lg border-t-4 flex flex-col justify-center hover:scale-105 transition-all duration-300"
						style={{
							backgroundColor: themeStyle.cardBg,
							borderColor: colors.blueNCS,
						}}
					>
						<div className="flex flex-col gap-1.5 text-[10px] font-black uppercase mb-4">
							<span style={{ color: colors.springGreen }}>
								PROMOTERS: {nps.p}%
							</span>
							<span style={{ color: themeStyle.textMuted }}>
								PASSIVES: {nps.ps}%
							</span>
							<span style={{ color: colors.tomato }}>
								DETRACTORS: {nps.d}%
							</span>
						</div>
						<div
							className="flex h-5 rounded-full overflow-hidden shadow-inner p-0.5"
							style={{
								backgroundColor: isDark
									? 'rgba(255,255,255,0.1)'
									: '#F1F5F9',
							}}
						>
							<div
								style={{
									width: `${nps.p}%`,
									backgroundColor: colors.springGreen,
								}}
								className="rounded-l-full"
							/>
							<div
								style={{
									width: `${nps.ps}%`,
									backgroundColor: isDark ? '#475569' : '#CBD5E1',
								}}
							/>
							<div
								style={{
									width: `${nps.d}%`,
									backgroundColor: colors.tomato,
								}}
								className="rounded-r-full"
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
