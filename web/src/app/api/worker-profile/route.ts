import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    const profile = await prisma.workerProfile.findUnique({
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
        { message: "Worker profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("[worker-profile GET]", error);
    return NextResponse.json(
      { message: "Unable to fetch worker profile. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId as string | undefined;
    const name = (body.name as string | undefined)?.trim();
    const trade = (body.trade as string | undefined)?.trim();
    const city = (body.city as string | undefined)?.trim();
    const area = (body.area as string | undefined)?.trim();
    const state = (body.state as string | undefined)?.trim() ?? null;
    const country = (body.country as string | undefined)?.trim() ?? null;
    const fullAddress = (body.fullAddress as string | undefined)?.trim();
    const latitude = typeof body.latitude === "number" ? body.latitude : null;
    const longitude = typeof body.longitude === "number" ? body.longitude : null;
    const bio = (body.bio as string | undefined)?.trim() || null;
    const skills = body.skills as string[] | undefined;
    const radiusKm = body.radiusKm as number | undefined;

    if (!userId || !name || !trade || !city || !area || !fullAddress || latitude === null || longitude === null) {
      return NextResponse.json(
        { message: "Complete location details (city, area, address, coordinates) are required." },
        { status: 400 },
      );
    }

    // Verify user exists and is a WORKER
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.role !== "WORKER") {
      return NextResponse.json(
        { message: "Only workers can create worker profiles." },
        { status: 403 },
      );
    }

    // Check if profile already exists
    const existing = await prisma.workerProfile.findUnique({
      where: { userId },
    });

    const profileData: {
      name: string;
      trade: string;
      city: string;
      area: string;
      state: string | null;
      country: string | null;
      fullAddress: string;
      latitude: number;
      longitude: number;
      bio: string | null;
      skills?: Prisma.InputJsonValue;
      radiusKm: number | null;
    } = {
      name,
      trade,
      city,
      area,
      state,
      country,
      fullAddress,
      latitude,
      longitude,
      bio,
      radiusKm: radiusKm || null,
    };

    // Only include skills if it has values, otherwise omit it (undefined)
    if (skills && skills.length > 0) {
      profileData.skills = skills as Prisma.InputJsonValue;
    }

    const profile = await prisma.$transaction(async (tx) => {
      const savedProfile = existing
        ? await tx.workerProfile.update({
            where: { userId },
            data: profileData,
          })
        : await tx.workerProfile.create({
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
    console.error("[worker-profile]", error);
    return NextResponse.json(
      { message: "Unable to save worker profile. Please try again." },
      { status: 500 },
    );
  }
}

