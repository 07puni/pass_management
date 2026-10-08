import { NextRequest, NextResponse } from "next/server";
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

export async function POST(
  request: NextRequest,
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

    const body = await request.json();

    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Renewal start date and end date are required",
        },
        { status: 400 }
      );
    }

    const renewalStartDate = new Date(startDate);
    const renewalEndDate = new Date(endDate);

    if (
      Number.isNaN(renewalStartDate.getTime()) ||
      Number.isNaN(renewalEndDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid renewal dates" },
        { status: 400 }
      );
    }

    if (renewalEndDate < renewalStartDate) {
      return NextResponse.json(
        {
          error:
            "Renewal end date cannot be before start date",
        },
        { status: 400 }
      );
    }

    const vehicle =
      await prisma.vehicleRecord.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              renewals: true,
            },
          },
        },
      });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Pass not found" },
        { status: 404 }
      );
    }

    const renewalNumber =
      vehicle._count.renewals + 1;

    const result = await prisma.$transaction(
      async (tx) => {
        const renewal =
          await tx.passRenewal.create({
            data: {
              vehicleId: vehicle.id,
              renewalNumber,
              startDate: renewalStartDate,
              endDate: renewalEndDate,
            },
          });

        const updatedVehicle =
          await tx.vehicleRecord.update({
            where: {
              id: vehicle.id,
            },
            data: {
              startDate: renewalStartDate,
              endDate: renewalEndDate,
              status: "ACTIVE",
              suspendedAt: null,
              lastReminderSentAt: null,
            },
          });

        return {
          renewal,
          vehicle: updatedVehicle,
        };
      }
    );

    return NextResponse.json(
      {
        success: true,
        renewal: result.renewal,
        vehicle: result.vehicle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add renewal error:", error);

    return NextResponse.json(
      { error: "Failed to add renewal" },
      { status: 500 }
    );
  }
}