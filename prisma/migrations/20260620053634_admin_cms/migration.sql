/*
  Warnings:

  - You are about to drop the column `aboutText` on the `SiteConfig` table. All the data in the column will be lost.
  - Added the required column `clinicName` to the `SiteConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mapUrl" TEXT;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "price" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SiteConfig" DROP COLUMN "aboutText",
ADD COLUMN     "clinicName" TEXT NOT NULL,
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "logo" TEXT,
ALTER COLUMN "whatsapp" DROP NOT NULL;
