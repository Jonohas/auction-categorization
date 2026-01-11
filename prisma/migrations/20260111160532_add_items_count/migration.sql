-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Auction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "hardwareProbability" REAL,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "scraperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Auction_scraperId_fkey" FOREIGN KEY ("scraperId") REFERENCES "Scraper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Auction" ("createdAt", "description", "endDate", "hardwareProbability", "id", "scraperId", "startDate", "title", "updatedAt", "url") SELECT "createdAt", "description", "endDate", "hardwareProbability", "id", "scraperId", "startDate", "title", "updatedAt", "url" FROM "Auction";
DROP TABLE "Auction";
ALTER TABLE "new_Auction" RENAME TO "Auction";
CREATE UNIQUE INDEX "Auction_url_key" ON "Auction"("url");
CREATE INDEX "Auction_scraperId_idx" ON "Auction"("scraperId");
CREATE INDEX "Auction_hardwareProbability_idx" ON "Auction"("hardwareProbability");
CREATE TABLE "new_AuctionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "currentPrice" REAL,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "hardwareProbability" REAL,
    "auctionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuctionItem_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuctionItem" ("auctionId", "bidCount", "createdAt", "currentPrice", "description", "hardwareProbability", "id", "imageUrl", "title", "updatedAt", "url") SELECT "auctionId", "bidCount", "createdAt", "currentPrice", "description", "hardwareProbability", "id", "imageUrl", "title", "updatedAt", "url" FROM "AuctionItem";
DROP TABLE "AuctionItem";
ALTER TABLE "new_AuctionItem" RENAME TO "AuctionItem";
CREATE UNIQUE INDEX "AuctionItem_url_key" ON "AuctionItem"("url");
CREATE INDEX "AuctionItem_auctionId_idx" ON "AuctionItem"("auctionId");
CREATE INDEX "AuctionItem_hardwareProbability_idx" ON "AuctionItem"("hardwareProbability");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
