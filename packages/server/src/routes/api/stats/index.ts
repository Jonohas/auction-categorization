import { db } from "../../../db/db.ts";
import { scrapers, auctions, auctionItem, categoryProbability } from "../../../db/schema.ts";
import { eq, sql, count, avg } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/stats - Get database statistics
 */
export const GET: RouteHandler = async (req) => {
  try {
    // Get counts using drizzle-orm
    const scraperCountResult = await db.select({ count: count() }).from(scrapers);
    const auctionCountResult = await db.select({ count: count() }).from(auctions);
    const itemCountResult = await db.select({ count: count() }).from(auctionItem);
    const probabilityCountResult = await db.select({ count: count() }).from(categoryProbability);
    const enabledScrapersResult = await db.select({ count: count() }).from(scrapers).where(eq(scrapers.enabled, true));
    
    // Calculate average probability across all auctions
    const avgProbResult = await db.select({ avgProb: avg(categoryProbability.probability) }).from(categoryProbability);

    return Response.json({
      scraperCount: scraperCountResult[0]?.count || 0,
      auctionCount: auctionCountResult[0]?.count || 0,
      itemCount: itemCountResult[0]?.count || 0,
      categoryProbabilityCount: probabilityCountResult[0]?.count || 0,
      enabledScrapers: enabledScrapersResult[0]?.count || 0,
      avgProbability: avgProbResult[0]?.avgProb || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
};
