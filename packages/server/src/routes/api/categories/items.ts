import { db } from "../../../db/db.ts";
import { categories, auctionItem, auctions, scrapers } from "../../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/categories/items - Get items by category
 */
export const GET: RouteHandler = async (req) => {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

    if (!categoryId) {
      return Response.json({ error: "Category ID is required" }, { status: 400 });
    }

    const parsedCategoryId = parseInt(categoryId, 10);
    if (isNaN(parsedCategoryId)) {
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    // Check if category exists
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, parsedCategoryId),
    });

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    const skip = (page - 1) * limit;

    // Get items with pagination
    const items = await db.query.auctionItem.findMany({
      where: eq(auctionItem.mainCategoryId, parsedCategoryId),
      orderBy: desc(auctionItem.createdAt),
      limit,
      offset: skip,
    });

    // Get total count
    const allItems = await db.query.auctionItem.findMany({
      where: eq(auctionItem.mainCategoryId, parsedCategoryId),
    });
    const total = allItems.length;

    // Get auction info for each item
    const itemsWithAuction = await Promise.all(
      items.map(async (item) => {
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
        return {
          ...item,
          auction: auctionData ? { ...auctionData, scraper: auctionScraper } : null,
        };
      })
    );

    return Response.json({
      category,
      items: itemsWithAuction,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching items by category:", error);
    return Response.json({ error: "Failed to fetch items by category" }, { status: 500 });
  }
};
