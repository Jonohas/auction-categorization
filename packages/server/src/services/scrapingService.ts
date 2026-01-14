import { prisma } from "../lib/db";
import { scraperFactory } from "../scrapers";
import type { ScrapedAuction, ScrapedAuctionItem } from "../scrapers";
import { loadConfig, getScrapersFromConfig } from "../lib/config";
import type { Scraper } from "@prisma/client";

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
      const existingScraper = await prisma.scraper.findUnique({
        where: { url: configScraper.url },
      });

      if (!existingScraper) {
        // Create new scraper from config
        await prisma.scraper.create({
          data: {
            url: configScraper.url,
            name: configScraper.name,
            imageUrl: configScraper.image_url,
            enabled: configScraper.enabled,
          },
        });
        console.log(`Initialized scraper: ${configScraper.name}`);
      }
    } catch (error) {
      console.error(`Error initializing scraper ${configScraper.name}:`, error);
    }
  }
}

export async function scrapeWebsite(scraperId: string): Promise<ScrapeResult> {
  const scraperConfig = await prisma.scraper.findUnique({
    where: { id: scraperId },
  });

  if (!scraperConfig) {
    return {
      success: false,
      scraperId,
      auctionsFound: 0,
      auctionsCreated: 0,
      error: "Scraper not found",
    };
  }

  try {
    const scraper = scraperFactory.getScraper(scraperConfig.url);
    const scrapedAuctions = await scraper.scrape(scraperConfig.url);

    let auctionsCreated = 0;

    for (const auction of scrapedAuctions) {
      // Check if auction already exists
      const existing = await prisma.auction.findUnique({
        where: { url: auction.url },
      });

      if (existing) {
        // Update existing auction
        const itemsCount = auction.items.length;
        await prisma.auction.update({
          where: { id: existing.id },
          data: {
            title: auction.title,
            description: auction.description,
            startDate: auction.startDate,
            endDate: auction.endDate,
            itemsCount,
          },
        });

        // Scrape new items for this auction
        if (itemsCount > 0) {
          for (const item of auction.items) {
            // Check if item already exists by URL
            const existingItem = await prisma.auctionItem.findUnique({
              where: { url: item.url },
            });

            if (existingItem) {
              // Update existing item with new data
              await prisma.auctionItem.update({
                where: { id: existingItem.id },
                data: {
                  title: item.title,
                  description: item.description,
                  imageUrl: item.imageUrl,
                  currentPrice: item.currentPrice,
                  bidCount: item.bidCount || 0,
                  auctionId: existing.id,
                },
              });
            } else {
              // Create new item
              await prisma.auctionItem.create({
                data: {
                  url: item.url,
                  title: item.title,
                  description: item.description,
                  imageUrl: item.imageUrl,
                  currentPrice: item.currentPrice,
                  bidCount: item.bidCount || 0,
                  hardwareProbability: null,
                  auctionId: existing.id,
                },
              });
            }
          }
        }
        continue;
      }

      // Create the auction with null probability (will be calculated on demand)
      const newAuction = await prisma.auction.create({
        data: {
          url: auction.url,
          title: auction.title,
          description: auction.description,
          startDate: auction.startDate,
          endDate: auction.endDate,
          hardwareProbability: null,
          itemsCount: auction.items.length,
          scraperId: scraperConfig.id,
        },
      });

      // Scrape items for this auction (without probabilities)
      if (auction.items.length > 0) {
        for (const item of auction.items) {
          // Check if item already exists by URL
          const existingItem = await prisma.auctionItem.findUnique({
            where: { url: item.url },
          });

          if (existingItem) {
            // Update existing item (may have moved to a different auction)
            await prisma.auctionItem.update({
              where: { id: existingItem.id },
              data: {
                title: item.title,
                description: item.description,
                imageUrl: item.imageUrl,
                currentPrice: item.currentPrice,
                bidCount: item.bidCount || 0,
                auctionId: newAuction.id,
              },
            });
          } else {
            // Create new item
            await prisma.auctionItem.create({
              data: {
                url: item.url,
                title: item.title,
                description: item.description,
                imageUrl: item.imageUrl,
                currentPrice: item.currentPrice,
                bidCount: item.bidCount || 0,
                hardwareProbability: null,
                auctionId: newAuction.id,
              },
            });
          }
        }
      }

      auctionsCreated++;
    }

    // Update scraper's updatedAt
    await prisma.scraper.update({
      where: { id: scraperId },
      data: { updatedAt: new Date() },
    });

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

  const scrapers = await prisma.scraper.findMany({
    where: { enabled: true },
  });
  const results: ScrapeResult[] = [];

  const config = loadConfig();
  const maxConcurrent = config.scraping.max_concurrent || 5;

  // Process scrapers in batches to respect concurrency limit
  for (let i = 0; i < scrapers.length; i += maxConcurrent) {
    const batch = scrapers.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all((batch as { id: string }[]).map((s) => scrapeWebsite(s.id)));
    results.push(...batchResults);
  }

  return results;
}

export async function getScrapers(): Promise<Scraper[]> {
  return await prisma.scraper.findMany({
    include: {
      _count: {
        select: { auctions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function triggerScraperScrape(scraperId: string): Promise<ScrapeResult> {
  return await scrapeWebsite(scraperId);
}

export async function enableScraper(scraperId: string): Promise<boolean> {
  try {
    await prisma.scraper.update({
      where: { id: scraperId },
      data: { enabled: true },
    });
    return true;
  } catch {
    return false;
  }
}

export async function disableScraper(scraperId: string): Promise<boolean> {
  try {
    await prisma.scraper.update({
      where: { id: scraperId },
      data: { enabled: false },
    });
    return true;
  } catch {
    return false;
  }
}
