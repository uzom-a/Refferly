import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Check if Marvellous already exists
    const existing = await prisma.user.findUnique({
      where: { email: "marvellous@example.com" },
      include: { workerProfile: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Marvellous user already exists." },
        { status: 200 },
      );
    }

    // Create Marvellous user
    const passwordHash = await bcrypt.hash("password123", 12);
    const user = await prisma.user.create({
      data: {
        email: "marvellous@example.com",
        name: "Marvellous",
        passwordHash,
        role: "WORKER",
      },
    });

    // Create worker profile with sample data
    const workerProfile = await prisma.workerProfile.create({
      data: {
        userId: user.id,
        name: "Marvellous",
        trade: "Electrician",
        city: "Lagos",
        area: "Ikeja",
        skills: ["Electrical repair", "Wiring", "Installation"] as Prisma.InputJsonValue,
        radiusKm: 10,
      },
    });

    // Create trust score snapshot (matching sample data: total 82)
    await prisma.trustScoreSnapshot.create({
      data: {
        workerId: workerProfile.id,
        total: 82,
        sentiment: 36,
        referrals: 44,
        verified: 20,
        freshness: 85,
      },
    });

    // Create some sample jobs (3 verified jobs)
    const clientUser = await prisma.user.upsert({
      where: { email: "client1@example.com" },
      update: {},
      create: {
        email: "client1@example.com",
        name: "Test Client",
        passwordHash: await bcrypt.hash("password123", 12),
        role: "CLIENT",
      },
    });

    const clientProfile = await prisma.clientProfile.upsert({
      where: { userId: clientUser.id },
      update: {},
      create: {
        userId: clientUser.id,
        name: "Test Client",
        city: "Lagos",
        area: "Ikeja",
      },
    });

    // Create 3 verified jobs and store them
    const createdJobs = [];
    for (let i = 0; i < 3; i++) {
      const job = await prisma.job.create({
        data: {
          workerId: workerProfile.id,
          clientId: clientProfile.id,
          title: `Job ${i + 1}`,
          description: `Sample verified job ${i + 1}`,
          city: "Lagos",
          area: "Ikeja",
          status: "COMPLETED",
          verificationStatus: "FULLY_VERIFIED",
        },
      });
      createdJobs.push(job);
    }

    // Create 5 referral-based reviews (reuse jobs)
    for (let i = 0; i < 5; i++) {
      const job = createdJobs[i % createdJobs.length]; // Cycle through jobs
      await prisma.review.create({
        data: {
          jobId: job.id,
          reviewerId: clientProfile.id,
          revieweeId: workerProfile.id,
          authorId: clientUser.id,
          text: `Great work on job ${(i % createdJobs.length) + 1}!`,
          punctuality: 5,
          communication: 4,
          pricingFairness: 4,
          skill: 5,
          sentimentScore: 0.8,
          isReferralBased: true,
          visibility: "PUBLIC",
        },
      });
    }

    return NextResponse.json(
      {
        message: "Marvellous user and data initialized successfully.",
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[seed-marvellous]", error);
    return NextResponse.json(
      { message: "Unable to initialize Marvellous data. Please try again." },
      { status: 500 },
    );
  }
}

