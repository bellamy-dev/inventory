-- AlterTable
ALTER TABLE "ItemType" RENAME COLUMN "buyPrice" TO "buyPrice_old";
ALTER TABLE "ItemType" RENAME COLUMN "sellPrice" TO "sellPrice_old";

CREATE TABLE "new_ItemType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "iconKey" TEXT,
    "categoryId" TEXT NOT NULL,
    "rarityId" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 0,
    "buyPrice" REAL NOT NULL DEFAULT 0,
    "sellPrice" REAL NOT NULL DEFAULT 0,
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

INSERT INTO "new_ItemType" ("id", "name", "imageUrl", "iconKey", "categoryId", "rarityId", "weight", "buyPrice", "sellPrice", "unlimitedStock", "maxStock", "lowStockAlert", "harvestable", "harvestCommissionPercent", "createdAt", "updatedAt") SELECT "id", "name", "imageUrl", "iconKey", "categoryId", "rarityId", "weight", "buyPrice", "sellPrice", "unlimitedStock", "maxStock", "lowStockAlert", "harvestable", "harvestCommissionPercent", "createdAt", "updatedAt" FROM "ItemType";

DROP TABLE "ItemType";
ALTER TABLE "new_ItemType" RENAME TO "ItemType";

CREATE UNIQUE INDEX "ItemType_name_categoryId_key" ON "ItemType"("name", "categoryId");
