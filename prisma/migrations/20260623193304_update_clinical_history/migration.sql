/*
  Warnings:

  - Added the required column `updatedAt` to the `ClinicalHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClinicalHistory" ADD COLUMN     "data" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "diagnosis" DROP NOT NULL;
