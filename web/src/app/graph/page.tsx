"use client";

/* Referral graph viewer shell – UI per wireframe, with placeholder canvas */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGraphStore } from "@/store/graph-store";
import { NetworkGraph } from "@/components/network-graph";
import { useUserStore } from "@/store/user-store";
import { useEffect, useState } from "react";

interface NetworkNode {
  id: string;
  label: string;
  type: "user" | "worker" | "client";
  userId?: string;
  workerId?: string;
  clientId?: string;
  trustScore?: number;
  trade?: string;
  location?: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  type: "connection" | "job" | "referral";
  label?: string;
  jobId?: string;
  reviewId?: string;
}

interface NetworkStats {
  totalConnections: number;
  totalWorkers: number;
  totalJobs: number;
  totalReferrals: number;
  averageTrustScore: number;
}

export default function GraphPage() {
  const { filters, setFilters } = useGraphStore();
  const { user } = useUserStore();
  const router = useRouter();
  const [, setZoomLevel] = useState(1);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setError("Please sign in to view your network graph.");
      setLoading(false);
      return;
    }

    const userId = user.id; // Store in local variable to avoid null check issues
    let active = true;
    async function fetchNetworkGraph() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/network-graph?userId=${userId}`);
        const payload = (await response.json()) as {
          nodes?: NetworkNode[];
          edges?: NetworkEdge[];
          stats?: NetworkStats;
          message?: string;
        };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load network graph.");
        }
        if (!active) return;
        setNodes(payload.nodes ?? []);
        setEdges(payload.edges ?? []);
        setStats(payload.stats ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load network graph.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchNetworkGraph();

    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-sm font-semibold text-neutral-900">
            Your network trust graph
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              placeholder="Search person or worker"
              className="w-52 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-neutral-900"
            />
            <Link href="/dashboard/client">
              <Button size="sm" variant="outline">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.3fr),minmax(0,1fr)]">
          {/* Graph canvas */}
          <Card className="relative min-h-[420px] bg-neutral-900/95 p-3 text-xs text-neutral-100">
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-neutral-500 bg-neutral-900/80 backdrop-blur-sm text-[11px] text-neutral-100 hover:bg-neutral-800"
                onClick={() => {
                  // Zoom in functionality handled by vis-network
                  setZoomLevel((prev) => Math.min(prev + 0.2, 2));
                }}
              >
                + Zoom in
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-neutral-500 bg-neutral-900/80 backdrop-blur-sm text-[11px] text-neutral-100 hover:bg-neutral-800"
                onClick={() => {
                  // Zoom out functionality handled by vis-network
                  setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
                }}
              >
                − Zoom out
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="mt-1 h-7 border-neutral-500 bg-neutral-900/80 backdrop-blur-sm text-[11px] text-neutral-100 hover:bg-neutral-800"
                onClick={() => {
                  // Fit to view - handled by vis-network physics
                  setZoomLevel(1);
                }}
              >
                Fit to view
              </Button>
            </div>
            <div className="absolute bottom-3 left-3 rounded-lg bg-neutral-900/80 px-3 py-2 text-[11px] text-neutral-200">
              <div className="mb-1 font-medium">Legend</div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-300" /> You
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-300" /> Workers
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" /> Clients
                </div>
              </div>
            </div>

            {/* Real network graph component */}
            {error ? (
              <div className="flex h-full items-center justify-center text-sm text-red-400">
                {error}
              </div>
            ) : loading ? (
              <div className="flex h-full items-center justify-center text-sm text-neutral-100">
                Loading network graph...
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-neutral-100">
                No connections yet. Start by connecting with people and hiring workers!
              </div>
            ) : (
              <NetworkGraph
                nodes={nodes.filter((node) => {
                  // Filter by trust score for workers
                  if (node.type === "worker" && node.trustScore !== undefined) {
                    return node.trustScore >= filters.minTrust;
                  }
                  return true;
                })}
                edges={edges}
                onNodeClick={(nodeId, type) => {
                  if (type === "worker") {
                    router.push(`/workers/${nodeId}`);
                  } else if (type === "client") {
                    // Could navigate to client profile if we had one
                    console.log("Client clicked:", nodeId);
                  }
                }}
              />
            )}
          </Card>

          {/* Right filters & details */}
          <Card className="flex min-h-[420px] flex-col text-xs">
            <div className="flex gap-4 border-b border-neutral-200 pb-2 text-[11px] font-medium text-neutral-700">
              <button className="border-b-2 border-neutral-900 pb-1">
                Filters
              </button>
              <button className="pb-1 text-neutral-500">Details</button>
            </div>

            {/* Network Statistics */}
            {stats && (
              <div className="mt-3 space-y-3 rounded-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                  Network Stats
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-slate-600">Connections</div>
                    <div className="text-base font-bold text-teal-600">{stats.totalConnections}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Workers</div>
                    <div className="text-base font-bold text-blue-600">{stats.totalWorkers}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Jobs</div>
                    <div className="text-base font-bold text-emerald-600">{stats.totalJobs}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Referrals</div>
                    <div className="text-base font-bold text-violet-600">{stats.totalReferrals}</div>
                  </div>
                </div>
                {stats.averageTrustScore > 0 && (
                  <div className="pt-2 border-t border-teal-200">
                    <div className="text-slate-600 text-[10px]">Avg Trust Score</div>
                    <div className="text-lg font-bold text-teal-600">{Math.round(stats.averageTrustScore)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 space-y-4">
              {/* Distance slider (simple buttons) */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-neutral-800">
                  Distance from you
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "You", value: "YOU" as const },
                    { label: "One step", value: "ONE" as const },
                    { label: "Two steps", value: "TWO" as const },
                    { label: "All", value: "ALL" as const },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setFilters({ ...filters, distance: value })}
                      className={`rounded-full border-2 px-3 py-1 text-[11px] font-semibold transition-all ${
                        filters.distance === value
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-teal-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust score range (simplified) */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-neutral-800">
                  Trust score
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.minTrust}
                  onChange={(e) => setFilters({ ...filters, minTrust: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-xs font-semibold text-teal-600">
                  {filters.minTrust}
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              {/* Trade type */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-neutral-800">
                  Trade type
                </div>
                <select className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[11px] text-neutral-700 focus:border-neutral-900">
                  <option>All trades</option>
                  <option>Electrician</option>
                  <option>Plumber</option>
                  <option>Cleaner</option>
                </select>
              </div>

              {/* Time range */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-neutral-800">
                  Time period
                </div>
                <div className="flex gap-2">
                  {["Last month", "Last six months", "All time"].map((label) => (
                    <button
                      key={label}
                      className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] text-neutral-700 hover:border-neutral-900"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Button size="sm" className="mt-2 w-full">
                Apply filters
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


