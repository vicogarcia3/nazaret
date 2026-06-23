/*
  Warnings:

  - Made the column `branchId` on table `Patient` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_branchId_fkey";

-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
