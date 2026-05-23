import { colors } from '../../utils/style';
import { TriggerSummaryButton } from '../TriggerSummaryButton';
import { dashboardUrl } from './dashboardUrl';
import type { SummaryPayload, ThemeStyle } from './types';

type AISummary = {
	id: string;
	theme_title: string;
	response_count: number;
	summary_text: string;
};

type AISummarySectionProps = {
	aiSummaries: AISummary[] | null;
	jobStatus: string | null;
	jobError: string | null;
	summaryPayload: SummaryPayload;
	program: string;
	activeTab: string;
	year: string;
	quarter: string;
	month: string;
	theme: string;
	activeEvent: string;
	isDark: boolean;
	themeStyle: ThemeStyle;
};

export function AISummarySection({
	aiSummaries,
	jobStatus,
	jobError,
	summaryPayload,
	program,
	activeTab,
	year,
	quarter,
	month,
	theme,
	activeEvent,
	isDark,
	themeStyle,
}: AISummarySectionProps) {
	const refreshUrl = dashboardUrl({
		program,
		tab: activeTab,
		year,
		quarter,
		month,
		theme,
		event: activeEvent,
	});

	const summarizeLabel = `✨ SUMMARIZE FEEDBACK FOR ${
		activeTab === 'community' || activeTab === 'support'
			? activeEvent.toUpperCase()
			: month === 'All'
				? `FULL ${quarter}`
				: month.toUpperCase()
	}`;

	return (
		<section
			className="p-10 rounded-3xl shadow-xl border-t-8 hover:scale-[1.01] transition-transform duration-300 w-full mb-10"
			style={{
				backgroundColor: themeStyle.cardBg,
				borderColor: colors.iris,
			}}
		>
			<div
				className="flex justify-between items-center mb-8 border-b pb-4"
				style={{ borderColor: themeStyle.cardBorder }}
			>
				<h3
					className="text-lg font-black uppercase tracking-widest flex items-end gap-2"
					style={{ color: themeStyle.textMain }}
				>
					LEARNER FEEDBACK SUMMARY{' '}
					<span className="text-[10px] normal-case tracking-normal mb-1 opacity-70">
						(AI generated)
					</span>
				</h3>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{aiSummaries && aiSummaries.length > 0 ? (
					aiSummaries.map((summary) => (
						<div
							key={summary.id}
							className="border-l-4 pl-6 py-2 rounded-r-xl"
							style={{
								backgroundColor: isDark
									? 'rgba(255,255,255,0.02)'
									: '#F8FAFC',
								borderColor: colors.electricBlue,
							}}
						>
							<div className="flex justify-between items-start mb-3 gap-2">
								<h4
									className="text-base font-black uppercase tracking-tight leading-tight"
									style={{ color: themeStyle.textMain }}
								>
									{summary.theme_title}
								</h4>
								<span
									className="text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
									style={{
										backgroundColor: isDark
											? 'rgba(255,255,255,0.1)'
											: '#E2E8F0',
										color: themeStyle.textMain,
									}}
								>
									{summary.response_count} Mentions
								</span>
							</div>
							<p
								className="text-sm leading-relaxed italic"
								style={{ color: isDark ? '#CBD5E1' : '#475569' }}
							>
								&ldquo;{summary.summary_text}&rdquo;
							</p>
						</div>
					))
				) : (
					<div
						className="text-center p-8 rounded-2xl border md:col-span-2 flex flex-col items-center justify-center gap-6"
						style={{
							backgroundColor: isDark
								? 'rgba(255,255,255,0.02)'
								: '#F8FAFC',
							borderColor: themeStyle.cardBorder,
						}}
					>
						{jobStatus === 'busy' && (
							<>
								<div className="flex flex-col items-center gap-3">
									<div
										style={{
											width: '48px',
											height: '48px',
											borderRadius: '50%',
											border: `4px solid ${
												isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'
											}`,
											borderTopColor: colors.iris,
											animation: 'spin 1s linear infinite',
										}}
									/>
									<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
								</div>
								<div>
									<p
										className="text-sm font-black uppercase tracking-widest mb-1"
										style={{ color: themeStyle.textMain }}
									>
										AI is reading learner responses…
									</p>
									<p
										className="text-xs"
										style={{ color: themeStyle.textMuted }}
									>
										This usually takes 30–60 seconds. Refresh the page in a
										moment to see the summary.
									</p>
								</div>
								<a
									href={refreshUrl}
									className="px-5 py-2.5 rounded-xl text-xs font-black tracking-widest border transition-all hover:scale-105"
									style={{
										color: themeStyle.textMain,
										borderColor: themeStyle.cardBorder,
										backgroundColor: isDark
											? 'rgba(255,255,255,0.05)'
											: colors.white,
									}}
								>
									🔄 REFRESH PAGE
								</a>
							</>
						)}

						{jobStatus === 'failed' && (
							<>
								<div className="flex flex-col items-center gap-2">
									<span className="text-3xl">⚠️</span>
									<p
										className="text-sm font-black uppercase tracking-widest"
										style={{ color: colors.tomato }}
									>
										Summary generation failed
									</p>
									<p
										className="text-xs text-center max-w-sm"
										style={{ color: themeStyle.textMuted }}
									>
										{jobError ||
											'An unknown error occurred. This is usually caused by insufficient feedback data for the selected period.'}
									</p>
								</div>
								<TriggerSummaryButton
									payload={summaryPayload}
									label="RETRY SUMMARY"
									colors={colors}
								/>
							</>
						)}

						{!jobStatus && (
							<>
								<p
									className="text-sm font-bold italic"
									style={{ color: themeStyle.textMuted }}
								>
									No AI summaries generated for this context yet.
								</p>
								<TriggerSummaryButton
									payload={summaryPayload}
									label={summarizeLabel}
									colors={colors}
								/>
							</>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
