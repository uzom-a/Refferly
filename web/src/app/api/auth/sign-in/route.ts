import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { toAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const password = body.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { message: "No account found for that email. Please create one." },
        { status: 404 },
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
    }

    return NextResponse.json({ user: toAuthUser(user) }, { status: 200 });
  } catch (error) {
    console.error("[sign-in]", error);
    return NextResponse.json(
      { message: "Unable to sign you in right now. Please try again." },
      { status: 500 },
    );
  }
}

