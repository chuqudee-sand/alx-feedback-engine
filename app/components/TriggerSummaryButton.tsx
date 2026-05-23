import type { SummaryPayload } from './dashboard/types';

type TriggerSummaryButtonProps = {
	payload: SummaryPayload;
	label: string;
	colors: { iris: string };
};

export function TriggerSummaryButton({
	payload,
	label,
	colors,
}: TriggerSummaryButtonProps) {
	return (
		<form action="/api/trigger-summary" method="POST">
			<input type="hidden" name="program" value={payload.program} />
			<input type="hidden" name="activeTab" value={payload.activeTab} />
			<input type="hidden" name="startDate" value={payload.startDate} />
			<input type="hidden" name="endDate" value={payload.endDate} />
			<input type="hidden" name="activeEvent" value={payload.activeEvent} />
			<input type="hidden" name="reportPeriod" value={payload.reportPeriod} />
			<button
				type="submit"
				className="px-6 py-3 rounded-xl text-xs font-black tracking-widest text-white transition-all hover:scale-105 shadow-md flex items-center gap-2"
				style={{ backgroundColor: colors.iris }}
			>
				{label}
			</button>
		</form>
	);
}
