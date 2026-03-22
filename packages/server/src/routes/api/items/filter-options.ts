import { db } from "../../../db/db.ts";
import { categories, auctionItem, scrapers } from "../../../db/schema.ts";
import { eq, count } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/items/filter-options - Get filter options for items
 */
export const GET: RouteHandler = async (req) => {
  try {
    // Get all categories with item counts
    const allCategories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });

    const categoriesWithCounts = await Promise.all(
      allCategories.map(async (category) => {
        const items = await db.query.auctionItem.findMany({
          where: eq(auctionItem.mainCategoryId, category.id),
        });
        return {
          id: category.id,
          name: category.name,
          itemCount: items.length,
        };
      })
    );

    // Get enabled scrapers
    const enabledScrapers = await db.query.scrapers.findMany({
      where: eq(scrapers.enabled, true),
      orderBy: (scrapers, { asc }) => [asc(scrapers.name)],
    });

    const scrapersOutput = enabledScrapers.map((s) => ({
      id: s.id,
      name: s.name,
      imageUrl: s.image_url,
    }));

    return Response.json({
      categories: categoriesWithCounts,
      scrapers: scrapersOutput,
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return Response.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
};
