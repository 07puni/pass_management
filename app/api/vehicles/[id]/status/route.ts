import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const vehicle = await prisma.vehicleRecord.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    if (body.status === "SUSPENDED") {
      const updated = await prisma.vehicleRecord.update({
        where: { id },
        data: {
          status: "SUSPENDED",
          suspendedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        vehicle: updated,
      });
    }

    if (body.status === "ACTIVE") {
      const updated = await prisma.vehicleRecord.update({
        where: { id },
        data: {
          status: "ACTIVE",
          suspendedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        vehicle: updated,
      });
    }

    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Status update error:", error);

    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}