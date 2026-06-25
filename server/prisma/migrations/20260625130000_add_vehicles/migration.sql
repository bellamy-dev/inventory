-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxWeight" REAL NOT NULL DEFAULT 1000,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VehicleStockItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "itemTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleStockItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VehicleStockItem_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_name_key" ON "Vehicle"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleStockItem_vehicleId_itemTypeId_key" ON "VehicleStockItem"("vehicleId", "itemTypeId");
