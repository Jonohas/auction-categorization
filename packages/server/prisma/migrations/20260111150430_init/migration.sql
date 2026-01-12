-- CreateTable
CREATE TABLE "Scraper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "hardwareProbability" REAL NOT NULL DEFAULT 0,
    "scraperId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Auction_scraperId_fkey" FOREIGN KEY ("scraperId") REFERENCES "Scraper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuctionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "currentPrice" REAL,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "hardwareProbability" REAL NOT NULL DEFAULT 0,
    "auctionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuctionItem_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Scraper_url_key" ON "Scraper"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_url_key" ON "Auction"("url");

-- CreateIndex
CREATE INDEX "Auction_scraperId_idx" ON "Auction"("scraperId");

-- CreateIndex
CREATE INDEX "Auction_hardwareProbability_idx" ON "Auction"("hardwareProbability");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionItem_url_key" ON "AuctionItem"("url");

-- CreateIndex
CREATE INDEX "AuctionItem_auctionId_idx" ON "AuctionItem"("auctionId");

-- CreateIndex
CREATE INDEX "AuctionItem_hardwareProbability_idx" ON "AuctionItem"("hardwareProbability");
