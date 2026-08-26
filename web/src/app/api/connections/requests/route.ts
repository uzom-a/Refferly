import { NextResponse } from "next/server";
import type {
  ClientProfile,
  ConnectionRequest as PrismaConnectionRequest,
  TrustScoreSnapshot,
  WorkerProfile,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ConnectionProfileSummary,
  ConnectionRequestLists,
  ConnectionRequestStatus,
  WorkerSummary,
} from "@/lib/types";

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}

type ProfiledUser = {
  id: string;
  name: string;
  role: "WORKER" | "CLIENT";
  workerProfile: (WorkerProfile & { trustScores: TrustScoreSnapshot[] }) | null;
  clientProfile: ClientProfile | null;
};

function buildWorkerSummary(user: ProfiledUser): WorkerSummary {
  if (user.workerProfile) {
    const trustSnapshot = user.workerProfile.trustScores?.[0];
    return {
      id: user.workerProfile.id,
      name: user.workerProfile.name,
      trade: user.workerProfile.trade,
      city: user.workerProfile.city,
      area: user.workerProfile.area,
      locationLabel: `${user.workerProfile.area}, ${user.workerProfile.city}`,
      trust: {
        total: trustSnapshot?.total ?? 0,
        sentiment: trustSnapshot?.sentiment ?? 0,
        referrals: trustSnapshot?.referrals ?? 0,
        verified: trustSnapshot?.verified ?? 0,
      },
      sentimentTags: toStringArray(user.workerProfile.skills ?? undefined),
    };
  }

  const fallbackCity = user.clientProfile?.city ?? "Unknown city";
  const fallbackArea = user.clientProfile?.area ?? "Unknown area";

  return {
    id: user.clientProfile?.id ?? user.id,
    name: user.name,
    trade: user.role === "CLIENT" ? "Client" : "Worker",
    city: fallbackCity,
    area: fallbackArea,
    locationLabel: `${fallbackArea}, ${fallbackCity}`,
    trust: {
      total: 0,
      sentiment: 0,
      referrals: 0,
      verified: 0,
    },
    sentimentTags: [],
  };
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function mapRequests(
  requests: (PrismaConnectionRequest & {
    sender?: ProfiledUser | null;
    receiver?: ProfiledUser | null;
  })[],
  target: "sender" | "receiver",
): ConnectionProfileSummary[] {
  return requests
    .map((request) => {
      const targetUser = request[target];
      if (!targetUser) {
        return null;
      }

      return {
        requestId: request.id,
        userId: targetUser.id,
        status: request.status as ConnectionRequestStatus,
        summary: buildWorkerSummary(targetUser),
      };
    })
    .filter((entry): entry is ConnectionProfileSummary => Boolean(entry));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const [sentRequests, receivedRequests] = await Promise.all([
      prisma.connectionRequest.findMany({
        where: { senderId: userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
          receiver: {
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
      }),
      prisma.connectionRequest.findMany({
        where: { receiverId: userId, status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
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
      }),
    ]);

    const response: ConnectionRequestLists = {
      sent: mapRequests(sentRequests, "receiver"),
      received: mapRequests(receivedRequests, "sender"),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[connections/requests GET]", error);
    return NextResponse.json(
      { message: "Unable to load connection requests right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const senderId = body.senderId as string | undefined;
    const receiverId = body.receiverId as string | undefined;

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { message: "Sender ID and receiver ID are required." },
        { status: 400 },
      );
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { message: "You cannot send a connection request to yourself." },
        { status: 400 },
      );
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: [senderId, receiverId] },
      },
      select: { id: true },
    });

    if (users.length !== 2) {
      return NextResponse.json(
        { message: "One of the users could not be found." },
        { status: 404 },
      );
    }

    const [userAId, userBId] = normalizePair(senderId, receiverId);
    const existingConnection = await prisma.connection.findUnique({
      where: {
        userAId_userBId: {
          userAId,
          userBId,
        },
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        { message: "You are already connected with this user." },
        { status: 409 },
      );
    }

    const existingRequest = await prisma.connectionRequest.findFirst({
      where: {
        status: "PENDING",
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: "A pending connection request already exists between you two." },
        { status: 409 },
      );
    }

    const requestRecord = await prisma.connectionRequest.create({
      data: {
        senderId,
        receiverId,
      },
    });

    return NextResponse.json({ requestId: requestRecord.id }, { status: 201 });
  } catch (error) {
    console.error("[connections/requests POST]", error);
    return NextResponse.json(
      { message: "Unable to send connection request right now." },
      { status: 500 },
    );
  }
}


