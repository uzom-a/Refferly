"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewModal } from "@/components/review-modal";
import { CategoryStatsChart } from "@/components/category-stats-chart";
import { useUserStore } from "@/store/user-store";
import type { WorkerSummary } from "@/lib/types";

interface WorkerProfilePageProps {
  params: { id: string };
}

interface WorkerDetail extends WorkerSummary {
  email?: string;
}

interface Review {
  id: string;
  text: string;
  ratings: {
    punctuality: number;
    communication: number;
    pricing: number;
    skill: number;
  };
  sentimentScore: number;
  isReferralBased: boolean;
  createdAt: string;
  reviewer: {
    name: string;
  };
  job: {
    id: string;
    title: string;
  };
}

interface AggregatedRatings {
  punctuality: number;
  communication: number;
  pricingFairness: number;
  skill: number;
  overall: number;
  sentiment: number;
}

interface AvailableJob {
  id: string;
  title: string;
  createdAt: string;
}

export default function WorkerProfilePage({ params }: WorkerProfilePageProps) {
  const { user } = useUserStore();
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [peers, setPeers] = useState<WorkerSummary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregatedRatings, setAggregatedRatings] = useState<AggregatedRatings | null>(null);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReview, setOpenReview] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchWorker() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/workers/${params.id}`);
        const payload = (await response.json()) as {
          worker?: WorkerDetail;
          peers?: WorkerSummary[];
          reviews?: Review[];
          aggregatedRatings?: AggregatedRatings;
          availableJobs?: AvailableJob[];
          message?: string;
        };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load worker.");
        }
        if (!active) return;
        setWorker(payload.worker ?? null);
        setPeers(payload.peers ?? []);
        setReviews(payload.reviews ?? []);
        setAggregatedRatings(payload.aggregatedRatings ?? null);
        setAvailableJobs(payload.availableJobs ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load worker.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchWorker();

    return () => {
      active = false;
    };
  }, [params.id]);

  const getTradeColor = (trade: string) => {
    if (trade === "Electrician") return "from-amber-500 to-orange-600";
    if (trade === "Plumber") return "from-blue-500 to-cyan-600";
    if (trade === "Cleaner") return "from-emerald-500 to-teal-600";
    return "from-violet-500 to-purple-600";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6">
        <Card className="w-full max-w-md space-y-4 bg-white p-6 shadow-2xl">
          <div className="text-lg font-bold text-slate-900">Loading worker...</div>
        </Card>
      </div>
    );
  }

  if (!worker || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6">
        <Card className="w-full max-w-md space-y-4 bg-white p-6 shadow-2xl">
          <div className="text-lg font-bold text-slate-900">Worker not found</div>
          <p className="text-sm text-slate-600">
            {error ?? "This profile does not exist yet."}
          </p>
          <Link href="/search">
            <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600">
              Back to search
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/search"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
          >
            <span>←</span> Back to results
          </Link>
          <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
            Request this worker
          </Button>
        </div>

        {/* Header section with gradient */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.7fr),minmax(0,1.3fr)]">
          <Card className="bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg border-2 border-slate-200">
            <div className="flex gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${getTradeColor(worker.trade)} text-lg font-bold text-white shadow-xl`}>
                {worker.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="space-y-2 flex-1">
                <div className="text-xl font-bold text-slate-900">{worker.name}</div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 px-3 py-1 text-xs font-semibold text-teal-700">
                    {worker.trade}
                  </span>
                  <span className="text-sm text-slate-500">·</span>
                  <span className="text-sm text-slate-600">{worker.locationLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-700">
                    Network: 2 steps
                  </span>
                  <span>via Aisha</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6 shadow-lg border-2 border-teal-200">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Trust score
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {worker.trust.total} <span className="text-lg text-slate-500">/ 100</span>
              </div>
              <div className="space-y-2 pt-2 border-t border-teal-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Sentiment</span>
                  <span className="font-bold text-teal-600">{worker.trust.sentiment}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Referrals</span>
                  <span className="font-bold text-blue-600">{worker.trust.referrals}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Verified</span>
                  <span className="font-bold text-emerald-600">{worker.trust.verified}</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Sentiment summary */}
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 shadow-lg border-2 border-violet-200">
          <div className="space-y-4">
            <div className="text-base font-bold text-slate-900">What people keep saying</div>
            <div className="flex flex-wrap gap-2">
              {worker.sentimentTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-4 py-2 text-xs font-semibold text-violet-700 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-600">
              These tags come from words people use in reviews, not what the worker writes.
            </p>
          </div>
        </Card>

        {/* Recent verified jobs */}
        <Card className="bg-white p-6 shadow-lg border-2 border-slate-200">
          <div className="space-y-4">
            <div className="text-base font-bold text-slate-900">Recent verified jobs</div>
            <div className="space-y-3">
              {availableJobs.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No verified jobs yet.
                </div>
              ) : (
                availableJobs.map((job) => {
                  const date = new Date(job.createdAt);
                  const dateStr = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-4 rounded-xl border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {dateStr}
                        </div>
                        <div className="text-sm font-bold text-slate-900">{job.title}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white">
                          Verified
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* Reviews section */}
        <Card className="bg-white p-6 shadow-lg border-2 border-slate-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-slate-900">Reviews</div>
              <button
                className="text-sm font-medium text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline"
                onClick={() => {
                  if (availableJobs.length > 0) {
                    setSelectedJobId(availableJobs[0].id);
                  }
                  setOpenReview(true);
                }}
              >
                Leave review or referral
              </button>
            </div>
            {aggregatedRatings && reviews.length > 0 && (
              <div className="mb-4 rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-3">
                  Overall Ratings
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-slate-600">Overall</div>
                    <div className="text-lg font-bold text-teal-600">{aggregatedRatings.overall.toFixed(1)}/5</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Sentiment</div>
                    <div className="text-lg font-bold text-violet-600">{(aggregatedRatings.sentiment * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Punctuality</div>
                    <div className="text-lg font-bold text-amber-600">{aggregatedRatings.punctuality.toFixed(1)}/5</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Communication</div>
                    <div className="text-lg font-bold text-blue-600">{aggregatedRatings.communication.toFixed(1)}/5</div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No reviews yet. Be the first to review this worker!
                </div>
              ) : (
                reviews.map((r) => {
                  const date = new Date(r.createdAt);
                  const when = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                            {r.reviewer.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{r.reviewer.name}</div>
                            <div className="text-[10px] text-slate-500">{when}</div>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                            r.isReferralBased
                              ? "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700"
                              : "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700"
                          }`}>
                          {r.isReferralBased ? "From referral" : "Direct"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Punctuality</span>
                          <span className="font-bold text-amber-600">{r.ratings.punctuality}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Communication</span>
                          <span className="font-bold text-blue-600">{r.ratings.communication}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Pricing</span>
                          <span className="font-bold text-emerald-600">{r.ratings.pricing}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Skill</span>
                          <span className="font-bold text-violet-600">{r.ratings.skill}/5</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-800 mb-2">{r.text}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          Sentiment: {(r.sentimentScore * 100).toFixed(0)}%
                        </span>
                        {r.isReferralBased && (
                          <button className="text-xs font-medium text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline">
                            See referral path →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* Category comparison */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg border-2 border-amber-200">
          <div className="space-y-4">
            <div className="text-base font-bold text-slate-900">
              Compared to other {worker.trade.toLowerCase()}s in Lagos
            </div>
            <CategoryStatsChart workers={peers} currentWorkerId={worker.id} />
          </div>
        </Card>

        {/* Referral path visual */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-slate-900">
                How this worker links back to you
              </div>
              <Link
                href={`/graph?focus=${encodeURIComponent(worker.id)}`}
                className="text-sm font-medium text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline"
              >
                Open in full graph →
              </Link>
            </div>
            <div className="rounded-xl border-2 border-dashed border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-700">
              {worker.pathToYou ?? "Connections will appear here once your network grows."}
            </div>
          </div>
        </Card>

        {/* Bottom actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (availableJobs.length > 0) {
                setSelectedJobId(availableJobs[0].id);
              }
              setOpenReview(true);
            }}
            className="border-2"
          >
            Leave review or referral
          </Button>
          <Button
            size="lg"
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            onClick={async () => {
              if (!user?.id) {
                alert("Please sign in to request work from this worker.");
                return;
              }
              
              if (!worker?.id) {
                alert("Worker information not available.");
                return;
              }
              
              try {
                const response = await fetch("/api/jobs", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    clientUserId: user.id,
                    workerId: worker.id,
                    title: `Work request - ${new Date().toLocaleDateString()}`,
                    description: "Work request from client",
                  }),
                });
                
                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.message || "Failed to create job offer");
                }
                
                alert("Job offer created successfully! The worker will be notified.");
                // Refresh the page to show the new job
                window.location.reload();
              } catch (error) {
                alert(error instanceof Error ? error.message : "Failed to create job offer");
              }
            }}
          >
            Request work
          </Button>
        </div>
      </div>

      <ReviewModal
        open={openReview}
        onClose={() => {
          setOpenReview(false);
          setSelectedJobId(null);
        }}
        jobId={selectedJobId || undefined}
        workerId={worker?.id || ""}
        onSuccess={async () => {
          // Refetch worker data to show new review
          try {
            const response = await fetch(`/api/workers/${params.id}`);
            const data = await response.json();
            if (response.ok) {
              setReviews(data.reviews ?? []);
              setAggregatedRatings(data.aggregatedRatings ?? null);
              setAvailableJobs(data.availableJobs ?? []);
              if (data.worker) {
                setWorker({ ...worker, ...data.worker });
              }
            }
          } catch (err) {
            console.error("Failed to refresh worker data:", err);
          }
        }}
      />
    </div>
  );
}
