import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";

/**
 * Wipe specific database tables
 * POST /api/wipeTables
 * Body: { tables: string[] } - array of table names to wipe: "auctions", "auctionItems", "categoryProbabilities"
 */
export const wipeTables = async (req: Request, res: Response) => {
  try {
    const { tables } = req.body as { tables?: string[] };

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({ error: "Tables array is required" });
    }

    const validTables = ["auctions", "auctionItems", "categoryProbabilities"];
    const invalidTables = tables.filter((t) => !validTables.includes(t));

    if (invalidTables.length > 0) {
      return res.status(400).json({ error: `Invalid table names: ${invalidTables.join(", ")}` });
    }

    const results: Record<string, number> = {};

    // Order matters due to foreign key constraints
    // categoryProbabilities depends on auctionItems, auctionItems depends on auctions
    if (tables.includes("categoryProbabilities")) {
      const deleted = await prisma.categoryProbability.deleteMany({});
      results.categoryProbabilities = deleted.count;
    }

    if (tables.includes("auctionItems")) {
      const deleted = await prisma.auctionItem.deleteMany({});
      results.auctionItems = deleted.count;
    }

    if (tables.includes("auctions")) {
      const deleted = await prisma.auction.deleteMany({});
      results.auctions = deleted.count;
    }

    res.json({ success: true, deleted: results });
  } catch (error) {
    console.error("Error wiping tables:", error);
    res.status(500).json({ error: "Failed to wipe tables" });
  }
};
