import { db } from "../../../db/db.ts";
import { auctionItem, categories, categoryProbability, auctions, scrapers } from "../../../db/schema.ts";
import { eq, desc, like, or, and, inArray, lte, count, sql } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/items/all - Get all items with filtering
 */
export const GET: RouteHandler = async (req) => {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const categoryIds = url.searchParams.get("categoryIds");
    const minProbability = url.searchParams.get("minProbability");
    const scraperIds = url.searchParams.get("scraperIds");
    const maxPrice = url.searchParams.get("maxPrice");
    const sortBy = url.searchParams.get("sortBy") || "date";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));

    // Build where clause
    const conditions: ReturnType<typeof eq>[] = [];

    // Title/description search
    if (search) {
      conditions.push(
        or(
          like(auctionItem.title, `%${search}%`),
          like(auctionItem.description, `%${search}%`)
        ) as ReturnType<typeof eq>
      );
    }

    // Category filter
    if (categoryIds) {
      const catIds = categoryIds
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (catIds.length > 0) {
        conditions.push(inArray(auctionItem.mainCategoryId, catIds) as ReturnType<typeof eq>);
      }
    }

    // Max price filter
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
        conditions.push(lte(auctionItem.currentPrice, maxPriceNum) as ReturnType<typeof eq>);
      }
    }

    // Scrapers filter
    if (scraperIds) {
      const scrIds = scraperIds
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
      if (scrIds.length > 0) {
        // Get auctions with these scrapers
        const targetAuctions = await db.query.auctions.findMany({
          where: inArray(auctions.scraperId, scrIds),
        });
        const auctionIds = targetAuctions.map((a) => a.id);
        if (auctionIds.length > 0) {
          conditions.push(inArray(auctionItem.auctionId, auctionIds) as ReturnType<typeof eq>);
        }
      }
    }

    // Note: minProbability filter is complex - it requires filtering items based on 
    // their mainCategory's probability meeting the threshold. This would require a 
    // complex join query with categoryProbability table. Currently not implemented.

    // Pagination
    const skip = (page - 1) * limit;

    // Sorting
    let orderBy;
    if (sortBy === "price") {
      orderBy = sortOrder === "asc" ? auctionItem.currentPrice : desc(auctionItem.currentPrice);
    } else {
      orderBy = sortOrder === "asc" ? auctionItem.createdAt : desc(auctionItem.createdAt);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count using a separate query
    const totalResult = await db
      .select({ count: count() })
      .from(auctionItem)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    const items = await db.query.auctionItem.findMany({
      where: whereClause,
      orderBy,
      limit,
      offset: skip,
    });

    // Get main category, auction with scraper, and probabilities for each item
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        // Get main category
        let mainCategory = null;
        if (item.mainCategoryId !== null) {
          mainCategory = await db.query.categories.findFirst({
            where: eq(categories.id, item.mainCategoryId),
          });
        }

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

        // Get category probabilities
        const probabilities = await db.query.categoryProbability.findMany({
          where: eq(categoryProbability.itemId, item.id),
        });

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

        return {
          ...item,
          mainCategory,
          auction: auctionData ? { ...auctionData, scraper: auctionScraper } : null,
          categoryProbabilities: probabilitiesWithCategories.sort(
            (a, b) => (b.probability ?? 0) - (a.probability ?? 0)
          ),
        };
      })
    );

    return Response.json({
      items: itemsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all items:", error);
    return Response.json({ error: "Failed to fetch items" }, { status: 500 });
  }
};
