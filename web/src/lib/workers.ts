import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { WorkerSummary } from "@/lib/types";

type WorkerProfileWithTrust = Prisma.WorkerProfileGetPayload<{
  include: {
    trustScores: {
      orderBy: { computedAt: "desc" };
      take: 1;
    };
  };
}>;

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}

function mapWorkerProfileToSummary(profile: WorkerProfileWithTrust): WorkerSummary {
  const latestTrust = profile.trustScores[0];
  const tags = toStringArray(profile.skills ?? undefined);
  const locationParts = [profile.city, profile.state ?? null, profile.country ?? null].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  return {
    id: profile.id,
    name: profile.name,
    trade: profile.trade,
    city: profile.city,
    area: profile.area,
    state: profile.state ?? null,
    country: profile.country ?? null,
    locationLabel: locationParts.length > 0 ? locationParts.join(", ") : profile.area ?? profile.city,
    trust: {
      total: latestTrust?.total ?? 0,
      sentiment: latestTrust?.sentiment ?? 0,
      referrals: latestTrust?.referrals ?? 0,
      verified: latestTrust?.verified ?? 0,
    },
    sentimentTags: tags,
    pathToYou: profile.pathToYou ?? undefined,
    inYourNetworkSteps: profile.networkSteps ?? undefined,
  };
}

export async function getWorkerSummaries(options?: {
  limit?: number;
  trade?: string;
}): Promise<WorkerSummary[]> {
  const { limit, trade } = options ?? {};

  const workers = await prisma.workerProfile.findMany({
    where: trade ? { trade } : undefined,
    include: {
      trustScores: {
        orderBy: { computedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return workers.map(mapWorkerProfileToSummary);
}

export async function getWorkerSummaryById(id: string): Promise<WorkerSummary | null> {
  const worker = await prisma.workerProfile.findUnique({
    where: { id },
    include: {
      trustScores: {
        orderBy: { computedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!worker) {
    return null;
  }

  return mapWorkerProfileToSummary(worker);
}

export function mapWorkerProfile(profile: WorkerProfileWithTrust): WorkerSummary {
  return mapWorkerProfileToSummary(profile);
}


