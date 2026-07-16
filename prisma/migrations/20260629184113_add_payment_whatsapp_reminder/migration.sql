-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "whatsappReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappReminderSentAt" TIMESTAMP(3);
