"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WorkerCard } from "@/components/worker-card";
import { ConnectionRequestsPanel } from "@/components/connection-requests-panel";
import { JobOffersPanel } from "@/components/job-offers-panel";
import { useUserStore } from "@/store/user-store";
import type {
  AuthUser,
  NetworkSearchResult,
  NetworkStats,
  WorkerSummary,
} from "@/lib/types";

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [hydrated, setHydrated] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [connectionQuery, setConnectionQuery] = useState("");
  const [connectionResults, setConnectionResults] = useState<NetworkSearchResult[]>([]);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSendError, setConnectionSendError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [showConnectionsPanel, setShowConnectionsPanel] = useState(false);
  const [showJobOffersPanel, setShowJobOffersPanel] = useState(false);
  const [recommendedWorkers, setRecommendedWorkers] = useState<WorkerSummary[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    peopleConnected: 0,
    workersVouching: 0,
    reviewsWritten: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [hiringWorkerId, setHiringWorkerId] = useState<string | null>(null);
  const [hireMessage, setHireMessage] = useState<string | null>(null);
  const [hireError, setHireError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) return;

    try {
      const stored = window.localStorage.getItem("trustnet:user");
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      window.localStorage.removeItem("trustnet:user");
    } finally {
      setHydrated(true);
    }
  }, [hydrated, setUser]);

  useEffect(() => {
    setConnectionSuccess(null);
    setConnectionSendError(null);
  }, [connectionQuery]);

  useEffect(() => {
    if (!hydrated || !user?.id) {
      setLoadingProfile(false);
      return;
    }

    let active = true;
    const userId = user.id; // Capture user.id to avoid null check issues

    async function refreshProfile() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Unable to fetch profile");
        }
        const data = (await response.json()) as { user: AuthUser };
        if (!active) return;
        setUser(data.user);
        window.localStorage.setItem("trustnet:user", JSON.stringify(data.user));
      } catch (err) {
        if (!active) return;
        console.warn("Unable to refresh profile", err);
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    refreshProfile();

    return () => {
      active = false;
    };
  }, [hydrated, setUser, user?.id]);

  useEffect(() => {
    if (hydrated && !loadingProfile && !user?.id) {
      router.push("/auth/sign-in");
    }
  }, [hydrated, loadingProfile, router, user?.id]);

  useEffect(() => {
    const query = connectionQuery.trim();
    if (query.length === 0) {
      setConnectionResults([]);
      setConnectionError(null);
      setConnectionLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setConnectionLoading(true);
    setConnectionError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/network-search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as { results?: NetworkSearchResult[]; message?: string };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to search right now.");
        }
        if (!active) return;
        setConnectionResults(payload.results ?? []);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setConnectionError(
          error instanceof Error ? error.message : "Unable to search the network right now.",
        );
      } finally {
        if (active) {
          setConnectionLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [connectionQuery]);

  useEffect(() => {
    let active = true;
    setWorkersLoading(true);
    setWorkersError(null);

    async function fetchWorkers() {
      try {
        const response = await fetch("/api/workers/summaries?limit=6");
        const payload = (await response.json()) as { workers?: WorkerSummary[]; message?: string };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load workers.");
        }
        if (!active) return;
        setRecommendedWorkers(payload.workers ?? []);
      } catch (err) {
        if (!active) return;
        setWorkersError(err instanceof Error ? err.message : "Unable to load workers.");
      } finally {
        if (active) {
          setWorkersLoading(false);
        }
      }
    }

    fetchWorkers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !user?.id) {
      setStatsLoading(false);
      return;
    }

    let active = true;
    setStatsLoading(true);
    setStatsError(null);

    async function fetchStats() {
      if (!user?.id) return;
      try {
        const response = await fetch(`/api/network-stats?userId=${user.id}`);
        const payload = (await response.json()) as { stats?: NetworkStats; message?: string };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load network snapshot.");
        }
        if (!active) return;
        setNetworkStats(
          payload.stats ?? {
            peopleConnected: 0,
            workersVouching: 0,
            reviewsWritten: 0,
          },
        );
      } catch (err) {
        if (!active) return;
        setStatsError(
          err instanceof Error ? err.message : "Unable to load network snapshot.",
        );
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      active = false;
    };
  }, [hydrated, user?.id]);

  if (!hydrated || loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Card className="w-full max-w-sm text-center text-sm text-slate-600">
          Loading your dashboard...
        </Card>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-sm space-y-3 text-center">
          <p className="text-sm font-semibold text-slate-900">
            We need you to sign in again.
          </p>
          <p className="text-xs text-slate-600">
            Your session expired. Please sign in to load your dashboard.
          </p>
          <Link href="/auth/sign-in">
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }


  const firstName = user.name.split(" ")[0] ?? user.name;

  async function handleSendConnectionRequest(result: NetworkSearchResult) {
    if (!user?.id) {
      setConnectionSendError("You need to be signed in to send connection requests.");
      return;
    }

    if (result.userId === user.id) {
      setConnectionSendError("You cannot send a request to yourself.");
      return;
    }

    setSendingRequestId(result.userId);
    setConnectionSendError(null);
    setConnectionSuccess(null);
    try {
      const response = await fetch("/api/connections/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: result.userId,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to send connection request.");
      }
      setConnectionSuccess(`Connection request sent to ${result.summary.name}.`);
    } catch (error) {
      setConnectionSendError(
        error instanceof Error
          ? error.message
          : "Unable to send connection request right now.",
      );
    } finally {
      setSendingRequestId(null);
    }
  }

  async function handleHireWorker(worker: WorkerSummary) {
    if (!user?.id) {
      setHireError("You need to sign in to hire a worker.");
      return;
    }

    setHiringWorkerId(worker.id);
    setHireError(null);
    setHireMessage(null);

    try {
      const response = await fetch("/api/hire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientUserId: user.id,
          workerId: worker.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to hire this worker right now.");
      }

      setHireMessage(`You hired ${worker.name}. Stats updated.`);

      setWorkersLoading(true);
      try {
        const workersResponse = await fetch("/api/workers/summaries?limit=6");
        const workersPayload = (await workersResponse.json()) as {
          workers?: WorkerSummary[];
          message?: string;
        };
        if (!workersResponse.ok) {
          throw new Error(workersPayload?.message ?? "Unable to refresh workers.");
        }
        setRecommendedWorkers(workersPayload.workers ?? []);
      } catch (err) {
        setWorkersError(err instanceof Error ? err.message : "Unable to refresh workers.");
      } finally {
        setWorkersLoading(false);
      }

      if (hydrated && user?.id) {
        setStatsLoading(true);
        try {
          const statsResponse = await fetch(`/api/network-stats?userId=${user.id}`);
          const statsPayload = (await statsResponse.json()) as {
            stats?: NetworkStats;
            message?: string;
          };
          if (!statsResponse.ok) {
            throw new Error(statsPayload?.message ?? "Unable to refresh stats.");
          }
          setNetworkStats(
            statsPayload.stats ?? {
              peopleConnected: 0,
              workersVouching: 0,
              reviewsWritten: 0,
            },
          );
        } catch (err) {
          setStatsError(err instanceof Error ? err.message : "Unable to refresh stats.");
        } finally {
          setStatsLoading(false);
        }
      }
    } catch (err) {
      setHireError(
        err instanceof Error ? err.message : "Unable to hire this worker right now.",
      );
    } finally {
      setHiringWorkerId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Welcome back, {firstName}
          </h1>
          <p className="text-sm text-slate-600">
            See who your network trusts before you hire.
          </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConnectionsPanel((prev) => !prev)}
              >
                {showConnectionsPanel ? "Hide Requests" : "Connection Requests"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowJobOffersPanel((prev) => !prev)}
              >
                {showJobOffersPanel ? "Hide Jobs" : "My Jobs"}
              </Button>
              <Link href="/profile">
                <Button size="sm" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                  View Profile
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  useUserStore.getState().clearUser();
                  window.localStorage.removeItem("trustnet:user");
                  router.push("/auth/sign-in");
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Your network snapshot */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-lg border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-base font-bold text-slate-900">
                Your network snapshot
              </div>
              {statsLoading && (
                <span className="text-xs font-medium text-slate-500">Loading...</span>
              )}
            </div>
            {statsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {statsError}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    {networkStats.peopleConnected}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-1">People connected</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {networkStats.workersVouching}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-1">Workers vouching</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {networkStats.reviewsWritten}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-1">Reviews written</div>
                </div>
              </div>
            )}
            <Link
              href="/onboarding/client"
              className="text-sm font-medium text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline"
            >
              Invite someone you trust
            </Link>
          </div>
        </Card>

        {/* Main search */}
        <Card className="bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg border-2 border-slate-200">
          <Link href="/search" className="block">
            <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
              Find trusted workers
            </Button>
          </Link>
        </Card>

        {showConnectionsPanel && <ConnectionRequestsPanel userId={user.id} />}
        {showJobOffersPanel && user && <JobOffersPanel userId={user.id} role="CLIENT" />}

        {/* Connect with more people */}
        <Card className="bg-white/90 p-6 shadow-lg border-2 border-slate-200">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-slate-900">Connect with more people</h2>
              <p className="text-sm text-slate-600">
                Search by name to grow your network. We’ll show every account that matches.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={connectionQuery}
                onChange={(event) => setConnectionQuery(event.target.value)}
                placeholder="Search for clients or workers by name"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              />
              {connectionSendError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {connectionSendError}
                </div>
              )}
              {connectionSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  {connectionSuccess}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Suggested matches</span>
                {connectionLoading && <span className="text-[10px] font-medium text-teal-600">Searching...</span>}
              </div>
              {connectionQuery.trim().length === 0 ? (
                <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Start typing a name to search across TrustNet.
                </Card>
              ) : connectionError ? (
                <Card className="border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                  {connectionError}
                </Card>
              ) : connectionLoading ? (
                <Card className="border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Searching the network...
                </Card>
              ) : connectionResults.length === 0 ? (
                <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  No accounts found with that name yet. Try another person.
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {connectionResults.map((result) => {
                    const isSelf = result.userId === user.id;
                    const isSending = sendingRequestId === result.userId;
                    const actionLabel = isSelf
                      ? "That's you"
                      : isSending
                        ? "Sending..."
                        : "Send connection request";

                    return (
                      <WorkerCard
                        key={`${result.userId}-${result.summary.id}`}
                        worker={result.summary}
                        actionLabel={actionLabel}
                        actionDisabled={isSelf || isSending}
                        onAction={() => handleSendConnectionRequest(result)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          {/* Recommended in your network */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Workers close to your network
              </h2>
              <p className="text-sm text-slate-600">
                Sorted by how close they are to people you trust, not just
                ratings.
              </p>
            </div>
            {workersError && (
              <Card className="border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                {workersError}
              </Card>
            )}
            {hireError && (
              <Card className="border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {hireError}
              </Card>
            )}
            {hireMessage && (
              <Card className="border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                {hireMessage}
              </Card>
            )}
            {workersLoading ? (
              <Card className="border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                Loading workers...
              </Card>
            ) : recommendedWorkers.length === 0 ? (
              <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                No workers to show yet. Try inviting your network.
              </Card>
            ) : (
            <div className="grid gap-3 md:grid-cols-2">
                {recommendedWorkers.map((w) => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    actionLabel={hiringWorkerId === w.id ? "Hiring..." : "Hire"}
                    actionDisabled={hiringWorkerId === w.id}
                    onAction={() => handleHireWorker(w)}
                  />
              ))}
            </div>
            )}
          </section>

          {/* Right side column */}
          <div className="space-y-4">
            {/* Referral path prompt */}
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-lg border-2 border-violet-200">
              <div className="space-y-3">
                <div className="text-base font-bold text-slate-900">
                  See how trust flows to a worker
                </div>
                <p className="text-sm text-slate-600">
                  Pick a worker and we show you the exact path through your
                  network.
                </p>
                <Link href="/graph">
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    Open referral graph
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


