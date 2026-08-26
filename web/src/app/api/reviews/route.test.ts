import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.fn();
const createMock = vi.fn();
const findManyReviewsMock = vi.fn().mockResolvedValue([]);
const trustFindFirstMock = vi.fn().mockResolvedValue(null);
const trustCreateMock = vi.fn().mockResolvedValue({});
const trustUpdateMock = vi.fn().mockResolvedValue({});
const jobCountMock = vi.fn().mockResolvedValue(0);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    job: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      count: (...args: unknown[]) => jobCountMock(...args),
    },
    review: {
      findMany: (...args: unknown[]) => findManyReviewsMock(...args),
      create: (...args: unknown[]) => createMock(...args),
    },
    trustScoreSnapshot: {
      findFirst: (...args: unknown[]) => trustFindFirstMock(...args),
      create: (...args: unknown[]) => trustCreateMock(...args),
      update: (...args: unknown[]) => trustUpdateMock(...args),
    },
  },
}));

import { POST } from "./route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  jobId: "job-1",
  text: "Great work, very reliable.",
  punctuality: 5,
  communication: 4,
  pricingFairness: 4,
  skill: 5,
};

describe("POST /api/reviews", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
    findManyReviewsMock.mockReset().mockResolvedValue([]);
    trustFindFirstMock.mockReset().mockResolvedValue(null);
    trustCreateMock.mockReset().mockResolvedValue({});
    trustUpdateMock.mockReset().mockResolvedValue({});
    jobCountMock.mockReset().mockResolvedValue(0);
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(makeRequest({ jobId: "job-1", text: "Good" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toMatch(/required/i);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 when a rating is out of the 1-5 range", async () => {
    const response = await POST(makeRequest({ ...validBody, punctuality: 7 }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toMatch(/punctuality/i);
  });

  it("returns 400 when a rating is not an integer", async () => {
    const response = await POST(makeRequest({ ...validBody, skill: 3.5 }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toMatch(/skill/i);
  });

  it("returns 404 when the job does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const response = await POST(makeRequest(validBody));
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.message).toMatch(/not found/i);
  });

  it("creates a review when the payload is valid and the job exists", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "job-1",
      clientId: "client-1",
      workerId: "worker-1",
      client: { user: { id: "user-1" } },
    });
    createMock.mockResolvedValueOnce({
      id: "review-1",
      ...validBody,
      createdAt: new Date().toISOString(),
      reviewer: { user: { name: "Jane Client" } },
    });
    findManyReviewsMock.mockResolvedValueOnce([
      { punctuality: 5, communication: 4, pricingFairness: 4, skill: 5, sentimentScore: 0.8, isReferralBased: false },
    ]);

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(1);
    const createArgs = createMock.mock.calls[0][0];
    expect(createArgs.data.jobId).toBe("job-1");
    expect(createArgs.data.reviewerId).toBe("client-1");
    expect(createArgs.data.revieweeId).toBe("worker-1");

    // No prior trust snapshot existed, so a new one should be created (not updated)
    expect(trustCreateMock).toHaveBeenCalledTimes(1);
    expect(trustUpdateMock).not.toHaveBeenCalled();
    expect(trustCreateMock.mock.calls[0][0].data.workerId).toBe("worker-1");
  });
});
