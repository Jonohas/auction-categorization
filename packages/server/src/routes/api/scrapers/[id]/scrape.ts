import { db } from "../../../../db/db.ts";
import { scrapers } from "../../../../db/schema.ts";
import { scrapeWebsite } from "../../../../services/scrapingService.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../../types/requestTypes.ts";

/**
 * POST /api/scrapers/:id/scrape - Scrape a specific scraper
 */
export const POST: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid scraper ID" }, { status: 400 });
    }

    const scraperIdNum = parseInt(id, 10);
    if (isNaN(scraperIdNum)) {
      return Response.json({ error: "Invalid scraper ID" }, { status: 400 });
    }

    // Check if scraper exists
    const scraper = await db.query.scrapers.findFirst({
      where: eq(scrapers.id, scraperIdNum),
    });

    if (!scraper) {
      return Response.json({ error: "Scraper not found" }, { status: 404 });
    }

    // Check if scraper is enabled
    if (!scraper.enabled) {
      return Response.json({ error: "Scraper is disabled" }, { status: 400 });
    }

    const result = await scrapeWebsite(id);

    return Response.json(result);
  } catch (error) {
    console.error("Error scraping scraper:", error);
    return Response.json({ error: "Failed to trigger scraping" }, { status: 500 });
  }
};
