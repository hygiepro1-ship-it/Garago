/*
  Warnings:

  - You are about to drop the column `calendlyEventUri` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `calcomLink` on the `Garage` table. All the data in the column will be lost.
  - You are about to drop the column `calendlyToken` on the `Garage` table. All the data in the column will be lost.
  - You are about to drop the column `calendlyUserUri` on the `Garage` table. All the data in the column will be lost.
  - You are about to drop the column `calendlyWebhookUri` on the `Garage` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garageId" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "vehicleYear" INTEGER,
    "vehicleMake" TEXT,
    "vehicleModel" TEXT,
    "serviceName" TEXT,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'ONLINE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("createdAt", "customerEmail", "customerName", "customerPhone", "date", "endTime", "garageId", "id", "notes", "serviceName", "source", "startTime", "status", "updatedAt", "userId", "vehicleMake", "vehicleModel", "vehicleYear") SELECT "createdAt", "customerEmail", "customerName", "customerPhone", "date", "endTime", "garageId", "id", "notes", "serviceName", "source", "startTime", "status", "updatedAt", "userId", "vehicleMake", "vehicleModel", "vehicleYear" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE TABLE "new_Garage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "postalCode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "subscriptionEndAt" DATETIME,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "yearFounded" INTEGER,
    "employeeCount" INTEGER,
    "languages" TEXT,
    "openingHours" TEXT,
    "acceptsWalkIn" BOOLEAN NOT NULL DEFAULT true,
    "appointmentOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Garage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Garage" ("acceptsWalkIn", "address", "appointmentOnly", "city", "coverUrl", "createdAt", "description", "email", "employeeCount", "id", "languages", "latitude", "logoUrl", "longitude", "name", "openingHours", "ownerId", "phone", "postalCode", "province", "slug", "stripeCustomerId", "stripePriceId", "subscriptionEndAt", "subscriptionStatus", "updatedAt", "website", "yearFounded") SELECT "acceptsWalkIn", "address", "appointmentOnly", "city", "coverUrl", "createdAt", "description", "email", "employeeCount", "id", "languages", "latitude", "logoUrl", "longitude", "name", "openingHours", "ownerId", "phone", "postalCode", "province", "slug", "stripeCustomerId", "stripePriceId", "subscriptionEndAt", "subscriptionStatus", "updatedAt", "website", "yearFounded" FROM "Garage";
DROP TABLE "Garage";
ALTER TABLE "new_Garage" RENAME TO "Garage";
CREATE UNIQUE INDEX "Garage_ownerId_key" ON "Garage"("ownerId");
CREATE UNIQUE INDEX "Garage_slug_key" ON "Garage"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
