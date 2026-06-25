-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HarvestEntry" (
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
    CONSTRAINT "HarvestEntry_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HarvestEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HarvestEntry_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_HarvestEntry" ("commissionPercent", "createdAt", "id", "itemTypeId", "payoutAmount", "quantity", "reviewedAt", "reviewedById", "status", "totalValue", "userId") SELECT "commissionPercent", "createdAt", "id", "itemTypeId", "payoutAmount", "quantity", "reviewedAt", "reviewedById", "status", "totalValue", "userId" FROM "HarvestEntry";
DROP TABLE "HarvestEntry";
ALTER TABLE "new_HarvestEntry" RENAME TO "HarvestEntry";
CREATE TABLE "new_ItemType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "iconKey" TEXT,
    "categoryId" TEXT NOT NULL,
    "rarityId" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 0,
    "buyPrice" INTEGER NOT NULL DEFAULT 0,
    "sellPrice" INTEGER NOT NULL DEFAULT 0,
    "unlimitedStock" BOOLEAN NOT NULL DEFAULT false,
    "maxStock" INTEGER,
    "lowStockAlert" INTEGER,
    "harvestable" BOOLEAN NOT NULL DEFAULT false,
    "harvestCommissionPercent" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemType_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ItemType" ("buyPrice", "categoryId", "createdAt", "harvestCommissionPercent", "iconKey", "id", "imageUrl", "lowStockAlert", "maxStock", "name", "rarityId", "sellPrice", "unlimitedStock", "updatedAt", "weight") SELECT "buyPrice", "categoryId", "createdAt", "harvestCommissionPercent", "iconKey", "id", "imageUrl", "lowStockAlert", "maxStock", "name", "rarityId", "sellPrice", "unlimitedStock", "updatedAt", "weight" FROM "ItemType";
DROP TABLE "ItemType";
ALTER TABLE "new_ItemType" RENAME TO "ItemType";
CREATE UNIQUE INDEX "ItemType_name_categoryId_key" ON "ItemType"("name", "categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
