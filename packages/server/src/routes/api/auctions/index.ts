import { db } from "../../../db/db.ts";
import { auctions, auctionItem, categories, categoryProbability, scrapers } from "../../../db/schema.ts";
import { eq, desc, like, or, and, gte, lte, inArray, isNull, isNotNull, sql, count } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/auctions - List all auctions with optional filtering
 */
export const GET: RouteHandler = async (req) => {
  try {
    const url = new URL(req.url);
    const scraperId = url.searchParams.get("scraperId");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "date";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // Build where conditions
    const conditions = [];

    if (scraperId && scraperId !== "all") {
      const parsedScraperId = parseInt(scraperId, 10);
      if (!isNaN(parsedScraperId)) {
        conditions.push(eq(auctions.scraperId, parsedScraperId));
      }
    }

    if (search) {
      conditions.push(
        or(
          like(auctions.title, `%${search}%`),
          like(auctions.description, `%${search}%`)
        )
      );
    }

    // Build orderBy
    let orderBy;
    if (sortBy === "date") {
      orderBy = sortOrder === "asc" ? auctions.createdAt : desc(auctions.createdAt);
    } else {
      orderBy = desc(auctions.createdAt);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const auctionsResult = await db.query.auctions.findMany({
      where: whereClause,
      orderBy,
    });

    return Response.json(auctionsResult);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return Response.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
};
