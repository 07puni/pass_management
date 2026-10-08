/*
  Warnings:

  - You are about to drop the column `initialEndDate` on the `VehicleRecord` table. All the data in the column will be lost.
  - You are about to drop the column `initialStartDate` on the `VehicleRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VehicleRecord" DROP COLUMN "initialEndDate",
DROP COLUMN "initialStartDate";
