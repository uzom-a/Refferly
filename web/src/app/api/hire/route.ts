import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { clientUserId, workerId } = (await request.json()) as {
      clientUserId?: string;
      workerId?: string;
    };

    if (!clientUserId || !workerId) {
      return NextResponse.json(
        { message: "Client user ID and worker ID are required." },
        { status: 400 },
      );
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: clientUserId },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { message: "Client profile not found. Complete onboarding first." },
        { status: 404 },
      );
    }

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        trustScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!workerProfile) {
      return NextResponse.json({ message: "Worker not found." }, { status: 404 });
    }

    const jobTitle = `Direct hire - ${new Date().toLocaleDateString("en-US")}`;

    // Automatically create connection between client and worker
    const [userAId, userBId] = clientUserId < workerProfile.userId
      ? [clientUserId, workerProfile.userId]
      : [workerProfile.userId, clientUserId];

    // Create connection if it doesn't exist
    await prisma.connection.upsert({
      where: {
        userAId_userBId: {
          userAId,
          userBId,
        },
      },
      create: {
        userAId,
        userBId,
      },
      update: {},
    });

    // Accept any pending connection requests between them
    await prisma.connectionRequest.updateMany({
      where: {
        OR: [
          { senderId: clientUserId, receiverId: workerProfile.userId },
          { senderId: workerProfile.userId, receiverId: clientUserId },
        ],
        status: "PENDING",
      },
      data: {
        status: "ACCEPTED",
      },
    });

    const job = await prisma.job.create({
      data: {
        workerId: workerProfile.id,
        clientId: clientProfile.id,
        title: jobTitle,
        description: "Direct hire recorded from the client dashboard.",
        city: clientProfile.city ?? workerProfile.city,
        area: clientProfile.area ?? workerProfile.area,
        status: "COMPLETED",
        verificationStatus: "FULLY_VERIFIED",
      },
    });

    // Update trust score with proper calculation
    const latestTrust = workerProfile.trustScores[0];
    if (latestTrust) {
      // Recalculate trust score properly
      const allReviews = await prisma.review.findMany({
        where: { revieweeId: workerProfile.id },
      });

      const avgSentiment = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.sentimentScore, 0) / allReviews.length
        : 0;
      const avgRating = allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.punctuality + r.communication + r.pricingFairness + r.skill, 0) / allReviews.length) / 4
        : 0;

      const sentimentComponent = Math.round(avgSentiment * 40);
      const ratingsComponent = Math.round(((avgRating - 1) / 4) * 30);
      const referralsCount = allReviews.filter((r) => r.isReferralBased).length;
      const referralsComponent = Math.min(referralsCount * 2, 20);
      
      const verifiedJobs = await prisma.job.count({
        where: {
          workerId: workerProfile.id,
          verificationStatus: { in: ["CLIENT_CONFIRMED", "FULLY_VERIFIED"] },
        },
      });
      const verifiedComponent = Math.min(verifiedJobs, 10);
      const totalTrust = sentimentComponent + ratingsComponent + referralsComponent + verifiedComponent;

      await prisma.trustScoreSnapshot.update({
        where: { id: latestTrust.id },
        data: {
          total: totalTrust,
          sentiment: sentimentComponent,
          referrals: referralsComponent,
          verified: verifiedComponent,
          freshness: 90,
          computedAt: new Date(),
        },
      });
    } else {
      await prisma.trustScoreSnapshot.create({
        data: {
          workerId: workerProfile.id,
          total: 10, // Initial trust for verified job
          sentiment: 0,
          referrals: 0,
          verified: 10, // One verified job
          freshness: 90,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Worker hire recorded successfully.",
        jobId: job.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[hire POST]", error);
    return NextResponse.json(
      { message: "Unable to hire this worker right now." },
      { status: 500 },
    );
  }
}


