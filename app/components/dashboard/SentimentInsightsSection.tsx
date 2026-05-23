import { calcTopBox } from '../../utils/helpers';
import { colors } from '../../utils/style';
import { InsightRow } from '../InsightRow';
import {
	AICE_SKILLS_METRICS,
	EOP_METRICS,
	ONBOARDING_METRICS,
	VA_SKILLS_METRICS,
} from './metrics.config';
import type { MetricDef } from './metrics.config';
import type { ThemeStyle } from './types';

type SentimentInsightsSectionProps = {
	activeTab: string;
	program: string;
	entries: Record<string, unknown>[] | null;
	isDark: boolean;
	themeStyle: ThemeStyle;
};

function InsightList({
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
			{metrics.map(
				(m) =>
					m.insight && (
						<InsightRow
							key={m.column}
							pct={calcTopBox(entries, m.column)}
							text={m.insight}
							isDark={isDark}
							t={themeStyle}
						/>
					)
			)}
		</>
	);
}

export function SentimentInsightsSection({
	activeTab,
	program,
	entries,
	isDark,
	themeStyle,
}: SentimentInsightsSectionProps) {
	if (activeTab !== 'onboarding' && activeTab !== 'eop') {
		return null;
	}

	const skillsMetrics =
		program === 'AiCE'
			? AICE_SKILLS_METRICS
			: program === 'Virtual Assistant'
				? VA_SKILLS_METRICS
				: null;

	return (
		<section
			className="p-10 rounded-3xl shadow-2xl border-t-8 mt-4"
			style={{
				backgroundColor: themeStyle.cardBg,
				borderColor: colors.turquoise,
			}}
		>
			<h3
				className="text-2xl font-black mb-2 uppercase tracking-tight flex items-end gap-3"
				style={{ color: themeStyle.textMain }}
			>
				KEY SENTIMENT INSIGHTS{' '}
				<span className="text-sm normal-case tracking-normal opacity-70 mb-1">
					(top-box scoring)
				</span>
			</h3>
			<p
				className="text-sm italic mb-8"
				style={{ color: themeStyle.textMuted }}
			>
				Percentage of respondents scoring 4 or 5. Extracted directly from
				Pillar Metrics.
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{activeTab === 'onboarding' && (
					<>
						<InsightList
							metrics={ONBOARDING_METRICS}
							entries={entries}
							isDark={isDark}
							themeStyle={themeStyle}
						/>
						{skillsMetrics && (
							<InsightList
								metrics={skillsMetrics}
								entries={entries}
								isDark={isDark}
								themeStyle={themeStyle}
							/>
						)}
					</>
				)}
				{activeTab === 'eop' && (
					<InsightList
						metrics={EOP_METRICS}
						entries={entries}
						isDark={isDark}
						themeStyle={themeStyle}
					/>
				)}
			</div>
		</section>
	);
}
