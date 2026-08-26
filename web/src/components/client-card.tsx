"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import type { ClientProfileStats } from "@/lib/types";

interface ClientCardProps {
  name: string;
  city: string;
  area?: string | null;
  state?: string | null;
  country?: string | null;
  badgeLabel?: string;
  stats: ClientProfileStats;
  footer?: ReactNode;
}

const statMeta: Array<{ key: keyof ClientProfileStats; label: string; gradient: string }> = [
  { key: "peopleEmployed", label: "People Employed", gradient: "from-teal-600 to-emerald-600" },
  { key: "jobsPosted", label: "Jobs Posted", gradient: "from-blue-600 to-cyan-600" },
  { key: "employeeReviews", label: "Employee Reviews", gradient: "from-violet-600 to-purple-600" },
  { key: "peopleConnected", label: "People Connected", gradient: "from-amber-600 to-orange-600" },
  { key: "workersVouching", label: "Workers Vouching", gradient: "from-indigo-600 to-blue-600" },
  { key: "reviewsWritten", label: "Reviews Written", gradient: "from-pink-600 to-rose-600" },
];

export function ClientCard({
  name,
  city,
  area,
  state,
  country,
  badgeLabel = "Client",
  stats,
  footer,
}: ClientCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const locationParts = [city, state, country].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  return (
    <Card className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 text-sm shadow-md transition-all hover:border-teal-400 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white shadow-lg">
          {initials}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-medium text-teal-700">
              {badgeLabel}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-600">
              {locationParts.length > 0
                ? locationParts.join(", ")
                : [area, city].filter((part) => part && part.length > 0).join(", ")}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-[11px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {statMeta.map((item) => (
            <div key={item.key} className="space-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </div>
              <div
                className={`text-2xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}
              >
                {stats[item.key]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {footer && <div className="mt-6 border-t border-slate-200 pt-4">{footer}</div>}
    </Card>
  );
}


