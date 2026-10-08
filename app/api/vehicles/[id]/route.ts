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

// Renewal
export async function PUT(
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

    const existing = await prisma.vehicleRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    const vehicle = await prisma.vehicleRecord.update({
      where: { id },
      data: {
        name:
          body.name !== undefined
            ? body.name?.trim() || null
            : existing.name,

        vehicleNumber:
          body.vehicleNumber !== undefined
            ? body.vehicleNumber?.trim() || null
            : existing.vehicleNumber,

        phoneNumber:
          body.phoneNumber !== undefined
            ? body.phoneNumber?.trim() || null
            : existing.phoneNumber,

        email:
          body.email !== undefined
            ? body.email?.trim() || null
            : existing.email,

        startDate:
          body.startDate !== undefined
            ? body.startDate
              ? new Date(body.startDate)
              : null
            : existing.startDate,

        endDate:
          body.endDate !== undefined
            ? body.endDate
              ? new Date(body.endDate)
              : null
            : existing.endDate,

        // Renewal starts a fresh reminder cycle
        lastReminderSentAt: null,

        // Renewing also activates the record
        status: "ACTIVE",

        suspendedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      vehicle,
    });
  } catch (error) {
    console.error("Renewal error:", error);

    return NextResponse.json(
      { error: "Failed to renew record" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
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

    const existing = await prisma.vehicleRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    await prisma.vehicleRecord.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete error:", error);

    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}