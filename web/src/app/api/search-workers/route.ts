import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapWorkerProfile } from "@/lib/workers";
import type { Prisma } from "@prisma/client";
import type { MutualConnectionSummary, WorkerSummary } from "@/lib/types";

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

function matchesTrade(profile: WorkerProfileWithTrust, normalizedTrade: string): boolean {
  if (!normalizedTrade) return true;
  if (profile.trade?.toLowerCase().includes(normalizedTrade)) return true;

  const skills = toStringArray(profile.skills ?? undefined);
  return skills.some((skill) => skill.toLowerCase().includes(normalizedTrade));
}

function matchesLocation(
  profile: WorkerProfileWithTrust,
  normalizedLocation: string,
  cityFilter: string,
  stateFilter: string,
  countryFilter: string,
): boolean {
  const normalizedTokens =
    normalizedLocation.length > 0
      ? normalizedLocation
          .split(/[,]/)
          .map((token) => token.trim())
          .filter((token) => token.length > 0)
      : [];

  const locationCandidates = [profile.area, profile.city, profile.state, profile.country].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  const matchesTokens = (value: string | null | undefined) => {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    if (normalizedTokens.length === 0) return true;
    return normalizedTokens.some((token) => lowerValue.includes(token));
  };

  const includesFilter = (value: string | null | undefined, filter: string) => {
    if (!filter) return true;
    return (value ?? "").toLowerCase().includes(filter);
  };

  const locationMatch =
    normalizedTokens.length === 0 ? true : locationCandidates.some((candidate) => matchesTokens(candidate));

  const cityMatch = cityFilter
    ? includesFilter(profile.city, cityFilter) ||
      includesFilter(profile.area, cityFilter) ||
      locationMatch
    : true;

  const stateMatch = stateFilter
    ? includesFilter(profile.state, stateFilter) || locationMatch
    : true;

  const countryMatch = countryFilter
    ? includesFilter(profile.country, countryFilter) || locationMatch
    : true;

  return locationMatch && cityMatch && stateMatch && countryMatch;
}

async function getNetworkInsights(
  userId: string,
  workerUserIds: string[],
): Promise<{
  mutualMap: Map<string, MutualConnectionSummary[]>;
  directConnections: Set<string>;
}> {
  if (!userId || workerUserIds.length === 0) {
    return {
      mutualMap: new Map(),
      directConnections: new Set(),
    };
  }

  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: {
        select: {
          id: true,
          name: true,
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const networkMap = new Map<string, MutualConnectionSummary>();

  connections.forEach((connection) => {
    const otherUser =
      connection.userAId === userId ? connection.userB : connection.userA;

    if (otherUser) {
      networkMap.set(otherUser.id, {
        userId: otherUser.id,
        name: otherUser.name,
      });
    }
  });

  const networkIds = Array.from(networkMap.keys());
  const workerSet = new Set(workerUserIds);

  const mutualConnections = await prisma.connection.findMany({
    where: {
      OR: [
        {
          userAId: { in: workerUserIds },
          userBId: { in: networkIds },
        },
        {
          userBId: { in: workerUserIds },
          userAId: { in: networkIds },
        },
      ],
    },
  });

  const directConnections = await prisma.connection.findMany({
    where: {
      OR: [
        {
          userAId: userId,
          userBId: { in: workerUserIds },
        },
        {
          userBId: userId,
          userAId: { in: workerUserIds },
        },
      ],
    },
  });

  const mutualMap = new Map<string, MutualConnectionSummary[]>();

  const addMutual = (workerUserId: string, mutualUserId: string) => {
    const mutual = networkMap.get(mutualUserId);
    if (!mutual) return;

    const existing = mutualMap.get(workerUserId);
    if (existing) {
      if (!existing.some((entry) => entry.userId === mutual.userId)) {
        existing.push(mutual);
      }
    } else {
      mutualMap.set(workerUserId, [mutual]);
    }
  };

  mutualConnections.forEach((connection) => {
    if (workerSet.has(connection.userAId)) {
      addMutual(connection.userAId, connection.userBId);
    }
    if (workerSet.has(connection.userBId)) {
      addMutual(connection.userBId, connection.userAId);
    }
  });

  const directConnectionIds = new Set<string>();
  directConnections.forEach((connection) => {
    const workerUserId = connection.userAId === userId ? connection.userBId : connection.userAId;
    directConnectionIds.add(workerUserId);
  });

  return {
    mutualMap,
    directConnections: directConnectionIds,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trade = (searchParams.get("trade") ?? "").trim();
    const location = (searchParams.get("location") ?? "").trim();
    const city = (searchParams.get("city") ?? "").trim().toLowerCase();
    const state = (searchParams.get("state") ?? "").trim().toLowerCase();
    const country = (searchParams.get("country") ?? "").trim().toLowerCase();
    const requesterId = (searchParams.get("userId") ?? "").trim();

    if (!trade) {
      return NextResponse.json({ message: "Trade is required." }, { status: 400 });
    }

    const normalizedTrade = trade.toLowerCase();
    const normalizedLocation = location.toLowerCase();

    const profiles = await prisma.workerProfile.findMany({
      include: {
        trustScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
      },
    });

    let filteredProfiles = profiles.filter((profile) => matchesTrade(profile, normalizedTrade));

    if (location) {
      filteredProfiles = filteredProfiles.filter((profile) =>
        matchesLocation(profile, normalizedLocation, city, state, country),
      );
    }

    filteredProfiles = filteredProfiles
      .sort((a, b) => {
        const trustA = a.trustScores[0]?.total ?? 0;
        const trustB = b.trustScores[0]?.total ?? 0;
        return trustB - trustA;
      })
      .slice(0, 40);

    const { mutualMap, directConnections } = requesterId
      ? await getNetworkInsights(
          requesterId,
          filteredProfiles.map((profile) => profile.userId),
        )
      : {
          mutualMap: new Map<string, MutualConnectionSummary[]>(),
          directConnections: new Set<string>(),
        };

    const filtered = filteredProfiles.map<WorkerSummary>((profile) => {
      const summary = mapWorkerProfile(profile);
      const mutual = mutualMap.get(profile.userId);
      const isDirectConnection = directConnections.has(profile.userId);
      return {
        ...summary,
        ...(mutual && mutual.length > 0 ? { mutualConnections: mutual } : {}),
        ...(isDirectConnection ? { isDirectConnection: true } : {}),
      };
    });

    return NextResponse.json({ results: filtered }, { status: 200 });
  } catch (error) {
    console.error("[search-workers]", error);
    return NextResponse.json(
      { message: "Unable to search for workers right now. Please try again." },
      { status: 500 },
    );
  }
}


