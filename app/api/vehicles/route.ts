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

function calculateStatus(
  endDate: Date | null,
  currentStatus: string
) {
  if (currentStatus === "SUSPENDED") {
    return "SUSPENDED";
  }

  if (!endDate) {
    return "ACTIVE";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(endDate);
  expiry.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diff < 0) {
    return "EXPIRED";
  }

  if (diff <= 2) {
    return "EXPIRING_SOON";
  }

  return "ACTIVE";
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const statusFilter =
      searchParams.get("status") || "ALL";

    const vehicles =
      await prisma.vehicleRecord.findMany({
        where: search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  vehicleNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phoneNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : undefined,

        include: {
          _count: {
            select: {
              renewals: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const result = vehicles.map((vehicle) => {
      const status = calculateStatus(
        vehicle.endDate,
        vehicle.status
      );

      return {
        id: vehicle.id,
        name: vehicle.name,
        vehicleNumber: vehicle.vehicleNumber,
        phoneNumber: vehicle.phoneNumber,
        startDate: vehicle.startDate,
        endDate: vehicle.endDate,
        status,
        renewalCount: vehicle._count.renewals,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      };
    });

    const filtered =
      statusFilter === "ALL"
        ? result
        : result.filter(
            (vehicle) =>
              vehicle.status === statusFilter
          );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error(
      "GET /api/vehicles ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch vehicles",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      name,
      vehicleNumber,
      phoneNumber,
      email,
      startDate,
      endDate,
    } = body;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date" },
        { status: 400 }
      );
    }

    if (end && Number.isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid end date" },
        { status: 400 }
      );
    }

    if (start && end && end < start) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.$transaction(async (tx) => {
      const createdVehicle = await tx.vehicleRecord.create({
        data: {
          name: name?.trim() || null,
          vehicleNumber: vehicleNumber?.trim() || null,
          phoneNumber: phoneNumber?.trim() || null,
          email: email?.trim() || null,
          startDate: start,
          endDate: end,
          status: "ACTIVE",
        },
      });

      // For manually created passes, the first validity
      // period is Renewal #1.
      if (start && end) {
        await tx.passRenewal.create({
          data: {
            vehicleId: createdVehicle.id,
            renewalNumber: 1,
            startDate: start,
            endDate: end,
          },
        });
      }

      return createdVehicle;
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create vehicle",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}