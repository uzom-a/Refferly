import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NetworkSearchResult } from "@/lib/types";
import { mapWorkerProfile } from "@/lib/workers";

const RESULT_LIMIT = 12;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    if (query.length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const include = {
      trustScores: {
        orderBy: { computedAt: "desc" },
        take: 1,
      },
      user: {
        select: {
          id: true,
        },
      },
    } as const;

    const isSQLite = (process.env.DATABASE_URL ?? "").startsWith("file:");

    if (isSQLite) {
      const normalizedQuery = query.toLowerCase();
      const candidates = await prisma.workerProfile.findMany({
        include,
        orderBy: { createdAt: "desc" },
        take: 60,
      });

      const filtered = candidates
        .filter((profile) => {
          const haystack = [profile.name, profile.trade, profile.city, profile.area]
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.toLowerCase());

          return haystack.some((value) => value.includes(normalizedQuery));
        })
        .slice(0, RESULT_LIMIT);

      const results: NetworkSearchResult[] = filtered.map((profile) => ({
        userId: profile.userId,
        summary: mapWorkerProfile(profile),
      }));

      return NextResponse.json({ results }, { status: 200 });
    }

    const profiles = await prisma.workerProfile.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { trade: { contains: query } },
          { city: { contains: query } },
          { area: { contains: query } },
        ],
      },
      include,
      take: RESULT_LIMIT,
    });

    const results: NetworkSearchResult[] = profiles.map((profile) => ({
      userId: profile.userId,
      summary: mapWorkerProfile(profile),
    }));

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("[network-search]", error);
    return NextResponse.json(
      { message: "Unable to search the network right now. Please try again." },
      { status: 500 },
    );
  }
}


