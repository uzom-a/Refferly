import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/jobs - Get jobs for a user (client or worker)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role"); // "CLIENT" or "WORKER"

    if (!userId || !role) {
      return NextResponse.json(
        { message: "User ID and role are required." },
        { status: 400 }
      );
    }

    if (role === "CLIENT") {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId },
      });

      if (!clientProfile) {
        return NextResponse.json(
          { message: "Client profile not found." },
          { status: 404 }
        );
      }

      const jobs = await prisma.job.findMany({
        where: { clientId: clientProfile.id },
        include: {
          worker: {
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
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ jobs }, { status: 200 });
    } else if (role === "WORKER") {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId },
      });

      if (!workerProfile) {
        return NextResponse.json(
          { message: "Worker profile not found." },
          { status: 404 }
        );
      }

      const jobs = await prisma.job.findMany({
        where: { workerId: workerProfile.id },
        include: {
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
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ jobs }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Invalid role." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[jobs GET]", error);
    return NextResponse.json(
      { message: "Unable to load jobs." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs - Create a new job offer
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clientUserId,
      workerId,
      title,
      description,
      city,
      area,
    } = body;

    if (!clientUserId || !workerId || !title) {
      return NextResponse.json(
        { message: "Client user ID, worker ID, and title are required." },
        { status: 400 }
      );
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: clientUserId },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { message: "Client profile not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id: workerId },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { message: "Worker not found." },
        { status: 404 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        workerId: workerProfile.id,
        clientId: clientProfile.id,
        title,
        description: description || null,
        city: city || clientProfile.city || workerProfile.city,
        area: area || clientProfile.area || workerProfile.area,
        status: "PENDING", // Job starts as pending
        verificationStatus: "UNVERIFIED",
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

    // Automatically create a connection between client and worker when a job is created
    const [userAId, userBId] = clientUserId < workerProfile.userId
      ? [clientUserId, workerProfile.userId]
      : [workerProfile.userId, clientUserId];

    // Check if connection already exists
    const existingConnection = await prisma.connection.findUnique({
      where: {
        userAId_userBId: {
          userAId,
          userBId,
        },
      },
    });

    if (!existingConnection) {
      // Create connection automatically
      await prisma.connection.create({
        data: {
          userAId,
          userBId,
        },
      });

      // Also accept any pending connection requests between them
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
    }

    return NextResponse.json(
      {
        message: "Job offer created successfully.",
        job: {
          id: job.id,
          title: job.title,
          status: job.status,
          worker: {
            name: job.worker.user.name,
          },
          client: {
            name: job.client.user.name,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[jobs POST]", error);
    return NextResponse.json(
      { message: "Unable to create job offer right now." },
      { status: 500 }
    );
  }
}

