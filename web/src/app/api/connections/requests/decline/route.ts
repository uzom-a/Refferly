import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestId = body.requestId as string | undefined;
    const userId = body.userId as string | undefined;

    if (!requestId || !userId) {
      return NextResponse.json(
        { message: "Request ID and user ID are required." },
        { status: 400 }
      );
    }

    const connectionRequest = await prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!connectionRequest) {
      return NextResponse.json({ message: "Connection request not found." }, { status: 404 });
    }

    if (connectionRequest.receiverId !== userId) {
      return NextResponse.json(
        { message: "You are not authorized to respond to this request." },
        { status: 403 }
      );
    }

    if (connectionRequest.status !== "PENDING") {
      return NextResponse.json(
        { message: "This connection request has already been processed." },
        { status: 400 }
      );
    }

    await prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[connections/requests/decline POST]", error);
    return NextResponse.json(
      { message: "Unable to decline the connection request right now." },
      { status: 500 }
    );
  }
}

