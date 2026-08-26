import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { toAuthUser } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

const allowedRoles: UserRole[] = ["CLIENT", "WORKER"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const password = body.password as string | undefined;
    const name = (body.name as string | undefined)?.trim();
    const role = body.role as UserRole | undefined;

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { message: "Name, email, password, and role are required." },
        { status: 400 },
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role selected." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
      },
    });

    return NextResponse.json({ user: toAuthUser(user) }, { status: 201 });
  } catch (error) {
    console.error("[sign-up]", error);
    return NextResponse.json(
      { message: "Unable to create account right now. Please try again." },
      { status: 500 },
    );
  }
}

