import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { mapWorkerProfile } from "./workers";

function buildProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "worker-1",
    name: "Jane Doe",
    trade: "Electrician",
    city: "Austin",
    area: "Downtown",
    state: "TX",
    country: "USA",
    skills: ["Reliable", "Punctual"],
    pathToYou: undefined,
    networkSteps: undefined,
    trustScores: [{ total: 82, sentiment: 30, referrals: 12, verified: 10 }],
    ...overrides,
  } as never;
}

describe("mapWorkerProfile", () => {
  it("maps a full profile with a trust score to a WorkerSummary", () => {
    const result = mapWorkerProfile(buildProfile());

    expect(result.id).toBe("worker-1");
    expect(result.name).toBe("Jane Doe");
    expect(result.trade).toBe("Electrician");
    expect(result.trust).toEqual({ total: 82, sentiment: 30, referrals: 12, verified: 10 });
    expect(result.sentimentTags).toEqual(["Reliable", "Punctual"]);
  });

  it("builds a comma-joined location label from city, state, and country", () => {
    const result = mapWorkerProfile(buildProfile());
    expect(result.locationLabel).toBe("Austin, TX, USA");
  });

  it("falls back to area when state and country are missing", () => {
    const result = mapWorkerProfile(
      buildProfile({ state: null, country: null }),
    );
    expect(result.locationLabel).toBe("Austin");
  });

  it("falls back to zeroed trust values when there are no trust scores yet", () => {
    const result = mapWorkerProfile(buildProfile({ trustScores: [] }));
    expect(result.trust).toEqual({ total: 0, sentiment: 0, referrals: 0, verified: 0 });
  });

  it("normalizes a single skills string into a one-item tag array", () => {
    const result = mapWorkerProfile(buildProfile({ skills: "Fast" }));
    expect(result.sentimentTags).toEqual(["Fast"]);
  });

  it("returns an empty tag array when skills is null or missing", () => {
    const result = mapWorkerProfile(buildProfile({ skills: null }));
    expect(result.sentimentTags).toEqual([]);
  });

  it("passes through pathToYou and networkSteps when present", () => {
    const result = mapWorkerProfile(
      buildProfile({ pathToYou: "via Alice", networkSteps: 2 }),
    );
    expect(result.pathToYou).toBe("via Alice");
    expect(result.inYourNetworkSteps).toBe(2);
  });
});
