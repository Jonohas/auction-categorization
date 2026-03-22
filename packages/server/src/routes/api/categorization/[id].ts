import { db } from "../../../db/db.ts";
import { auctionItem, categories, categoryProbability, auctions, scrapers } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/categorization/:id - Get item categorization details
 */
export const GET: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const item = await db.query.auctionItem.findFirst({
      where: eq(auctionItem.id, itemId),
    });

    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    // Get main category
    let mainCategory = null;
    if (item.mainCategoryId !== null) {
      mainCategory = await db.query.categories.findFirst({
        where: eq(categories.id, item.mainCategoryId),
      });
    }

    // Get category probabilities
    const probabilities = await db.query.categoryProbability.findMany({
      where: eq(categoryProbability.itemId, itemId),
    });

    // Get category details for each probability
    const probabilitiesWithCategories = await Promise.all(
      probabilities.map(async (prob) => {
        let category = null;
        if (prob.categoryId !== null) {
          category = await db.query.categories.findFirst({
            where: eq(categories.id, prob.categoryId),
          });
        }
        return {
          ...prob,
          category,
        };
      })
    );

    // Get auction with scraper
    let auctionData = null;
    let auctionScraper = null;
    if (item.auctionId) {
      auctionData = await db.query.auctions.findFirst({
        where: eq(auctions.id, item.auctionId),
      });
      if (auctionData?.scraperId) {
        auctionScraper = await db.query.scrapers.findFirst({
          where: eq(scrapers.id, auctionData.scraperId),
        });
      }
    }

    return Response.json({
      ...item,
      mainCategory,
      categoryProbabilities: probabilitiesWithCategories.sort(
        (a, b) => (b.probability ?? 0) - (a.probability ?? 0)
      ),
      auction: auctionData ? { ...auctionData, scraper: auctionScraper } : null,
    });
  } catch (error) {
    console.error("Error fetching item categorization:", error);
    return Response.json({ error: "Failed to fetch item categorization" }, { status: 500 });
  }
};
