import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const AUTH_SECRET = process.env.AUTH_SECRET!;

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return false;

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(AUTH_SECRET)
    );

    return true;
  } catch {
    return false;
  }
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    const renewals =
      await prisma.passRenewal.findMany({
        where: {
          vehicleId: id,
        },
        orderBy: {
          renewalNumber: "desc",
        },
      });

    return NextResponse.json(renewals);
  } catch (error) {
    console.error(
      "Get renewal history error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch renewal history" },
      { status: 500 }
    );
  }
}