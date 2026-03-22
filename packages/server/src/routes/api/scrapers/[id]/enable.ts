import { enableScraper } from "../../../../services/scrapingService.ts";
import type { RouteHandler } from "../../../../types/requestTypes.ts";

/**
 * POST /api/scrapers/:id/enable - Enable a scraper
 */
export const POST: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid scraper ID" }, { status: 400 });
    }

    const success = await enableScraper(id);

    if (!success) {
      return Response.json({ error: "Failed to enable scraper" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error enabling scraper:", error);
    return Response.json({ error: "Failed to enable scraper" }, { status: 500 });
  }
};
