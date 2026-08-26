import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSentiment } from "@/lib/sentiment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      jobId,
      text,
      punctuality,
      communication,
      pricingFairness,
      skill,
      referrerId,
      isReferralBased,
    } = body;

    // Validate required fields
    if (!jobId || !text || punctuality === undefined || communication === undefined || 
        pricingFairness === undefined || skill === undefined) {
      return NextResponse.json(
        { message: "Job ID, text, and all ratings are required." },
        { status: 400 }
      );
    }

    // Validate ratings are between 1 and 5
    const ratings = { punctuality, communication, pricingFairness, skill };
    for (const [key, value] of Object.entries(ratings)) {
      if (value < 1 || value > 5 || !Number.isInteger(value)) {
        return NextResponse.json(
          { message: `${key} must be an integer between 1 and 5.` },
          { status: 400 }
        );
      }
    }

    // Get the job to find worker and client
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        worker: true,
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { message: "Job not found." },
        { status: 404 }
      );
    }

    // Calculate sentiment score from text
    const sentimentScore = calculateSentiment(text);

    // Get the author (client who wrote the review)
    const authorId = job.client.user.id;

    // Create the review
    const review = await prisma.review.create({
      data: {
        jobId,
        reviewerId: job.clientId,
        revieweeId: job.workerId,
        text: text.trim(),
        punctuality,
        communication,
        pricingFairness,
        skill,
        sentimentScore,
        isReferralBased: isReferralBased ?? false,
        referrerId: referrerId || null,
        visibility: "PUBLIC",
        authorId,
      },
      include: {
        reviewer: {
          include: {
            user: true,
          },
        },
      },
    });

    // Update or create trust score snapshot for the worker
    const latestTrust = await prisma.trustScoreSnapshot.findFirst({
      where: { workerId: job.workerId },
      orderBy: { computedAt: "desc" },
    });

    // Get all reviews for this worker to calculate aggregated sentiment
    const allReviews = await prisma.review.findMany({
      where: { revieweeId: job.workerId },
    });

    // Calculate aggregated ratings (handle empty reviews)
    const avgPunctuality = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.punctuality, 0) / allReviews.length
      : 0;
    const avgCommunication = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.communication, 0) / allReviews.length
      : 0;
    const avgPricingFairness = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.pricingFairness, 0) / allReviews.length
      : 0;
    const avgSkill = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.skill, 0) / allReviews.length
      : 0;
    const avgSentiment = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.sentimentScore, 0) / allReviews.length
      : 0;

    // Calculate trust score components
    const avgRating = (avgPunctuality + avgCommunication + avgPricingFairness + avgSkill) / 4;
    
    // Sentiment: 0-40 points (from 0-1 sentiment score)
    const sentimentComponent = Math.round(avgSentiment * 40);
    
    // Ratings: 0-30 points (from 1-5 average rating, normalized to 0-30)
    const ratingsComponent = Math.round(((avgRating - 1) / 4) * 30);
    
    // Referrals: 0-20 points (2 points per referral, max 10 referrals = 20 points)
    const referralsCount = allReviews.filter((r) => r.isReferralBased).length;
    const referralsComponent = Math.min(referralsCount * 2, 20);
    
    // Verified jobs: 0-10 points (1 point per verified job, max 10 jobs = 10 points)
    const verifiedJobs = await prisma.job.count({
      where: {
        workerId: job.workerId,
        verificationStatus: { in: ["CLIENT_CONFIRMED", "FULLY_VERIFIED"] },
      },
    });
    const verifiedComponent = Math.min(verifiedJobs, 10);

    // Total: 0-100 points
    const totalTrust = sentimentComponent + ratingsComponent + referralsComponent + verifiedComponent;

    if (latestTrust) {
      await prisma.trustScoreSnapshot.update({
        where: { id: latestTrust.id },
        data: {
          total: totalTrust,
          sentiment: sentimentComponent,
          referrals: referralsComponent,
          verified: verifiedComponent,
          freshness: 90, // Update freshness
          computedAt: new Date(),
        },
      });
    } else {
      await prisma.trustScoreSnapshot.create({
        data: {
          workerId: job.workerId,
          total: totalTrust,
          sentiment: sentimentComponent,
          referrals: referralsComponent,
          verified: verifiedComponent,
          freshness: 90,
        },
      });
    }

    return NextResponse.json(
      {
        review: {
          id: review.id,
          text: review.text,
          ratings: {
            punctuality: review.punctuality,
            communication: review.communication,
            pricingFairness: review.pricingFairness,
            skill: review.skill,
          },
          sentimentScore: review.sentimentScore,
          createdAt: review.createdAt,
          reviewer: {
            name: review.reviewer.user.name,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[reviews POST]", error);
    return NextResponse.json(
      { message: "Unable to submit review. Please try again." },
      { status: 500 }
    );
  }
}

