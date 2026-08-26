"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WorkerCard } from "@/components/worker-card";
import { LocationSearchInput, type LocationOption } from "@/components/location-search-input";
import { useUserStore } from "@/store/user-store";
import type { AuthUser, WorkerSummary } from "@/lib/types";

export default function SearchPage() {
  const { user, setUser } = useUserStore();
  const [userHydrated, setUserHydrated] = useState(false);
  const [tradeQuery, setTradeQuery] = useState("");
  const [locationOption, setLocationOption] = useState<LocationOption | null>(null);
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState<{ trade: string; location: string } | null>(null);
  const [searchBoost, setSearchBoost] = useState<number | null>(null);
  const [sortFilter, setSortFilter] = useState<"trust" | "distance" | "network">("trust");
  const [distanceFilter, setDistanceFilter] = useState("any");

  const normalizedTrade = tradeQuery.trim();
  const locationLabel = locationOption?.label?.trim() ?? "";
  const requesterId = user?.id ?? "";

  useEffect(() => {
    if (userHydrated) return;

    try {
      const stored = window.localStorage.getItem("trustnet:user");
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      window.localStorage.removeItem("trustnet:user");
    } finally {
      setUserHydrated(true);
    }
  }, [setUser, userHydrated]);

  useEffect(() => {
    if (!normalizedTrade || !locationLabel) {
      setWorkers([]);
      setHasSearched(false);
      setLastQuery(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const delay = searchBoost ? 0 : 350;

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          trade: normalizedTrade,
          location: locationLabel,
        });
        if (locationOption?.city) params.set("city", locationOption.city);
        if (locationOption?.state) params.set("state", locationOption.state);
        if (locationOption?.country) params.set("country", locationOption.country);
        if (typeof locationOption?.latitude === "number") {
          params.set("latitude", String(locationOption.latitude));
        }
        if (typeof locationOption?.longitude === "number") {
          params.set("longitude", String(locationOption.longitude));
        }
        if (requesterId) {
          params.set("userId", requesterId);
        }
        const response = await fetch(`/api/search-workers?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          results?: WorkerSummary[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to search for workers right now.");
        }

        if (!controller.signal.aborted) {
          setWorkers(payload.results ?? []);
          setHasSearched(true);
          setLastQuery({ trade: normalizedTrade, location: locationLabel });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to search for workers right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSearchBoost(null);
        }
      }
    }, delay);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [normalizedTrade, locationLabel, locationOption?.city, locationOption?.state, locationOption?.country, locationOption?.latitude, locationOption?.longitude, requesterId, searchBoost]);

  const filteredWorkers = useMemo(() => {
    if (sortFilter !== "network") {
      return workers;
    }
    return workers.filter(
      (worker) => worker.isDirectConnection || (worker.mutualConnections?.length ?? 0) > 0,
    );
  }, [sortFilter, workers]);

  const renderWorkerFooter = (worker: WorkerSummary) => {
    const hireButton = (
      <Link href={`/workers/${worker.id}`} className="flex-shrink-0">
        <Button
          size="sm"
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
        >
          Hire
        </Button>
      </Link>
    );

    if (worker.isDirectConnection) {
      return (
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-teal-700">Direct connection</div>
          {hireButton}
        </div>
      );
    }

    if (worker.mutualConnections?.length) {
      const [first, ...rest] = worker.mutualConnections;
      return (
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Connected with{" "}
            <span className="font-semibold text-slate-900">{first.name}</span>
            {rest.length > 0 && ` + ${rest.length} more in your network`}
          </div>
          {hireButton}
        </div>
      );
    }

    return <div className="flex w-full justify-end">{hireButton}</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Top bar search */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Search workers
            </h1>
            <Link href="/dashboard/client">
              <Button variant="outline" size="sm">
                ← Back to dashboard
              </Button>
            </Link>
          </div>

          <Card className="border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-lg">
            <form
              className="grid gap-3 md:grid-cols-[2fr,1.5fr,auto]"
              onSubmit={(event) => {
                event.preventDefault();
                if (!normalizedTrade || !locationOption) {
                  setError("Enter a worker trade and select a location to search.");
                  return;
                }
                setSearchBoost(Date.now());
              }}
            >
              <input
                placeholder="Worker or trade"
                value={tradeQuery}
                onChange={(event) => setTradeQuery(event.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              />
              <div className="max-md:space-y-2 md:self-stretch">
                <LocationSearchInput
                  label="Location"
                  selected={locationOption}
                  onSelect={setLocationOption}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 md:w-auto"
                disabled={!normalizedTrade || !locationOption || loading}
              >
                {loading ? "Searching..." : "Search now"}
              </Button>
            </form>
          </Card>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              className="rounded-full border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-2 font-semibold text-violet-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
              value={sortFilter}
              onChange={(event) => setSortFilter(event.target.value as typeof sortFilter)}
            >
              <option value="trust">Sort by: Trust score</option>
              <option value="distance">Sort by: Distance</option>
              <option value="network">Sort by: My network only</option>
            </select>
            <select
              className="rounded-full border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 font-semibold text-amber-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
              value={distanceFilter}
              onChange={(event) => setDistanceFilter(event.target.value)}
            >
              <option value="any">Distance</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="20">Within 20 km</option>
              <option value="100">Within 100 km</option>
              <option value="100_plus">&gt; 100 km</option>
            </select>
          </div>
        </section>

        <div className="grid gap-6">
          {/* Worker list */}
          <section className="space-y-4">
            <div className="text-sm font-semibold text-slate-700">
              {loading && "Searching trusted workers..."}
              {!loading && !hasSearched && "Enter a worker trade and location to begin."}
              {!loading && hasSearched && (
                <>
                  Showing{" "}
                  <span className="font-bold text-teal-600">{filteredWorkers.length}</span>{" "}
                  workers for{" "}
                  <span className="font-semibold text-slate-900">{lastQuery?.trade}</span> in{" "}
                  <span className="font-semibold text-slate-900">{lastQuery?.location}</span>
                </>
              )}
            </div>

            {error && (
              <Card className="border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </Card>
            )}

            {!loading && hasSearched && filteredWorkers.length === 0 && !error && (
              <Card className="border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
                {sortFilter === "network"
                  ? "No one in your network matches this search yet."
                  : `No workers with that trade were found in ${lastQuery?.location}. Try another nearby area or skill.`}
              </Card>
            )}

            {filteredWorkers.length > 0 && (
              <div className="space-y-3">
                {filteredWorkers.map((worker) => (
                  <div key={worker.id} className="space-y-1">
                    <WorkerCard worker={worker} footerContent={renderWorkerFooter(worker)} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


