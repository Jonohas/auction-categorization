import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";
import { triggerScraperScrape } from "../../../services/scrapingService";
import { scraperFactory } from "../../../scrapers";
import { BopaScraper } from "../../../scrapers/bopaScraper";

export const scrapeScraper = async (req: Request, res: Response) => {
  try {
    const { scraperId } = await req.body;

    // Sanitize input
    const sanitizedScraperId = sanitizeId(scraperId);

    if (!sanitizedScraperId) {
      return res.status(400).json({ error: "Invalid scraper ID" });
    }

    // Guard rail: Check if scraper exists
    const scraper = await prisma.scraper.findUnique({
      where: { id: sanitizedScraperId },
    });

    if (!scraper) {
      return res.status(404).json({ error: "Scraper not found" });
    }

    // Guard rail: Check if scraper is enabled
    if (!scraper.enabled) {
      return res.status(400).json({ error: "Scraper is disabled" });
    }

    // Guard rail: Check if we have a valid scraper implementation
    const scraperImpl = scraperFactory.getScraper(scraper.url);
    if (!(scraperImpl instanceof BopaScraper)) {
      return res.status(400).json({ error: "No scraper available for this URL" });
    }

    const result = await triggerScraperScrape(sanitizedScraperId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger scraping" });
  }
};
