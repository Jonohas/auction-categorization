import { db } from "../../../db/db.ts";
import { auctions, auctionItem, categories, categoryProbability, scrapers } from "../../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/auctions/:id - Get single auction with items and categorization
 */
export const GET: RouteHandler = async (req) => {
  try {
    const { id } = req.params;

    if (!id) {
      return Response.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const auctionId = parseInt(id, 10);
    if (isNaN(auctionId)) {
      return Response.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const auction = await db.query.auctions.findFirst({
      where: eq(auctions.id, auctionId),
    });

    if (!auction) {
      return Response.json({ error: "Auction not found" }, { status: 404 });
    }

    // Get items with categories and probabilities
    const items = await db.query.auctionItem.findMany({
      where: eq(auctionItem.auctionId, auctionId),
      orderBy: desc(auctionItem.createdAt),
    });

    // Get scraper for this auction
    let scraper = null;
    if (auction.scraperId) {
      scraper = await db.query.scrapers.findFirst({
        where: eq(scrapers.id, auction.scraperId),
      });
    }

    // Get category probabilities for each item
    const itemsWithProbabilities = await Promise.all(
      items.map(async (item) => {
        const probabilities = await db.query.categoryProbability.findMany({
          where: eq(categoryProbability.itemId, item.id),
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

        // Get main category
        let mainCategory = null;
        if (item.mainCategoryId !== null) {
          mainCategory = await db.query.categories.findFirst({
            where: eq(categories.id, item.mainCategoryId),
          });
        }

        return {
          ...item,
          mainCategory,
          categoryProbabilities: probabilitiesWithCategories.sort(
            (a, b) => (b.probability ?? 0) - (a.probability ?? 0)
          ),
        };
      })
    );

    return Response.json({
      ...auction,
      scraper,
      items: itemsWithProbabilities,
    });
  } catch (error) {
    console.error("Error fetching auction:", error);
    return Response.json({ error: "Failed to fetch auction" }, { status: 500 });
  }
};
