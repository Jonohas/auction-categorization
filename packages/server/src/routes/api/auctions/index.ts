import { db } from "../../../db/db.ts";
import { auctions, auctionItem, categories, categoryProbability, scrapers } from "../../../db/schema.ts";
import { eq, desc, asc, like, or, and, gte, inArray, sql, max } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/auctions - List all auctions with optional filtering
 * 
 * Query parameters:
 * - search: Filter by title/description
 * - scraperId: Filter by scraper ID ("all" = no filter)
 * - minProbability: Filter auctions with ANY item having probability >= this value (0-1)
 * - hideEmptyAuctions: "true"/"false" - hide auctions with itemsCount = 0
 * - sortBy: "date" (default) or "probability"
 * - sortOrder: "asc" or "desc" (default)
 */
export const GET: RouteHandler = async (req) => {
  try {
    const url = new URL(req.url);
    const scraperId = url.searchParams.get("scraperId");
    const search = url.searchParams.get("search");
    const minProbabilityParam = url.searchParams.get("minProbability");
    const hideEmptyAuctions = url.searchParams.get("hideEmptyAuctions");
    const sortBy = url.searchParams.get("sortBy") || "date";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // Parse minProbability
    const minProbability = minProbabilityParam ? parseFloat(minProbabilityParam) : null;
    const isValidMinProbability = minProbability !== null && !isNaN(minProbability) && minProbability >= 0 && minProbability <= 1;

    // Parse hideEmptyAuctions
    const shouldHideEmpty = hideEmptyAuctions === "true";

    // Build base conditions
    const conditions = [];

    if (scraperId && scraperId !== "all") {
      const parsedScraperId = parseInt(scraperId, 10);
      if (!isNaN(parsedScraperId)) {
        conditions.push(eq(auctions.scraperId, parsedScraperId));
      }
    }

    if (search) {
      // Escape SQL LIKE special characters (%) and (_) to prevent SQL injection
      // and unexpected LIKE pattern matching
      const escapedSearch = search.replace(/[%_]/g, "\\$&");
      conditions.push(
        or(
          like(auctions.title, `%${escapedSearch}%`),
          like(auctions.description, `%${escapedSearch}%`)
        )
      );
    }

    if (shouldHideEmpty) {
      conditions.push(sql`${auctions.itemsCount} > 0`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Handle minProbability filter - requires joining auction_items and category_probability
    // Filter auctions where ANY item has probability >= minProbability
    let auctionsResult;

    if (isValidMinProbability) {
      // Subquery to get max probability per auction
      const maxProbSubquery = db
        .select({
          auctionId: auctionItem.auctionId,
          maxProbability: max(categoryProbability.probability).as("maxProbability"),
        })
        .from(auctionItem)
        .leftJoin(categoryProbability, eq(categoryProbability.itemId, auctionItem.id))
        .groupBy(auctionItem.auctionId)
        .as("max_prob_subquery");

      // Query auctions with probability filter
      const query = db
        .select({
          id: auctions.id,
          url: auctions.url,
          title: auctions.title,
          description: auctions.description,
          startDate: auctions.startDate,
          endDate: auctions.endDate,
          itemsCount: auctions.itemsCount,
          scraperId: auctions.scraperId,
          createdAt: auctions.createdAt,
          updatedAt: auctions.updatedAt,
          maxProbability: maxProbSubquery.maxProbability,
        })
        .from(auctions)
        .leftJoin(maxProbSubquery, eq(maxProbSubquery.auctionId, auctions.id))
        .where(whereClause)
        .groupBy(auctions.id)
        .having(gte(maxProbSubquery.maxProbability, minProbability!));

      // Apply sorting
      if (sortBy === "probability") {
        query.orderBy(
          sortOrder === "asc" 
            ? asc(maxProbSubquery.maxProbability) 
            : desc(maxProbSubquery.maxProbability)
        );
      } else {
        query.orderBy(sortOrder === "asc" ? auctions.createdAt : desc(auctions.createdAt));
      }

      auctionsResult = await query;
    } else {
      // Standard query without probability filtering
      let query = db
        .select()
        .from(auctions)
        .where(whereClause);

      if (sortBy === "date") {
        query.orderBy(sortOrder === "asc" ? auctions.createdAt : desc(auctions.createdAt));
      } else {
        query.orderBy(desc(auctions.createdAt));
      }

      auctionsResult = await query;
    }

    // Fetch scraper info for each auction
    const scraperIds = [...new Set(auctionsResult.map(a => a.scraperId).filter((id): id is number => id !== null))];
    const scrapersResult = scraperIds.length > 0 
      ? await db.select().from(scrapers).where(inArray(scrapers.id, scraperIds))
      : [];
    const scrapersMap = new Map(scrapersResult.map(s => [s.id, s]));

    // Attach scraper info to auctions
    const auctionsWithScrapers = auctionsResult.map(auction => ({
      ...auction,
      scraper: auction.scraperId ? scrapersMap.get(auction.scraperId) : null,
    }));

    return Response.json(auctionsWithScrapers);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return Response.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
};
