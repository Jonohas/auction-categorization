import { db } from "../../../db/db.ts";
import { auctions, auctionItem, categories, categoryProbability } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { categorizeAuctionItems } from "../../../services/aiCategorization.ts";
import type { RouteHandler } from "../../../types/requestTypes.ts";

interface CategorizeAuctionBody {
  auctionId: string;
  saveResults?: boolean;
}

/**
 * POST /api/categorization/auction - Categorize all items in an auction
 */
export const POST: RouteHandler = async (req) => {
  try {
    const body = await req.json() as CategorizeAuctionBody;
    const { auctionId, saveResults = true } = body;

    if (!auctionId) {
      return Response.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const parsedAuctionId = parseInt(auctionId, 10);
    if (isNaN(parsedAuctionId)) {
      return Response.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    // Fetch the auction with items
    const auction = await db.query.auctions.findFirst({
      where: eq(auctions.id, parsedAuctionId),
    });

    if (!auction) {
      return Response.json({ error: "Auction not found" }, { status: 404 });
    }

    const items = await db.query.auctionItem.findMany({
      where: eq(auctionItem.auctionId, parsedAuctionId),
    });

    if (items.length === 0) {
      return Response.json({ error: "Auction has no items" }, { status: 400 });
    }

    // Fetch all categories
    const allCategories = await db.query.categories.findMany();

    if (allCategories.length === 0) {
      return Response.json({ error: "No categories defined" }, { status: 400 });
    }

    const categoriesForAI = allCategories.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      description: c.description ?? null,
      isSystem: c.isSystem ?? false,
    }));

    // Categorize all items in the auction
    const results = await categorizeAuctionItems(
      auction.id.toString(),
      items.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        description: item.description,
      })),
      categoriesForAI
    );

    // Optionally save results to the database
    if (saveResults) {
      for (const result of results) {
        if (result.probabilities.length > 0) {
          const itemIdNum = parseInt(result.itemId, 10);

          // Delete existing probabilities for this item
          const existingProbs = await db.query.categoryProbability.findMany({
            where: eq(categoryProbability.itemId, itemIdNum),
          });

          for (const prob of existingProbs) {
            await db.delete(categoryProbability).where(eq(categoryProbability.id, prob.id));
          }

          // Create new probabilities
          for (const p of result.probabilities) {
            await db.insert(categoryProbability).values({
              itemId: itemIdNum,
              categoryId: parseInt(p.categoryId, 10),
              probability: p.probability,
            });
          }

          // Set main category to the one with highest probability only if >= 50%
          const highestProbability = result.probabilities.reduce((max, p) =>
            p.probability > max.probability ? p : max
          );

          // Only set main category if probability is above 50%, otherwise clear it
          await db.update(auctionItem).set({
            mainCategoryId: highestProbability.probability >= 0.5
              ? parseInt(highestProbability.categoryId, 10)
              : null,
          }).where(eq(auctionItem.id, itemIdNum));
        }
      }
    }

    return Response.json({
      auctionId: auction.id,
      itemCount: results.length,
      results,
      saved: saveResults,
    });
  } catch (error) {
    console.error("Error categorizing auction:", error);
    return Response.json({ error: "Failed to categorize auction" }, { status: 500 });
  }
};
