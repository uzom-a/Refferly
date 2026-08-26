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

    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Client profile not found." },
        { status: 404 },
      );
    }

    // Calculate stats
    // Number of people employed (unique workers from jobs)
    const allJobs = await prisma.job.findMany({
      where: { clientId: profile.id },
      select: { workerId: true },
    });
    const uniqueWorkerIds = new Set(allJobs.map((job) => job.workerId));
    const peopleEmployed = uniqueWorkerIds.size;

    // Number of jobs posted
    const jobsPosted = await prisma.job.count({
      where: { clientId: profile.id },
    });

    // Employee reviews (reviews written by this client)
    const employeeReviews = await prisma.review.count({
      where: { reviewerId: profile.id },
    });

    // People connected (same as people employed - unique workers)
    const peopleConnected = peopleEmployed;

    // Workers vouching (reviews where this client is the referrer)
    const workersVouching = await prisma.review.count({
      where: { referrerId: profile.id },
    });

    // Reviews written (same as employee reviews)
    const reviewsWritten = employeeReviews;

    return NextResponse.json(
      {
        profile,
        stats: {
          peopleEmployed,
          jobsPosted,
          employeeReviews,
          peopleConnected,
          workersVouching,
          reviewsWritten,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[client-profile GET]", error);
    return NextResponse.json(
      { message: "Unable to fetch client profile. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId as string | undefined;
    const name = (body.name as string | undefined)?.trim();
    const city = (body.city as string | undefined)?.trim();
    const area = (body.area as string | undefined)?.trim();
    const state = (body.state as string | undefined)?.trim() ?? null;
    const country = (body.country as string | undefined)?.trim() ?? null;
    const fullAddress = (body.fullAddress as string | undefined)?.trim();
    const latitude = typeof body.latitude === "number" ? body.latitude : null;
    const longitude = typeof body.longitude === "number" ? body.longitude : null;

    if (!userId || !name || !city || !area || !fullAddress || latitude === null || longitude === null) {
      return NextResponse.json(
        { message: "User ID, name, and a valid location are required." },
        { status: 400 },
      );
    }

    // Verify user exists and is a CLIENT
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.role !== "CLIENT") {
      return NextResponse.json(
        { message: "Only clients can create client profiles." },
        { status: 403 },
      );
    }

    // Check if profile already exists
    const existing = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    const profileData = {
      name,
      city,
      area,
      state,
      country,
      fullAddress,
      latitude,
      longitude,
    };

    const profile = await prisma.$transaction(async (tx) => {
      const savedProfile = existing
        ? await tx.clientProfile.update({
            where: { userId },
            data: profileData,
          })
        : await tx.clientProfile.create({
            data: {
              userId,
              ...profileData,
            },
          });

      if (user.name !== name) {
        await tx.user.update({
          where: { id: userId },
          data: { name },
        });
      }

      return savedProfile;
    });

    return NextResponse.json({ profile }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("[client-profile POST]", error);
    return NextResponse.json(
      { message: "Unable to save client profile. Please try again." },
      { status: 500 },
    );
  }
}

