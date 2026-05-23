import { calc } from '../../utils/helpers';
import { colors } from '../../utils/style';
import { DemographicChart } from '../DemographicChart';
import { Metric } from '../Metric';
import {
	AICE_SKILLS_METRICS,
	EOP_METRICS,
	ONBOARDING_METRICS,
	VA_SKILLS_METRICS,
} from './metrics.config';
import type { MetricDef } from './metrics.config';
import type { ThemeStyle } from './types';

type PillarMetricsSectionProps = {
	activeTab: string;
	program: string;
	entries: Record<string, unknown>[] | null;
	isDark: boolean;
	themeStyle: ThemeStyle;
};

function MetricList({
	metrics,
	entries,
	isDark,
	themeStyle,
}: {
	metrics: MetricDef[];
	entries: Record<string, unknown>[] | null;
	isDark: boolean;
	themeStyle: ThemeStyle;
}) {
	return (
		<>
			{metrics.map((m) => (
				<Metric
					key={m.column}
					label={m.label}
					val={calc(entries, m.column)}
					type={m.type}
					isDark={isDark}
					t={themeStyle}
				/>
			))}
		</>
	);
}

export function PillarMetricsSection({
	activeTab,
	program,
	entries,
	isDark,
	themeStyle,
}: PillarMetricsSectionProps) {
	const skillsMetrics =
		program === 'AiCE'
			? AICE_SKILLS_METRICS
			: program === 'Virtual Assistant'
				? VA_SKILLS_METRICS
				: null;

	return (
		<section
			className="p-8 rounded-3xl shadow-xl border mb-10"
			style={{
				backgroundColor: themeStyle.cardBg,
				borderColor: themeStyle.cardBorder,
			}}
		>
			<h3
				className="text-xl font-black mb-8 border-b pb-4 uppercase tracking-tight flex items-end gap-2"
				style={{
					color: themeStyle.textMain,
					borderColor: themeStyle.cardBorder,
				}}
			>
				PILLAR METRICS{' '}
				<span className="text-[10px] normal-case tracking-normal mb-1 opacity-70">
					(average scale)
				</span>
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
				{activeTab === 'onboarding' && (
					<>
						<MetricList
							metrics={ONBOARDING_METRICS}
							entries={entries}
							isDark={isDark}
							themeStyle={themeStyle}
						/>
						{skillsMetrics && (
							<>
								<div
									className="col-span-1 md:col-span-2 mt-4 pt-4 border-t"
									style={{ borderColor: themeStyle.cardBorder }}
								>
									<h4
										className="text-xs font-black uppercase tracking-[0.1em] mb-4"
										style={{ color: themeStyle.textMuted }}
									>
										{program.toUpperCase()} SKILLS ASSESSMENT BASELINE
									</h4>
								</div>
								<MetricList
									metrics={skillsMetrics}
									entries={entries}
									isDark={isDark}
									themeStyle={themeStyle}
								/>
							</>
						)}
					</>
				)}
				{activeTab === 'eop' && (
					<MetricList
						metrics={EOP_METRICS}
						entries={entries}
						isDark={isDark}
						themeStyle={themeStyle}
					/>
				)}
				{(activeTab === 'community' || activeTab === 'support') && (
					<Metric
						label="SESSION QUALITY RATING"
						val={calc(entries, 'session_quality_csat')}
						type="quality"
						isDark={isDark}
						t={themeStyle}
					/>
				)}
			</div>

			{activeTab === 'onboarding' && (
				<div
					className="mt-12 pt-8 border-t"
					style={{ borderColor: themeStyle.cardBorder }}
				>
					<h3
						className="text-xs font-black uppercase tracking-[0.1em] mb-6"
						style={{ color: themeStyle.textMuted }}
					>
						COHORT DEMOGRAPHICS
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
						<DemographicChart
							data={entries}
							column="primary_goal"
							title="PRIMARY LEARNING GOAL"
							colorsArr={[
								colors.iris,
								colors.springGreen,
								colors.electricBlue,
								colors.gold,
							]}
							isDark={isDark}
							t={themeStyle}
						/>
					</div>
				</div>
			)}

			{activeTab === 'eop' && (
				<div
					className="mt-12 pt-8 border-t"
					style={{ borderColor: themeStyle.cardBorder }}
				>
					<h3
						className="text-xs font-black uppercase tracking-[0.1em] mb-6"
						style={{ color: themeStyle.textMuted }}
					>
						DEMOGRAPHICS COMPARISON
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
						<DemographicChart
							data={entries}
							column="employment_status"
							title="EMPLOYMENT STATUS"
							colorsArr={[
								colors.berkeleyBlue,
								colors.blueNCS,
								colors.electricBlue,
								colors.turquoise,
							]}
							isDark={isDark}
							t={themeStyle}
						/>
						<DemographicChart
							data={entries}
							column="city_residence"
							title="CITY OF RESIDENCE"
							colorsArr={[
								colors.iris,
								colors.springGreen,
								colors.gold,
								colors.tomato,
							]}
							isDark={isDark}
							t={themeStyle}
						/>
					</div>
				</div>
			)}
		</section>
	);
}
