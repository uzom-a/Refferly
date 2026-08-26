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
import type { AuthUser, NetworkSearchResult } from "@/lib/types";

interface DashboardStats {
  trustScore: number;
  referralsReceived: number;
  verifiedJobs: number;
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [hydrated, setHydrated] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showConnectionsPanel, setShowConnectionsPanel] = useState(false);
  const [showJobOffersPanel, setShowJobOffersPanel] = useState(false);
  const [connectionQuery, setConnectionQuery] = useState("");
  const [connectionResults, setConnectionResults] = useState<NetworkSearchResult[]>([]);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSendError, setConnectionSendError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    trustScore: 0,
    referralsReceived: 0,
    verifiedJobs: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

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
    const currentUserId = user.id;

    async function refreshProfile() {
      try {
        const response = await fetch(`/api/users/${currentUserId}`);
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

  // Fetch dashboard stats
  useEffect(() => {
    if (!hydrated || !user?.id || user.role !== "WORKER") {
      setLoadingStats(false);
      return;
    }

    let active = true;
    const currentWorkerId = user.id;

    async function fetchStats() {
      try {
        const response = await fetch(`/api/worker-dashboard-stats?userId=${currentWorkerId}`);
        if (!response.ok) {
          throw new Error("Unable to fetch dashboard stats");
        }
        const data = (await response.json()) as DashboardStats;
        if (!active) return;
        setStats(data);
      } catch (err) {
        if (!active) return;
        console.warn("Unable to fetch dashboard stats", err);
      } finally {
        if (active) {
          setLoadingStats(false);
        }
      }
    }

    fetchStats();

    return () => {
      active = false;
    };
  }, [hydrated, user?.id, user?.role]);

  if (!hydrated || loadingProfile || loadingStats) {
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

  const displayName = user.name.split(" ")[0] ?? user.name;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-slate-600">
                Grow your referrals and keep a clean record of your work.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConnectionsPanel((prev) => !prev)}
              >
                {showConnectionsPanel ? "Hide connections" : "Connections"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowJobOffersPanel((prev) => !prev)}
              >
                {showJobOffersPanel ? "Hide Jobs" : "Job Offers"}
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

        {showConnectionsPanel && <ConnectionRequestsPanel userId={user.id} />}
        {showJobOffersPanel && user && <JobOffersPanel userId={user.id} role="WORKER" />}

        {/* Key metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6 shadow-lg border-2 border-teal-200">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">Trust score</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.trustScore}
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg border-2 border-blue-200">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Referrals received</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {stats.referralsReceived}
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 shadow-lg border-2 border-violet-200">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Verified jobs</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {stats.verifiedJobs}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          {/* Next trusted referral */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">
                Your next trusted referral
              </h2>
              <span className="text-[11px] text-neutral-500">
                Based on your recent jobs
              </span>
            </div>
            <div className="space-y-2 text-xs text-neutral-600">
              <p>
                Ask{" "}
                <span className="font-medium text-neutral-900">
                  Aisha (Yaba)
                </span>{" "}
                for a referral. She has hired you twice and is connected to 3
                other people looking for an electrician.
              </p>
              <Button size="sm" variant="outline">
                Copy referral request message
              </Button>
            </div>
          </Card>

          {/* Profile completeness */}
          <Card className="space-y-3">
            <div className="text-sm font-semibold text-neutral-900">
              Profile completeness
            </div>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>✓ Basics filled (name, trade, location)</li>
              <li>✓ At least 1 verified job</li>
              <li>○ Upload ID or business registration</li>
              <li>○ Add 3–5 clear photos of your work</li>
            </ul>
            <Link
              href="/onboarding/worker"
              className="text-xs text-neutral-600 underline-offset-2 hover:underline"
            >
              Update profile
            </Link>
          </Card>
        </div>

        {/* Connect with more people */}
        <Card className="bg-white/90 p-6 shadow-lg border-2 border-slate-200">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-slate-900">Connect with more people</h2>
              <p className="text-sm text-slate-600">
                Search by name to grow your network. We’ll show every account that matches—just like LinkedIn.
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
      </div>
    </div>
  );
}


