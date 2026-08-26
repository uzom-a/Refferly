import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required." },
        { status: 400 }
      );
    }

    // Get current user's connections
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
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

    // Get all users connected to current user (direct connections)
    const connectedUserIds = new Set<string>();
    connections.forEach((conn) => {
      if (conn.userAId === userId) {
        connectedUserIds.add(conn.userBId);
      } else {
        connectedUserIds.add(conn.userAId);
      }
    });

    // Get second-degree connections (friends of friends)
    const secondDegreeConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { userAId: { in: Array.from(connectedUserIds) } },
          { userBId: { in: Array.from(connectedUserIds) } },
        ],
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

    // Get reviews with referral chains
    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { authorId: userId },
          { authorId: { in: Array.from(connectedUserIds) } },
          { referrerId: { in: Array.from(connectedUserIds) } },
        ],
        isReferralBased: true,
      },
      include: {
        reviewer: {
          include: {
            user: true,
          },
        },
        reviewee: {
          include: {
            user: true,
            trustScores: {
              orderBy: { computedAt: "desc" },
              take: 1,
            },
          },
        },
        referrer: {
          include: {
            user: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get jobs that connect clients to workers (include all statuses for better network visibility)
    const jobs = await prisma.job.findMany({
      where: {
        OR: [
          { client: { userId } },
          { client: { userId: { in: Array.from(connectedUserIds) } } },
          { worker: { userId: { in: Array.from(connectedUserIds) } } },
        ],
      },
      include: {
        worker: {
          include: {
            user: true,
            trustScores: {
              orderBy: { computedAt: "desc" },
              take: 1,
            },
          },
        },
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    // Build network nodes
    const nodes: Array<{
      id: string;
      label: string;
      type: "user" | "worker" | "client";
      userId?: string;
      workerId?: string;
      clientId?: string;
      trustScore?: number;
      trade?: string;
      location?: string;
    }> = [
      {
        id: userId,
        label: "You",
        type: "user",
        userId,
      },
    ];

    // Add connected users (clients)
    const addedUserIds = new Set<string>([userId]);
    connections.forEach((conn) => {
      const otherUser = conn.userAId === userId ? conn.userB : conn.userA;
      if (!addedUserIds.has(otherUser.id)) {
        addedUserIds.add(otherUser.id);
        if (otherUser.clientProfile) {
          nodes.push({
            id: otherUser.id,
            label: otherUser.name,
            type: "client",
            userId: otherUser.id,
            clientId: otherUser.clientProfile.id,
          });
        }
      }
    });

    // Add workers from jobs and reviews
    const addedWorkerIds = new Set<string>();
    jobs.forEach((job) => {
      if (job.worker && !addedWorkerIds.has(job.worker.id)) {
        addedWorkerIds.add(job.worker.id);
        const trustScore = job.worker.trustScores[0]?.total ?? 0;
        nodes.push({
          id: job.worker.id,
          label: `${job.worker.name}\n${job.worker.trade}`,
          type: "worker",
          workerId: job.worker.id,
          userId: job.worker.userId,
          trustScore,
          trade: job.worker.trade,
          location: `${job.worker.city}, ${job.worker.area}`,
        });
      }
    });

    reviews.forEach((review) => {
      if (review.reviewee && !addedWorkerIds.has(review.reviewee.id)) {
        addedWorkerIds.add(review.reviewee.id);
        const trustScore = review.reviewee.trustScores[0]?.total ?? 0;
        nodes.push({
          id: review.reviewee.id,
          label: `${review.reviewee.name}\n${review.reviewee.trade}`,
          type: "worker",
          workerId: review.reviewee.id,
          userId: review.reviewee.userId,
          trustScore,
          trade: review.reviewee.trade,
          location: `${review.reviewee.city}, ${review.reviewee.area}`,
        });
      }
    });

    // Build edges (connections)
    const edges: Array<{
      from: string;
      to: string;
      type: "connection" | "job" | "referral";
      label?: string;
      jobId?: string;
      reviewId?: string;
    }> = [];

    // Direct connections
    connections.forEach((conn) => {
      const fromId = conn.userAId === userId ? userId : conn.userAId;
      const toId = conn.userAId === userId ? conn.userBId : userId;
      edges.push({
        from: fromId,
        to: toId,
        type: "connection",
        label: "knows",
      });
    });

    // Job connections (client -> worker)
    jobs.forEach((job) => {
      if (job.client.userId && job.worker) {
        const label = job.status === "COMPLETED" 
          ? job.verificationStatus === "FULLY_VERIFIED" ? "verified job" : "completed"
          : job.status === "IN_PROGRESS" ? "in progress" : "job offer";
        edges.push({
          from: job.client.userId,
          to: job.worker.id,
          type: "job",
          label,
          jobId: job.id,
        });
      }
    });

    // Referral chains (client -> worker via referrer)
    reviews.forEach((review) => {
      if (review.isReferralBased && review.referrer && review.reviewee) {
        // Referrer (client) -> Worker
        edges.push({
          from: review.referrer.userId,
          to: review.reviewee.id,
          type: "referral",
          label: "referred",
          reviewId: review.id,
        });
      }
    });

    // Calculate network statistics
    const stats = {
      totalConnections: connections.length,
      totalWorkers: addedWorkerIds.size,
      totalJobs: jobs.length,
      totalReferrals: reviews.filter((r) => r.isReferralBased).length,
      averageTrustScore: nodes
        .filter((n) => n.type === "worker" && n.trustScore)
        .reduce((sum, n) => sum + (n.trustScore ?? 0), 0) / 
        nodes.filter((n) => n.type === "worker" && n.trustScore).length || 0,
    };

    return NextResponse.json(
      {
        nodes,
        edges,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[network-graph GET]", error);
    return NextResponse.json(
      { message: "Unable to load network graph." },
      { status: 500 }
    );
  }
}

