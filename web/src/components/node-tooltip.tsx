interface NodeTooltipProps {
  name: string;
  role: string;
  distanceLabel: string;
  topSentiment: string;
  verifiedJobs: number;
  pathPreview: string;
}

export function NodeTooltip({
  name,
  role,
  distanceLabel,
  topSentiment,
  verifiedJobs,
  pathPreview,
}: NodeTooltipProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-neutral-900">{name}</div>
      <div className="text-[11px] text-neutral-600">{role}</div>
      <div className="mt-1 text-[11px] text-neutral-600">{distanceLabel}</div>
      <div className="mt-1 text-[11px] text-neutral-600">
        Top sentiment: <span className="italic">“{topSentiment}”</span>
      </div>
      <div className="mt-1 text-[11px] text-neutral-600">
        Verified jobs: {verifiedJobs}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">{pathPreview}</div>
    </div>
  );
}


