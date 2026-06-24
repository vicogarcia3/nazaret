-- CreateTable
CREATE TABLE "OdontogramCondition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdontogramCondition_pkey" PRIMARY KEY ("id")
);
