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

async function buildClientStats(clientProfileId: string): Promise<ClientProfileStats> {
  const jobs = await prisma.job.findMany({
    where: { clientId: clientProfileId },
    select: { workerId: true },
  });

  const uniqueWorkerIds = new Set(jobs.map((job) => job.workerId));

  const [jobsPosted, employeeReviews, workersVouching] = await Promise.all([
    prisma.job.count({ where: { clientId: clientProfileId } }),
    prisma.review.count({ where: { reviewerId: clientProfileId } }),
    prisma.review.count({ where: { referrerId: clientProfileId } }),
  ]);

  return {
    peopleEmployed: uniqueWorkerIds.size,
    jobsPosted,
    employeeReviews,
    peopleConnected: uniqueWorkerIds.size,
    workersVouching,
    reviewsWritten: employeeReviews,
  };
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

    for (const connection of connections) {
      const otherUser =
        connection.userAId === userId ? connection.userB : connection.userA;

      if (!otherUser) continue;

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
        const stats = await buildClientStats(otherUser.clientProfile.id);
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


