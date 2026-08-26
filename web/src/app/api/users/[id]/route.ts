import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, context: RouteParams) {
  try {
    const params = context?.params ? await context.params : null;

    if (!params?.id) {
      return NextResponse.json({ message: "User id is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: toAuthUser(user) }, { status: 200 });
  } catch (error) {
    console.error("[users/id]", error);
    return NextResponse.json(
      { message: "Unable to load the requested user." },
      { status: 500 },
    );
  }
}

