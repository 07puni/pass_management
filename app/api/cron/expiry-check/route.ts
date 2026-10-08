import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendExpiryReminder } from "@/lib/email/resend";

function getDateOnly(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret =
      process.env.CRON_SECRET;

    if (cronSecret) {
      const authorization =
        request.headers.get("authorization");

      if (
        authorization !==
        `Bearer ${cronSecret}`
      ) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const today = getDateOnly(new Date());

    const targetDate = new Date(today);
    targetDate.setDate(
      targetDate.getDate() + 2
    );

    const startOfTargetDay = targetDate;

    const endOfTargetDay = new Date(targetDate);
    endOfTargetDay.setHours(23, 59, 59, 999);

    const vehicles =
      await prisma.vehicleRecord.findMany({
        where: {
          status: {
            not: "SUSPENDED",
          },
          endDate: {
            gte: startOfTargetDay,
            lte: endOfTargetDay,
          },
        },
      });

    let sent = 0;
    let failed = 0;

    for (const vehicle of vehicles) {
      try {
        // Prevent duplicate reminder on the same day.
        if (
          vehicle.lastReminderSentAt
        ) {
          const lastReminderDate =
            getDateOnly(
              vehicle.lastReminderSentAt
            );

          if (
            lastReminderDate.getTime() ===
            today.getTime()
          ) {
            continue;
          }
        }

        await sendExpiryReminder({
          name: vehicle.name,
          vehicleNumber:
            vehicle.vehicleNumber,
          phoneNumber:
            vehicle.phoneNumber,
          endDate: vehicle.endDate,
        });

        await prisma.vehicleRecord.update({
          where: {
            id: vehicle.id,
          },
          data: {
            lastReminderSentAt:
              new Date(),
          },
        });

        sent++;
      } catch (error) {
        console.error(
          `Failed to send reminder for ${vehicle.id}:`,
          error
        );

        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: vehicles.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error(
      "Expiry check failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Expiry check failed",
      },
      { status: 500 }
    );
  }
}
