-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CategoryProbability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "probability" REAL NOT NULL,
    "itemId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CategoryProbability_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "AuctionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategoryProbability_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuctionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "currentPrice" REAL,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "hardwareProbability" REAL,
    "mainCategoryId" TEXT,
    "auctionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuctionItem_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuctionItem_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuctionItem" ("auctionId", "bidCount", "createdAt", "currentPrice", "description", "hardwareProbability", "id", "imageUrl", "title", "updatedAt", "url") SELECT "auctionId", "bidCount", "createdAt", "currentPrice", "description", "hardwareProbability", "id", "imageUrl", "title", "updatedAt", "url" FROM "AuctionItem";
DROP TABLE "AuctionItem";
ALTER TABLE "new_AuctionItem" RENAME TO "AuctionItem";
CREATE UNIQUE INDEX "AuctionItem_url_key" ON "AuctionItem"("url");
CREATE INDEX "AuctionItem_auctionId_idx" ON "AuctionItem"("auctionId");
CREATE INDEX "AuctionItem_hardwareProbability_idx" ON "AuctionItem"("hardwareProbability");
CREATE INDEX "AuctionItem_mainCategoryId_idx" ON "AuctionItem"("mainCategoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "CategoryProbability_itemId_idx" ON "CategoryProbability"("itemId");

-- CreateIndex
CREATE INDEX "CategoryProbability_categoryId_idx" ON "CategoryProbability"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryProbability_itemId_categoryId_key" ON "CategoryProbability"("itemId", "categoryId");
