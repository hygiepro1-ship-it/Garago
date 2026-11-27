-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "calendlyEventUri" TEXT;

-- AlterTable
ALTER TABLE "Garage" ADD COLUMN "calendlyToken" TEXT;
ALTER TABLE "Garage" ADD COLUMN "calendlyUserUri" TEXT;
ALTER TABLE "Garage" ADD COLUMN "calendlyWebhookUri" TEXT;
