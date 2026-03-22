import { getScrapers } from "../../../services/scrapingService.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/scrapers - List all scrapers
 */
export const GET: RouteHandler = async (req) => {
  try {
    const scrapersList = await getScrapers();
    return Response.json(scrapersList);
  } catch (error) {
    console.error("Error fetching scrapers:", error);
    return Response.json({ error: "Failed to fetch scrapers" }, { status: 500 });
  }
};
