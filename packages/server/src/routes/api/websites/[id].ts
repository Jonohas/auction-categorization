import { db } from "../../../db/db.ts";
import { scrapers } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * DELETE /api/websites/:id - Delete a website (scraper)
 */
export const DELETE: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid website ID" }, { status: 400 });
    }

    const scraperId = parseInt(id, 10);
    if (isNaN(scraperId)) {
      return Response.json({ error: "Invalid website ID" }, { status: 400 });
    }

    const scraper = await db.query.scrapers.findFirst({
      where: eq(scrapers.id, scraperId),
    });

    if (!scraper) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    await db.delete(scrapers).where(eq(scrapers.id, scraperId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting website:", error);
    return Response.json({ error: "Failed to delete website" }, { status: 500 });
  }
};
