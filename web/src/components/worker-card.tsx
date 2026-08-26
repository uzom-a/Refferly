import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { WorkerSummary } from "@/lib/types";

interface WorkerCardProps {
  worker: WorkerSummary;
  showPath?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  footerContent?: ReactNode;
}

export function WorkerCard({
  worker,
  showPath,
  actionLabel,
  actionDisabled,
  onAction,
  footerContent,
}: WorkerCardProps) {
  const getTradeColor = (trade: string) => {
    if (trade === "Electrician") return "bg-gradient-to-br from-amber-500 to-orange-600";
    if (trade === "Plumber") return "bg-gradient-to-br from-blue-500 to-cyan-600";
    if (trade === "Cleaner") return "bg-gradient-to-br from-emerald-500 to-teal-600";
    return "bg-gradient-to-br from-violet-500 to-purple-600";
  };

  const locationParts = [worker.city, worker.state ?? "", worker.country ?? ""].filter(
    (part) => part && part.length > 0,
  );

  return (
    <div className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 text-sm shadow-md transition-all hover:border-teal-400 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getTradeColor(worker.trade)} text-xs font-bold text-white shadow-lg`}>
          {worker.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="font-semibold text-slate-900">{worker.name}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-medium text-teal-700">
              {worker.trade}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-600">
              {locationParts.length > 0 ? locationParts.join(", ") : worker.locationLabel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Trust</div>
          <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            {worker.trust.total}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-medium">Sentiment {worker.trust.sentiment}</span>
          <span>·</span>
          <span className="font-medium">Referrals {worker.trust.referrals}</span>
          <span>·</span>
          <span className="font-medium">Verified {worker.trust.verified}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            Tags:
          </span>
          {worker.sentimentTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-2.5 py-1 text-[10px] font-medium text-violet-700"
            >
              {tag}
            </span>
          ))}
        </div>
        {showPath && worker.pathToYou && (
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] text-blue-700">
            <span className="font-semibold">Path:</span>
            <span>{worker.pathToYou}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        {footerContent ? (
          <div className="w-full">{footerContent}</div>
        ) : onAction ? (
          <>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              onClick={onAction}
              disabled={actionDisabled}
            >
              {actionLabel ?? "Hire"}
            </Button>
            <Link
              href={`/graph?focus=${encodeURIComponent(worker.id)}`}
              className="text-xs font-medium text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline"
            >
              Graph →
            </Link>
          </>
        ) : (
          <>
            <Link href={`/workers/${worker.id}`} className="flex-1">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              >
                Hire
              </Button>
            </Link>
            <Link
              href={`/graph?focus=${encodeURIComponent(worker.id)}`}
              className="text-xs font-medium text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline"
            >
              Graph →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}


