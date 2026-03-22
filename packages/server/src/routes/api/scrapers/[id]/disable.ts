import { disableScraper } from "../../../../services/scrapingService.ts";
import type { RouteHandler } from "../../../../types/requestTypes.ts";

/**
 * POST /api/scrapers/:id/disable - Disable a scraper
 */
export const POST: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid scraper ID" }, { status: 400 });
    }

    const success = await disableScraper(id);

    if (!success) {
      return Response.json({ error: "Failed to disable scraper" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error disabling scraper:", error);
    return Response.json({ error: "Failed to disable scraper" }, { status: 500 });
  }
};
