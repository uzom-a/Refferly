"use client";

import type { WorkerSummary } from "@/lib/types";

interface CategoryStatsChartProps {
  workers: WorkerSummary[];
  currentWorkerId: string;
}

export function CategoryStatsChart({
  workers,
  currentWorkerId,
}: CategoryStatsChartProps) {
  if (!workers.length) return null;

  const sorted = [...workers].sort((a, b) => b.trust.total - a.trust.total);
  const maxScore = sorted[0]?.trust.total || 100;

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-medium text-neutral-700">
          Trust score in this trade
        </div>
        <div className="text-[11px] text-neutral-500">Higher is better</div>
      </div>
      <div className="space-y-2">
        {sorted.map((worker) => {
          const width = (worker.trust.total / maxScore) * 100;
          const isCurrent = worker.id === currentWorkerId;
          return (
            <div
              key={worker.id}
              className="flex items-center gap-2"
              aria-label={`${worker.name} trust ${worker.trust.total}`}
            >
              <div className="w-32 truncate text-[11px] text-neutral-700">
                {isCurrent ? "You" : worker.name.split(" ")[0]}
              </div>
              <div className="flex-1 rounded-full bg-neutral-100">
                <div
                  className={`h-2 rounded-full ${
                    isCurrent ? "bg-teal-600" : "bg-slate-400"
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <div className="w-8 text-right text-[11px] text-neutral-700">
                {worker.trust.total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


