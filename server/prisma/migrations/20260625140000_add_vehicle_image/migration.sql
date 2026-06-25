-- CreateTable
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "maxWeight" REAL NOT NULL DEFAULT 300,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Vehicle" ("id", "name", "maxWeight", "position", "createdAt", "updatedAt")
SELECT "id", "name", "maxWeight", "position", "createdAt", "updatedAt" FROM "Vehicle";

DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";

CREATE UNIQUE INDEX "Vehicle_name_key" ON "Vehicle"("name");
