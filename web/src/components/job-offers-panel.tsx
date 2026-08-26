"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  description: string | null;
  city: string;
  area: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  client: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface JobOffersPanelProps {
  userId: string;
  role: "CLIENT" | "WORKER";
}

export function JobOffersPanel({ userId, role }: JobOffersPanelProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function fetchJobs() {
      try {
        const response = await fetch(`/api/jobs?userId=${userId}&role=${role}`);
        const payload = (await response.json()) as { jobs?: Job[]; message?: string };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load jobs.");
        }
        if (!active) return;
        setJobs(payload.jobs ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load jobs.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchJobs();

    return () => {
      active = false;
    };
  }, [userId, role]);

  async function handleUpdateJobStatus(jobId: string, status: string) {
    setUpdatingId(jobId);
    setError(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to update job status.");
      }
      // Refresh jobs list
      const jobsResponse = await fetch(`/api/jobs?userId=${userId}&role=${role}`);
      const jobsPayload = (await jobsResponse.json()) as { jobs?: Job[] };
      setJobs(jobsPayload.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update job status.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/90 p-6 shadow-lg border-2 border-slate-200">
        <div className="text-sm text-slate-600">Loading jobs...</div>
      </Card>
    );
  }

  const pendingJobs = jobs.filter((j) => j.status === "PENDING");
  const activeJobs = jobs.filter((j) => j.status === "IN_PROGRESS");
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED");

  return (
    <Card className="bg-white/90 p-6 shadow-lg border-2 border-slate-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {role === "WORKER" ? "Job Offers" : "My Jobs"}
          </h3>
          <p className="text-sm text-slate-600">
            {role === "WORKER"
              ? "Manage job offers from clients. Accept to start working."
              : "Track your job postings and their status."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {pendingJobs.length > 0 && (
          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              Pending ({pendingJobs.length})
            </div>
            <div className="space-y-2">
              {pendingJobs.map((job) => (
                <Card
                  key={job.id}
                  className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-semibold text-slate-900">{job.title}</div>
                      {job.description && (
                        <div className="text-xs text-slate-600">{job.description}</div>
                      )}
                      <div className="text-[10px] text-slate-500">
                        {role === "WORKER" ? `From: ${job.client.user.name}` : `Worker: ${job.client.user.name}`} · {job.area}, {job.city}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {role === "WORKER" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleUpdateJobStatus(job.id, "CANCELLED")}
                          disabled={updatingId === job.id}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs bg-gradient-to-r from-teal-600 to-emerald-600"
                          onClick={() => handleUpdateJobStatus(job.id, "IN_PROGRESS")}
                          disabled={updatingId === job.id}
                        >
                          {updatingId === job.id ? "Updating..." : "Accept"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {activeJobs.length > 0 && (
          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              In Progress ({activeJobs.length})
            </div>
            <div className="space-y-2">
              {activeJobs.map((job) => (
                <Card
                  key={job.id}
                  className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-semibold text-slate-900">{job.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {role === "WORKER" ? `Client: ${job.client.user.name}` : `Worker: ${job.client.user.name}`} · {job.area}, {job.city}
                      </div>
                    </div>
                    {role === "CLIENT" && (
                      <Button
                        size="sm"
                        className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600"
                        onClick={() => handleUpdateJobStatus(job.id, "COMPLETED")}
                        disabled={updatingId === job.id}
                      >
                        {updatingId === job.id ? "Updating..." : "Mark Complete"}
                      </Button>
                    )}
                    <Link href={`/jobs/${job.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {completedJobs.length > 0 && (
          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Completed ({completedJobs.length})
            </div>
            <div className="space-y-2">
              {completedJobs.slice(0, 5).map((job) => (
                <Card
                  key={job.id}
                  className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-semibold text-slate-900">{job.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {role === "WORKER" ? `Client: ${job.client.user.name}` : `Worker: ${job.client.user.name}`} · {job.area}, {job.city}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Completed {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link href={`/workers/${job.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        {role === "CLIENT" ? "Leave Review" : "View"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {jobs.length === 0 && (
          <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            {role === "WORKER"
              ? "No job offers yet. Complete your profile to get discovered!"
              : "No jobs posted yet. Start by hiring a worker!"}
          </Card>
        )}
      </div>
    </Card>
  );
}

