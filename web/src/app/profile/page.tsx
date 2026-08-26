"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientCard } from "@/components/client-card";
import { WorkerCard } from "@/components/worker-card";
import { useUserStore } from "@/store/user-store";
import type { AuthUser, ClientProfileStats, ConnectionNetworkEntry, WorkerSummary } from "@/lib/types";

interface WorkerProfile {
  id: string;
  name: string;
  trade: string;
  city: string;
  area: string;
  state?: string | null;
  country?: string | null;
  fullAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bio: string | null;
  skills: string[] | null;
  radiusKm: number | null;
  userId: string;
}

interface ClientProfile {
  id: string;
  name: string;
  city: string;
  area: string;
  state?: string | null;
  country?: string | null;
  fullAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  userId: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [clientStats, setClientStats] = useState<ClientProfileStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkEntries, setNetworkEntries] = useState<ConnectionNetworkEntry[]>([]);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Hydrate user from localStorage
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

  // Fetch profile based on role
  useEffect(() => {
    if (!hydrated || !user?.id) {
      setLoading(false);
      return;
    }

    let active = true;
    const currentUser = user;

    async function fetchProfile() {
      try {
        if (currentUser.role === "WORKER") {
          const response = await fetch(`/api/worker-profile?userId=${currentUser.id}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Profile not found. Please complete onboarding first.");
            }
            throw new Error("Unable to fetch profile");
          }
          const data = (await response.json()) as { profile: WorkerProfile };
          if (!active) return;
          setWorkerProfile(data.profile);
          setError(null);
        } else if (currentUser.role === "CLIENT") {
          const response = await fetch(`/api/client-profile?userId=${currentUser.id}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Profile not found. Please complete onboarding first.");
            }
            throw new Error("Unable to fetch profile");
          }
          const data = (await response.json()) as {
            profile: ClientProfile;
            stats: ClientProfileStats;
          };
          if (!active) return;
          setClientProfile(data.profile);
          setClientStats(data.stats);
          setError(null);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile. Please try again.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [hydrated, user?.id, user?.role]);

  // Fetch connections network
  useEffect(() => {
    if (!hydrated || !user?.id) {
      setNetworkLoading(false);
      return;
    }

    let active = true;
    const currentUserId = user.id;

    async function fetchNetwork() {
      try {
        const response = await fetch(`/api/connections/network?userId=${currentUserId}`);
        const payload = (await response.json()) as { entries?: ConnectionNetworkEntry[]; message?: string };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load your network.");
        }
        if (!active) return;
        setNetworkEntries(payload.entries ?? []);
        setNetworkError(null);
      } catch (err) {
        if (!active) return;
        setNetworkError(err instanceof Error ? err.message : "Unable to load your network.");
      } finally {
        if (active) {
          setNetworkLoading(false);
        }
      }
    }

    fetchNetwork();

    return () => {
      active = false;
    };
  }, [hydrated, user?.id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (hydrated && !user?.id) {
      router.push("/auth/sign-in");
    }
  }, [hydrated, user?.id, router]);

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
        <Card className="w-full max-w-sm text-center text-sm text-slate-600">
          Loading your profile...
        </Card>
      </div>
    );
  }

  if (!user?.id) {
    return null; // Will redirect
  }

  if (error && !workerProfile && !clientProfile) {
    const onboardingLink =
      user.role === "WORKER" ? "/onboarding/worker" : "/onboarding/client";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Your Profile
            </h1>
          </header>
          <Card className="bg-white p-6 shadow-lg border-2 border-slate-200">
            <div className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
              <Link href={onboardingLink}>
                <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                  Complete your profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Worker Profile View
  if (user.role === "WORKER" && workerProfile) {
    const skillsArray = Array.isArray(workerProfile.skills)
      ? workerProfile.skills
      : workerProfile.skills
        ? [workerProfile.skills]
        : [];
    const locationLabelParts = [workerProfile.city, workerProfile.state ?? null, workerProfile.country ?? null].filter(
      (part): part is string => typeof part === "string" && part.length > 0,
    );
    const locationLabel =
      locationLabelParts.length > 0 ? locationLabelParts.join(", ") : workerProfile.area ?? workerProfile.city;

    const workerSummary: WorkerSummary = {
      id: workerProfile.id,
      name: workerProfile.name,
      trade: workerProfile.trade,
      city: workerProfile.city,
      area: workerProfile.area,
      locationLabel,
      trust: {
        total: 0,
        sentiment: 0,
        referrals: 0,
        verified: 0,
      },
      sentimentTags: skillsArray.length > 0 ? skillsArray : [],
    };

    const getTradeColor = (trade: string) => {
      if (trade === "Electrician") return "bg-gradient-to-br from-amber-500 to-orange-600";
      if (trade === "Plumber") return "bg-gradient-to-br from-blue-500 to-cyan-600";
      if (trade === "Cleaner") return "bg-gradient-to-br from-emerald-500 to-teal-600";
      return "bg-gradient-to-br from-violet-500 to-purple-600";
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* Large Profile Card */}
          <div className="group mx-auto flex w-full max-w-4xl flex-col justify-between rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-sm shadow-md transition-all hover:border-teal-400 hover:shadow-xl">
            <div className="flex items-start gap-6">
              <div className={`flex h-20 w-20 items-center justify-center rounded-xl ${getTradeColor(workerSummary.trade)} text-lg font-bold text-white shadow-lg`}>
                {workerSummary.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-2xl font-semibold text-slate-900">{workerSummary.name}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-teal-100 px-3 py-1 font-medium text-teal-700">
                    {workerSummary.trade}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-600">{workerSummary.locationLabel}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Trust</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {workerSummary.trust.total}
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium">Sentiment {workerSummary.trust.sentiment}</span>
                <span>·</span>
                <span className="font-medium">Referrals {workerSummary.trust.referrals}</span>
                <span>·</span>
                <span className="font-medium">Verified {workerSummary.trust.verified}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Tags:
                </span>
                {workerSummary.sentimentTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-3 py-1 text-xs font-medium text-violet-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {workerProfile.bio && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Bio</h3>
                  <p className="text-sm text-slate-600">{workerProfile.bio}</p>
                </div>
              )}

              {workerProfile.radiusKm && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Coverage Area</h3>
                  <p className="text-sm text-slate-600">
                    Within {workerProfile.radiusKm} km of {locationLabel}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-slate-200">
              <Link
                href={`/graph?focus=${encodeURIComponent(workerSummary.id)}`}
                className="text-sm font-medium text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline"
              >
                Graph →
              </Link>
              <div className="flex gap-3">
                <Link href="/onboarding/worker">
                  <Button variant="outline" size="lg" className="border-2">
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/dashboard/worker">
                  <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {renderNetworkSection()}
        </div>
      </div>
    );
  }

  // Client Profile View
  if (user.role === "CLIENT" && clientProfile && clientStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <ClientCard
            name={clientProfile.name}
            city={clientProfile.city}
            area={clientProfile.area}
            state={clientProfile.state ?? undefined}
            country={clientProfile.country ?? undefined}
            stats={clientStats}
            footer={
              <div className="flex items-center justify-between gap-4">
                <Link
                  href={`/graph?focus=${encodeURIComponent(clientProfile.id)}`}
                  className="text-sm font-medium text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline"
                >
                  Graph →
                </Link>
                <div className="flex gap-3">
                  <Link href="/onboarding/client">
                    <Button variant="outline" size="lg" className="border-2">
                      Edit Profile
                    </Button>
                  </Link>
                  <Link href="/dashboard/client">
                    <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            }
          />
          {renderNetworkSection()}
        </div>
      </div>
    );
  }
  function renderNetworkSection() {
    const clientConnections = networkEntries.filter(
      (entry): entry is ConnectionNetworkEntry & { client: NonNullable<ConnectionNetworkEntry["client"]> } =>
        entry.role === "CLIENT" && !!entry.client,
    );
    const workerConnections = networkEntries.filter(
      (entry): entry is ConnectionNetworkEntry & { worker: NonNullable<ConnectionNetworkEntry["worker"]> } =>
        entry.role === "WORKER" && !!entry.worker,
    );

    return (
      <div className="space-y-4 rounded-2xl border-2 border-slate-200 bg-white/90 p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">My Network</h3>
          {networkLoading && (
            <span className="text-xs font-medium text-slate-500">Loading...</span>
          )}
        </div>

        {networkError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {networkError}
          </div>
        )}

        {!networkLoading && !networkError && networkEntries.length === 0 && (
          <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            You haven’t connected with anyone yet.
          </Card>
        )}

        {!networkLoading && networkEntries.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Connected Clients</h4>
                <span className="text-xs text-slate-500">{clientConnections.length}</span>
              </div>
              {clientConnections.length === 0 ? (
                <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  No client connections yet.
                </Card>
              ) : (
                <div className="space-y-3">
                  {clientConnections.map((entry) => (
                    <div
                      key={entry.userId}
                      className="transform rounded-xl border border-slate-100 bg-white/90 p-2 shadow-sm transition hover:shadow-md"
                    >
                      <div className="scale-[0.9] transform">
                        <ClientCard
                          name={entry.client!.name}
                          city={entry.client!.city}
                          area={entry.client!.area}
                          state={entry.client!.state ?? undefined}
                          country={entry.client!.country ?? undefined}
                          stats={entry.client!.stats}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Workers You’ve Hired</h4>
                <span className="text-xs text-slate-500">{workerConnections.length}</span>
              </div>
              {workerConnections.length === 0 ? (
                <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  No hires recorded yet.
                </Card>
              ) : (
                <div className="space-y-3">
                  {workerConnections.map((entry) => (
                    <div
                      key={`${entry.userId}-${entry.worker!.id}`}
                      className="transform rounded-xl border border-slate-100 bg-white/90 p-2 shadow-sm transition hover:shadow-md"
                    >
                      <div className="scale-[0.9] transform">
                        <WorkerCard worker={entry.worker!} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  return null;
}
