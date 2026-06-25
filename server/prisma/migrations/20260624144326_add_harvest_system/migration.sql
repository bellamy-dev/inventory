-- AlterTable
ALTER TABLE "ItemType" ADD COLUMN "harvestCommissionPercent" REAL;

-- CreateTable
CREATE TABLE "HarvestEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemTypeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "commissionPercent" REAL NOT NULL,
    "totalValue" REAL,
    "payoutAmount" REAL,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HarvestEntry_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HarvestEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HarvestEntry_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayoutHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paidById" TEXT NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayoutHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PayoutHistory_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "discordId" TEXT,
    "avatarUrl" TEXT,
    "roleId" TEXT NOT NULL,
    "harvestCommissionPercent" REAL,
    "pendingPayout" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "discordId", "id", "passwordHash", "roleId", "updatedAt", "username") SELECT "avatarUrl", "createdAt", "discordId", "id", "passwordHash", "roleId", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
CREATE TABLE "new_WebhookConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordUrl" TEXT,
    "saleEvents" BOOLEAN NOT NULL DEFAULT true,
    "itemEvents" BOOLEAN NOT NULL DEFAULT true,
    "harvestEvents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WebhookConfig" ("createdAt", "discordUrl", "id", "itemEvents", "saleEvents", "updatedAt") SELECT "createdAt", "discordUrl", "id", "itemEvents", "saleEvents", "updatedAt" FROM "WebhookConfig";
DROP TABLE "WebhookConfig";
ALTER TABLE "new_WebhookConfig" RENAME TO "WebhookConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
