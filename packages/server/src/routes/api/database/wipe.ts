import { db } from "../../../db/db.ts";
import { auctions, auctionItem, categoryProbability } from "../../../db/schema.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface WipeTablesBody {
  tables: string[];
}

/**
 * POST /api/database/wipe - Wipe specific database tables
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as WipeTablesBody;
    const { tables } = body;

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return Response.json({ error: "Tables array is required" }, { status: 400 });
    }

    const validTables = ["auctions", "auctionItems", "categoryProbabilities"];
    const invalidTables = tables.filter((t) => !validTables.includes(t));

    if (invalidTables.length > 0) {
      return Response.json({ error: `Invalid table names: ${invalidTables.join(", ")}` }, { status: 400 });
    }

    const results: Record<string, number> = {};

    // Order matters due to foreign key constraints
    // categoryProbabilities depends on auctionItems, auctionItems depends on auctions
    if (tables.includes("categoryProbabilities")) {
      await db.delete(categoryProbability);
      results.categoryProbabilities = 0;
    }

    if (tables.includes("auctionItems")) {
      await db.delete(auctionItem);
      results.auctionItems = 0;
    }

    if (tables.includes("auctions")) {
      await db.delete(auctions);
      results.auctions = 0;
    }

    return Response.json({ success: true, deleted: results });
  } catch (error) {
    console.error("Error wiping tables:", error);
    return Response.json({ error: "Failed to wipe tables" }, { status: 500 });
  }
};
