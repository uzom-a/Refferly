import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NetworkStats } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, role: true } },
        userB: { select: { id: true, role: true } },
      },
    });

    const uniqueConnections = new Set<string>();
    let workersVouching = 0;

    connections.forEach((connection) => {
      const otherUser =
        connection.userAId === userId ? connection.userB : connection.userA;
      if (otherUser?.id) {
        uniqueConnections.add(otherUser.id);
      }
      if (otherUser?.role === "WORKER") {
        workersVouching += 1;
      }
    });

    const reviewsWritten = await prisma.review.count({
      where: { authorId: userId },
    });

    const stats: NetworkStats = {
      peopleConnected: uniqueConnections.size,
      workersVouching,
      reviewsWritten,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("[network-stats GET]", error);
    return NextResponse.json(
      { message: "Unable to load network stats right now." },
      { status: 500 },
    );
  }
}


