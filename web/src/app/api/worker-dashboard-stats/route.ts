import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required." },
        { status: 400 },
      );
    }

    // Get worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        trustScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
        reviews: {
          where: {
            isReferralBased: true,
          },
        },
        jobs: {
          where: {
            verificationStatus: {
              in: ["CLIENT_CONFIRMED", "FULLY_VERIFIED"],
            },
          },
        },
      },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { message: "Worker profile not found." },
        { status: 404 },
      );
    }

    // Get latest trust score or calculate default
    const latestTrustScore = workerProfile.trustScores[0];
    const trustScore = latestTrustScore?.total ?? 0;

    // Count referrals received (reviews that are referral-based)
    const referralsReceived = workerProfile.reviews.length;

    // Count verified jobs
    const verifiedJobs = workerProfile.jobs.length;

    return NextResponse.json(
      {
        trustScore,
        referralsReceived,
        verifiedJobs,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[worker-dashboard-stats]", error);
    return NextResponse.json(
      { message: "Unable to fetch dashboard stats. Please try again." },
      { status: 500 },
    );
  }
}


