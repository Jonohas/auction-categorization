import { scrapeAllWebsites } from "../../../services/scrapingService.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * POST /api/auctions/trigger-scrape - Trigger scraping for all enabled websites
 */
export const POST: RouteHandler = async (req) => {
  try {
    const results = await scrapeAllWebsites();
    return Response.json(results);
  } catch (error) {
    console.error("Error triggering scrape:", error);
    return Response.json({ error: "Failed to trigger scraping" }, { status: 500 });
  }
};
