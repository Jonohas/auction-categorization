import { scraperFactory } from "../scrapers";
import { loadConfig, getScrapersFromConfig } from "../lib/config";
import { db } from "../db/db";
import { scrapers, auctions, auctionItem } from "../db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { eq, desc } from "drizzle-orm";

type Scraper = InferSelectModel<typeof scrapers>;

export interface ScrapeResult {
  success: boolean;
  scraperId: string;
  auctionsFound: number;
  auctionsCreated: number;
  error?: string;
}

export async function initializeScrapersFromConfig(): Promise<void> {
  const configScrapers = getScrapersFromConfig();

  for (const configScraper of configScrapers) {
    try {
      // Check if scraper already exists
      const existingScraper = await db.select().from(scrapers).where(eq(scrapers.url, configScraper.url)).limit(1);

      if (existingScraper.length === 0) {
        // Create new scraper from config
        await db.insert(scrapers).values({
          url: configScraper.url,
          name: configScraper.name,
          image_url: configScraper.image_url,
          enabled: configScraper.enabled,
        });
        console.log(`Initialized scraper: ${configScraper.name}`);
      }
    } catch (error) {
      console.error(`Error initializing scraper ${configScraper.name}:`, error);
    }
  }
}

export async function scrapeWebsite(scraperId: string): Promise<ScrapeResult> {
  const scraperConfigs = await db.select().from(scrapers).where(eq(scrapers.id, parseInt(scraperId))).limit(1);
  const scraperConfig = scraperConfigs[0];

  if (!scraperConfig || !scraperConfig.url) {
    return {
      success: false,
      scraperId,
      auctionsFound: 0,
      auctionsCreated: 0,
      error: "Scraper not found or invalid URL",
    };
  }

  try {
    const scraper = scraperFactory.getScraper(scraperConfig.url);
    const scrapedAuctions = await scraper.scrape(scraperConfig.url);

    let auctionsCreated = 0;

    for (const auction of scrapedAuctions) {
      // Check if auction already exists
      const existingAuctions = await db.select().from(auctions).where(eq(auctions.url, auction.url)).limit(1);
      const existing = existingAuctions[0];

      if (existing) {
        // Update existing auction
        const itemsCount = auction.items.length.toString();
        await db.update(auctions).set({
          title: auction.title,
          description: auction.description,
          startDate: auction.startDate,
          endDate: auction.endDate,
          itemsCount,
        }).where(eq(auctions.id, existing.id));

        // Scrape new items for this auction
        if (auction.items.length > 0) {
          for (const item of auction.items) {
            await db.insert(auctionItem).values({
              url: item.url,
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl,
              currentPrice: item.currentPrice,
              bidCount: item.bidCount || 0,
              auctionId: existing.id,
            }).onConflictDoUpdate({
              target: auctionItem.url,
              set: {
                title: item.title,
                description: item.description,
                imageUrl: item.imageUrl,
                currentPrice: item.currentPrice,
                bidCount: item.bidCount || 0,
              }
            });
          }
        }
        continue;
      }

      // Create the auction
      const newAuctionResult = await db.insert(auctions).values({
        url: auction.url,
        title: auction.title,
        description: auction.description,
        startDate: auction.startDate,
        endDate: auction.endDate,
        itemsCount: auction.items.length.toString(),
        scraperId: scraperConfig.id,
      }).returning({ id: auctions.id });

      const newAuction = newAuctionResult[0];

      if (!newAuction) {
        console.error("Failed to create auction");
        continue;
      }

      // Scrape items for this auction
      if (auction.items.length > 0) {
        for (const item of auction.items) {
          await db.insert(auctionItem).values({
            url: item.url,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            currentPrice: item.currentPrice,
            bidCount: item.bidCount || 0,
            auctionId: newAuction.id,
          });
        }
      }

      auctionsCreated++;
    }

    // Update scraper's updatedAt
    await db.update(scrapers).set({
      updatedAt: new Date(),
    }).where(eq(scrapers.id, parseInt(scraperId)));

    return {
      success: true,
      scraperId,
      auctionsFound: scrapedAuctions.length,
      auctionsCreated,
    };
  } catch (error) {
    console.error(`Error scraping scraper ${scraperId}:`, error);
    return {
      success: false,
      scraperId,
      auctionsFound: 0,
      auctionsCreated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function scrapeAllWebsites(): Promise<ScrapeResult[]> {
  // Initialize scrapers from config first
  await initializeScrapersFromConfig();

  const scraperRecords = await db.select().from(scrapers).where(eq(scrapers.enabled, true));
  const results: ScrapeResult[] = [];

  const config = loadConfig();
  const maxConcurrent = config.scraping.max_concurrent || 5;

  // Process scrapers in batches to respect concurrency limit
  for (let i = 0; i < scraperRecords.length; i += maxConcurrent) {
    const batch = scraperRecords.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map((s) => scrapeWebsite(s.id.toString())));
    results.push(...batchResults);
  }

  return results;
}

export async function getScrapers(): Promise<Scraper[]> {
  return await db.select().from(scrapers).orderBy(desc(scrapers.createdAt));
}

export async function triggerScraperScrape(scraperId: string): Promise<ScrapeResult> {
  return await scrapeWebsite(scraperId);
}

export async function enableScraper(scraperId: string): Promise<boolean> {
  try {
    await db.update(scrapers).set({
      enabled: true,
    }).where(eq(scrapers.id, parseInt(scraperId)));
    return true;
  } catch {
    return false;
  }
}

export async function disableScraper(scraperId: string): Promise<boolean> {
  try {
    await db.update(scrapers).set({
      enabled: false,
    }).where(eq(scrapers.id, parseInt(scraperId)));
    return true;
  } catch {
    return false;
  }
}
