-- CreateTable
CREATE TABLE "PassRenewal" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "renewalNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PassRenewal_vehicleId_idx" ON "PassRenewal"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "PassRenewal_vehicleId_renewalNumber_key" ON "PassRenewal"("vehicleId", "renewalNumber");

-- AddForeignKey
ALTER TABLE "PassRenewal" ADD CONSTRAINT "PassRenewal_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "VehicleRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
