"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WorkerCard } from "@/components/worker-card";
import type { ConnectionRequestLists } from "@/lib/types";

interface ConnectionRequestsPanelProps {
  userId: string;
}

export function ConnectionRequestsPanel({ userId }: ConnectionRequestsPanelProps) {
  const [data, setData] = useState<ConnectionRequestLists>({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function fetchRequests() {
      try {
        const response = await fetch(`/api/connections/requests?userId=${userId}`);
        const payload = (await response.json()) as ConnectionRequestLists & { message?: string };
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load connection requests.");
        }
        if (!active) return;
        setData({
          sent: payload.sent ?? [],
          received: payload.received ?? [],
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load connection requests.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchRequests();

    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  async function handleAccept(requestId: string) {
    setAcceptingId(requestId);
    setError(null);
    try {
      const response = await fetch("/api/connections/requests/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, userId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to accept this connection request.");
      }
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept this connection request.");
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleDecline(requestId: string) {
    setDecliningId(requestId);
    setError(null);
    try {
      const response = await fetch("/api/connections/requests/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, userId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to decline this connection request.");
      }
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to decline this connection request.");
    } finally {
      setDecliningId(null);
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/90 p-6 shadow-lg border-2 border-slate-200">
        <div className="text-sm text-slate-600">Loading connection requests...</div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 p-6 shadow-lg border-2 border-slate-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Connection requests</h3>
          <p className="text-sm text-slate-600">
            Keep track of invitations you have sent and received. Accepting a request will connect both
            of you automatically.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Requests received
            </div>
            {data.received.length === 0 ? (
              <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                No pending requests yet.
              </Card>
            ) : (
              <div className="space-y-3">
                {data.received.map((request) => (
                  <WorkerCard
                    key={request.requestId}
                    worker={request.summary}
                    footerContent={
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDecline(request.requestId)}
                          disabled={decliningId === request.requestId || acceptingId === request.requestId}
                        >
                          {decliningId === request.requestId ? "Declining..." : "Decline"}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                          onClick={() => handleAccept(request.requestId)}
                          disabled={acceptingId === request.requestId || decliningId === request.requestId}
                        >
                          {acceptingId === request.requestId ? "Accepting..." : "Accept"}
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Requests sent
            </div>
            {data.sent.length === 0 ? (
              <Card className="border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                You haven’t sent any new requests.
              </Card>
            ) : (
              <div className="space-y-3">
                {data.sent.map((request) => (
                  <WorkerCard
                    key={request.requestId}
                    worker={request.summary}
                    footerContent={
                      <div className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500">
                        Pending...
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Card>
  );
}



