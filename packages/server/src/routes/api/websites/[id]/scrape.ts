import { scrapeWebsite } from "../../../../services/scrapingService.ts";
import { db } from "../../../../db/db.ts";
import { scrapers } from "../../../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../../types/requestTypes.ts";

/**
 * POST /api/websites/:id/scrape - Scrape a specific website
 */
export const POST: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid website ID" }, { status: 400 });
    }

    const scraperId = parseInt(id, 10);
    if (isNaN(scraperId)) {
      return Response.json({ error: "Invalid website ID" }, { status: 400 });
    }

    // Check if scraper exists
    const scraper = await db.query.scrapers.findFirst({
      where: eq(scrapers.id, scraperId),
    });

    if (!scraper) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    const result = await scrapeWebsite(id);

    return Response.json(result);
  } catch (error) {
    console.error("Error scraping website:", error);
    return Response.json({ error: "Failed to trigger scraping" }, { status: 500 });
  }
};
