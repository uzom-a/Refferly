import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkerSummaryById, getWorkerSummaries } from "@/lib/workers";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, context: RouteParams) {
  try {
    const params = context?.params ? await context.params : null;

    if (!params?.id) {
      return NextResponse.json({ message: "Worker ID is required." }, { status: 400 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        trustScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
        reviews: {
          include: {
            reviewer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        jobs: {
          where: {
            status: "COMPLETED",
            verificationStatus: { in: ["CLIENT_CONFIRMED", "FULLY_VERIFIED"] },
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ message: "Worker not found." }, { status: 404 });
    }

    const summary = await getWorkerSummaryById(worker.id);
    const peers = await getWorkerSummaries({ trade: worker.trade, limit: 5 });

    // Calculate aggregated ratings
    const reviews = worker.reviews;
    const avgPunctuality = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.punctuality, 0) / reviews.length
      : 0;
    const avgCommunication = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.communication, 0) / reviews.length
      : 0;
    const avgPricingFairness = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.pricingFairness, 0) / reviews.length
      : 0;
    const avgSkill = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.skill, 0) / reviews.length
      : 0;
    const avgSentiment = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.sentimentScore, 0) / reviews.length
      : 0;
    const overallRating = reviews.length > 0
      ? (avgPunctuality + avgCommunication + avgPricingFairness + avgSkill) / 4
      : 0;

    // Format reviews for display
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      text: review.text,
      ratings: {
        punctuality: review.punctuality,
        communication: review.communication,
        pricing: review.pricingFairness,
        skill: review.skill,
      },
      sentimentScore: review.sentimentScore,
      isReferralBased: review.isReferralBased,
      createdAt: review.createdAt,
      reviewer: {
        name: review.reviewer.user.name,
      },
      job: {
        id: review.job.id,
        title: review.job.title,
      },
    }));

    return NextResponse.json(
      {
        worker: {
          ...summary,
          email: worker.user.email,
        },
        peers: peers.filter((peer) => peer.id !== worker.id),
        reviews: formattedReviews,
        aggregatedRatings: {
          punctuality: Math.round(avgPunctuality * 10) / 10,
          communication: Math.round(avgCommunication * 10) / 10,
          pricingFairness: Math.round(avgPricingFairness * 10) / 10,
          skill: Math.round(avgSkill * 10) / 10,
          overall: Math.round(overallRating * 10) / 10,
          sentiment: Math.round(avgSentiment * 100) / 100,
        },
        availableJobs: worker.jobs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[workers/id GET]", error);
    return NextResponse.json(
      { message: "Unable to load that worker right now." },
      { status: 500 }
    );
  }
}
