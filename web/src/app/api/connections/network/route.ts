import { NextResponse } from "next/server";
import type { ClientProfileStats, ConnectionNetworkEntry, WorkerSummary } from "@/lib/types";
import { prisma } from "@/lib/prisma";

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}

function buildWorkerSummary(user: {
  workerProfile: {
    id: string;
    name: string;
    trade: string;
    city: string;
    area: string;
    state: string | null;
    country: string | null;
    skills: unknown;
    trustScores: { total: number; sentiment: number; referrals: number; verified: number }[];
  } | null;
}): WorkerSummary | null {
  if (!user.workerProfile) {
    return null;
  }

  const trustSnapshot = user.workerProfile.trustScores?.[0];
  const locationParts = [
    user.workerProfile.city,
    user.workerProfile.state ?? "",
    user.workerProfile.country ?? "",
  ].filter((part) => part && part.length > 0);
  return {
    id: user.workerProfile.id,
    name: user.workerProfile.name,
    trade: user.workerProfile.trade,
    city: user.workerProfile.city,
    area: user.workerProfile.area,
    state: user.workerProfile.state ?? null,
    country: user.workerProfile.country ?? null,
    locationLabel:
      locationParts.length > 0 ? locationParts.join(", ") : user.workerProfile.area ?? user.workerProfile.city,
    trust: {
      total: trustSnapshot?.total ?? 0,
      sentiment: trustSnapshot?.sentiment ?? 0,
      referrals: trustSnapshot?.referrals ?? 0,
      verified: trustSnapshot?.verified ?? 0,
    },
    sentimentTags: toStringArray(user.workerProfile.skills ?? undefined),
  };
}

async function buildClientStatsMap(
  clientProfileIds: string[],
): Promise<Map<string, ClientProfileStats>> {
  const statsMap = new Map<string, ClientProfileStats>();
  if (clientProfileIds.length === 0) {
    return statsMap;
  }

  const [jobsByClient, jobCounts, reviewCounts, vouchCounts] = await Promise.all([
    prisma.job.findMany({
      where: { clientId: { in: clientProfileIds } },
      select: { clientId: true, workerId: true },
    }),
    prisma.job.groupBy({
      by: ["clientId"],
      where: { clientId: { in: clientProfileIds } },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["reviewerId"],
      where: { reviewerId: { in: clientProfileIds } },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["referrerId"],
      where: { referrerId: { in: clientProfileIds } },
      _count: { _all: true },
    }),
  ]);

  const uniqueWorkersByClient = new Map<string, Set<string>>();
  for (const job of jobsByClient) {
    const set = uniqueWorkersByClient.get(job.clientId) ?? new Set<string>();
    set.add(job.workerId);
    uniqueWorkersByClient.set(job.clientId, set);
  }

  const jobCountByClient = new Map(jobCounts.map((row) => [row.clientId, row._count._all]));
  const reviewCountByClient = new Map(
    reviewCounts.map((row) => [row.reviewerId, row._count._all]),
  );
  const vouchCountByClient = new Map(
    vouchCounts
      .filter((row): row is typeof row & { referrerId: string } => row.referrerId !== null)
      .map((row) => [row.referrerId, row._count._all]),
  );

  for (const clientProfileId of clientProfileIds) {
    const uniqueWorkerIds = uniqueWorkersByClient.get(clientProfileId) ?? new Set<string>();
    const employeeReviews = reviewCountByClient.get(clientProfileId) ?? 0;
    statsMap.set(clientProfileId, {
      peopleEmployed: uniqueWorkerIds.size,
      jobsPosted: jobCountByClient.get(clientProfileId) ?? 0,
      employeeReviews,
      peopleConnected: uniqueWorkerIds.size,
      workersVouching: vouchCountByClient.get(clientProfileId) ?? 0,
      reviewsWritten: employeeReviews,
    });
  }

  return statsMap;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          include: {
            workerProfile: {
              include: {
                trustScores: {
                  orderBy: { computedAt: "desc" },
                  take: 1,
                },
              },
            },
            clientProfile: true,
          },
        },
        userB: {
          include: {
            workerProfile: {
              include: {
                trustScores: {
                  orderBy: { computedAt: "desc" },
                  take: 1,
                },
              },
            },
            clientProfile: true,
          },
        },
      },
    });

    const entries: ConnectionNetworkEntry[] = [];

    const otherUsers = connections
      .map((connection) => (connection.userAId === userId ? connection.userB : connection.userA))
      .filter((otherUser): otherUser is NonNullable<typeof otherUser> => Boolean(otherUser));

    const clientProfileIds = otherUsers
      .filter((otherUser) => otherUser.role === "CLIENT" && otherUser.clientProfile)
      .map((otherUser) => otherUser.clientProfile!.id);

    const clientStatsMap = await buildClientStatsMap(clientProfileIds);

    for (const otherUser of otherUsers) {
      if (otherUser.role === "WORKER" && otherUser.workerProfile) {
        const summary = buildWorkerSummary(otherUser);
        if (summary) {
          entries.push({
            userId: otherUser.id,
            role: "WORKER",
            worker: summary,
          });
        }
      } else if (otherUser.role === "CLIENT" && otherUser.clientProfile) {
        const stats = clientStatsMap.get(otherUser.clientProfile.id) ?? {
          peopleEmployed: 0,
          jobsPosted: 0,
          employeeReviews: 0,
          peopleConnected: 0,
          workersVouching: 0,
          reviewsWritten: 0,
        };
        entries.push({
          userId: otherUser.id,
          role: "CLIENT",
          client: {
            name: otherUser.name,
            city: otherUser.clientProfile.city,
            area: otherUser.clientProfile.area,
            state: otherUser.clientProfile.state,
            country: otherUser.clientProfile.country,
            stats,
          },
        });
      }
    }

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error("[connections/network GET]", error);
    return NextResponse.json(
      { message: "Unable to load your network right now." },
      { status: 500 },
    );
  }
}


