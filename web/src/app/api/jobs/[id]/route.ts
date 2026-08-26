import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/jobs/[id] - Get a specific job
 */
export async function GET(_: Request, context: RouteParams) {
  try {
    const params = context?.params ? await context.params : null;

    if (!params?.id) {
      return NextResponse.json({ message: "Job ID is required." }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        worker: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            trustScores: {
              orderBy: { computedAt: "desc" },
              take: 1,
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
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
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error("[jobs/[id] GET]", error);
    return NextResponse.json(
      { message: "Unable to load job." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id] - Update job status
 */
export async function PATCH(request: Request, context: RouteParams) {
  try {
    const params = context?.params ? await context.params : null;

    if (!params?.id) {
      return NextResponse.json({ message: "Job ID is required." }, { status: 400 });
    }

    const body = await request.json();
    const { status, verificationStatus } = body;

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found." }, { status: 404 });
    }

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(verificationStatus && { verificationStatus }),
      },
      include: {
        worker: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // If job is completed and verified, update trust scores
    if (updatedJob.status === "COMPLETED" && updatedJob.verificationStatus === "FULLY_VERIFIED") {
      const latestTrust = await prisma.trustScoreSnapshot.findFirst({
        where: { workerId: updatedJob.workerId },
        orderBy: { computedAt: "desc" },
      });

      if (latestTrust) {
        await prisma.trustScoreSnapshot.update({
          where: { id: latestTrust.id },
          data: {
            verified: latestTrust.verified + 1,
            total: latestTrust.total + 1,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: "Job updated successfully.",
        job: updatedJob,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[jobs/[id] PATCH]", error);
    return NextResponse.json(
      { message: "Unable to update job right now." },
      { status: 500 }
    );
  }
}

