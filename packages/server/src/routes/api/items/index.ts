import { db } from "../../../db/db.ts";
import { auctionItem } from "../../../db/schema.ts";
import { eq, desc, like, or, and, type SQL } from "drizzle-orm";
import type { RouteHandler } from "../../../types/requestTypes.ts";

/**
 * GET /api/items - Get items for an auction
 */
export const GET: RouteHandler = async (req) => {
  try {
    const url = new URL(req.url);
    const auctionId = url.searchParams.get("auctionId");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "date";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

    if (!auctionId) {
      return Response.json({ error: "Auction ID is required" }, { status: 400 });
    }

    const parsedAuctionId = parseInt(auctionId, 10);
    if (isNaN(parsedAuctionId)) {
      return Response.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    // Build where conditions
    const baseCondition = eq(auctionItem.auctionId, parsedAuctionId);
    
    let whereClause: SQL = baseCondition;
    
    if (search) {
      const searchCondition = or(
        like(auctionItem.title, `%${search}%`),
        like(auctionItem.description, `%${search}%`)
      );
      if (searchCondition) {
        whereClause = and(baseCondition, searchCondition) ?? baseCondition;
      }
    }

    // Build orderBy
    let orderBy;
    if (sortBy === "price") {
      orderBy = sortOrder === "asc" ? auctionItem.currentPrice : desc(auctionItem.currentPrice);
    } else if (sortBy === "date") {
      orderBy = sortOrder === "asc" ? auctionItem.createdAt : desc(auctionItem.createdAt);
    } else {
      orderBy = desc(auctionItem.createdAt);
    }

    const skip = (page - 1) * limit;

    const items = await db.query.auctionItem.findMany({
      where: whereClause,
      orderBy,
      limit,
      offset: skip,
    });

    // Get total count
    const allItems = await db.query.auctionItem.findMany({
      where: eq(auctionItem.auctionId, parsedAuctionId),
    });
    const total = allItems.length;

    return Response.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return Response.json({ error: "Failed to fetch items" }, { status: 500 });
  }
};
