-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Admin" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRecord" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "vehicleNumber" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastReminderSentAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "VehicleRecord_name_idx" ON "VehicleRecord"("name");

-- CreateIndex
CREATE INDEX "VehicleRecord_vehicleNumber_idx" ON "VehicleRecord"("vehicleNumber");

-- CreateIndex
CREATE INDEX "VehicleRecord_phoneNumber_idx" ON "VehicleRecord"("phoneNumber");

-- CreateIndex
CREATE INDEX "VehicleRecord_email_idx" ON "VehicleRecord"("email");

-- CreateIndex
CREATE INDEX "VehicleRecord_status_idx" ON "VehicleRecord"("status");

-- CreateIndex
CREATE INDEX "VehicleRecord_endDate_idx" ON "VehicleRecord"("endDate");
